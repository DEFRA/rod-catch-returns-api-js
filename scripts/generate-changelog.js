import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

export const REPO_URL = 'https://github.com/DEFRA/rod-catch-returns-api-js'

export const SEMVER_TAG_REGEX = /^v[0-9]\.[0-9]{1,3}\.[0-9]{1,2}$/

export function getGithubUsername(email) {
  const match = email.match(/^(?:\d+\+)?(.+)@users\.noreply\.github\.com$/)
  return match ? match[1] : null
}

export function shouldExclude(title) {
  if (/^\d+\.\d+\.\d+(-rc\.\d+|-beta\.\d+)?$/.test(title)) return true
  if (/^SEMVER-MAJOR.*Release/.test(title)) return true
  return false
}

export function getCommits(startRef, endRef) {
  const range = startRef ? `${startRef}..${endRef}` : endRef
  try {
    const output = execSync(
      `git log ${range} --format="%s|||%an|||%ae" --no-merges`,
      { encoding: 'utf-8' }
    ).trim()

    if (!output) return []

    return output
      .split('\n')
      .map((line) => {
        const [subject, authorName, authorEmail] = line.split('|||')
        const prMatch = subject.match(/\(#(\d+)\)$/)
        const title = subject.replace(/\s*\(#\d+\)$/, '')
        const prNumber = prMatch ? prMatch[1] : null
        const username = getGithubUsername(authorEmail)
        return { title, prNumber, authorName, username }
      })
      .filter((c) => !shouldExclude(c.title))
  } catch {
    return []
  }
}

export function formatSection(commits) {
  if (!commits.length) return null

  const lines = commits.map((c) => {
    const prLink = c.prNumber
      ? ` [#${c.prNumber}](${REPO_URL}/pull/${c.prNumber})`
      : ''
    const author = c.username
      ? ` ([@${c.username}](https://github.com/${c.username}))`
      : ` (${c.authorName})`
    return `- ${c.title}${prLink}${author}`
  })

  return `\n${lines.join('\n')}\n`
}

// Only run when executed directly, not when imported by tests
if (!process.env.JEST_WORKER_ID) {
  const allTags = execSync('git tag --sort=v:refname', { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter((tag) => SEMVER_TAG_REGEX.test(tag))

  console.log(
    `Found ${allTags.length} full release tags: ${allTags.join(', ')}`
  )

  const sections = allTags.reduceRight((acc, tag, i) => {
    const isFirst = i === 0
    const startRef = isFirst ? null : allTags[i - 1]
    const label = isFirst ? `initial..${tag}` : `${startRef}..${tag}`
    console.log(`Processing ${label}`)

    const commits = getCommits(startRef, tag)
    const body = formatSection(commits)

    if (!body) return acc

    const heading = `\n## ${tag.replace(/^v/, '')}\n`
    return [...acc, `${heading}${body}`]
  }, [])

  const changelog = `# Changelog\n${sections.join('\n')}`

  writeFileSync('CHANGELOG.md', changelog)
  console.log('\nCHANGELOG.md generated successfully')
}
