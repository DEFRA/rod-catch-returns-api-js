import {
  SEMVER_TAG_REGEX,
  formatSection,
  getCommits,
  getGithubUsername,
  shouldExclude
} from '../generate-changelog.js'

import { execSync } from 'node:child_process'

jest.mock('node:child_process', () => ({
  execSync: jest.fn()
}))

const buildGitLogLine = (
  subject,
  authorName = 'Gandalf Grey',
  authorEmail = 'gandalf.grey@example.com'
) => `${subject}|||${authorName}|||${authorEmail}`

describe('generate-changelog.unit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('SEMVER_TAG_REGEX', () => {
    it.each(['v0.0.2', 'v1.0.0', 'v0.12.0', 'v9.999.99'])(
      'matches valid semver tag %s',
      (tag) => {
        expect(SEMVER_TAG_REGEX.test(tag)).toBe(true)
      }
    )

    it.each([
      'v1.1.0-rc.0',
      'v0.11.1-beta.3',
      'iwtf-4829-test-the-thing',
      '1234-try-this-out',
      'v1.0',
      'v1.0.0.0'
    ])('does not match non-semver tag %s', (tag) => {
      expect(SEMVER_TAG_REGEX.test(tag)).toBe(false)
    })
  })

  describe('getGithubUsername', () => {
    it('extracts a plain GitHub username from a noreply email', () => {
      expect(getGithubUsername('aragorn@users.noreply.github.com')).toBe(
        'aragorn'
      )
    })

    it('extracts a GitHub username from a noreply email with numeric prefix', () => {
      expect(
        getGithubUsername('12345678+aragorn@users.noreply.github.com')
      ).toBe('aragorn')
    })

    it('returns null for a regular email address', () => {
      expect(getGithubUsername('aragorn@example.com')).toBeNull()
    })
  })

  describe('shouldExclude', () => {
    it.each(['1.0.0', '0.12.0', '1.1.0-rc.0', '0.11.1-beta.3'])(
      'excludes version bump commit "%s"',
      (title) => {
        expect(shouldExclude(title)).toBe(true)
      }
    )

    it.each(['SEMVER-MAJOR: Release 0.12.0', 'SEMVER-MAJOR Release 1.0.0'])(
      'excludes SEMVER-MAJOR release commit "%s"',
      (title) => {
        expect(shouldExclude(title)).toBe(true)
      }
    )

    it.each([
      'Fix missing parameter in performance improvement',
      'Add logging to all requests (#121)',
      'Update README'
    ])('does not exclude regular commit "%s"', (title) => {
      expect(shouldExclude(title)).toBe(false)
    })
  })

  describe('getCommits', () => {
    it('calls git log with the correct range when both refs are provided', () => {
      execSync.mockReturnValue(
        buildGitLogLine('Add logging to all requests (#121)')
      )

      getCommits('v0.9.0', 'v0.10.0')

      expect(execSync).toHaveBeenCalledWith(
        'git log v0.9.0..v0.10.0 --format="%s|||%an|||%ae" --no-merges',
        { encoding: 'utf-8' }
      )
    })

    it('calls git log with the end ref only when startRef is null', () => {
      execSync.mockReturnValue(buildGitLogLine('Initial commit'))

      getCommits(null, 'v0.0.2')

      expect(execSync).toHaveBeenCalledWith(
        'git log v0.0.2 --format="%s|||%an|||%ae" --no-merges',
        { encoding: 'utf-8' }
      )
    })

    it('returns parsed commits with title, PR number, and resolved GitHub usernames', () => {
      execSync.mockReturnValue(
        [
          buildGitLogLine(
            'Add logging to all requests (#121)',
            'Gandalf Grey',
            '12345+gandalfgrey@users.noreply.github.com'
          ),
          buildGitLogLine(
            'Fix missing parameter (#122)',
            'Frodo Baggins',
            'frodo.baggins@example.com'
          ),
          buildGitLogLine(
            ' Trim trailing whitespace   (#123)',
            'Treebeard',
            'fangornfan@example.com'
          )
        ].join('\n')
      )

      expect(getCommits('v0.9.0', 'v0.10.0')).toStrictEqual([
        {
          title: 'Add logging to all requests',
          prNumber: '121',
          authorName: 'Gandalf Grey',
          username: 'gandalfgrey'
        },
        {
          title: 'Fix missing parameter',
          prNumber: '122',
          authorName: 'Frodo Baggins',
          username: null
        },
        {
          title: 'Trim trailing whitespace',
          prNumber: '123',
          authorName: 'Treebeard',
          username: null
        }
      ])
    })

    it('returns only non-excluded commits when version bump and release commits are present', () => {
      execSync.mockReturnValue(
        [
          buildGitLogLine(
            '1.0.0',
            'GitHub Actions',
            'actions@users.noreply.github.com'
          ),
          buildGitLogLine('SEMVER-MAJOR: Release 0.12.0'),
          buildGitLogLine(
            'Add real feature (#99)',
            'Merry Brandybuck',
            'merry.brandybuck@example.com'
          )
        ].join('\n')
      )

      expect(getCommits('v0.11.0', 'v1.0.0')).toStrictEqual([
        {
          title: 'Add real feature',
          prNumber: '99',
          authorName: 'Merry Brandybuck',
          username: null
        }
      ])
    })

    it('returns an empty array when there are no commits in range', () => {
      execSync.mockReturnValue('')

      expect(getCommits('v0.9.0', 'v0.10.0')).toStrictEqual([])
    })

    it('returns an empty array when execSync throws', () => {
      execSync.mockImplementation(() => {
        throw new Error('git error')
      })

      expect(getCommits('v0.9.0', 'v0.10.0')).toStrictEqual([])
    })
  })

  describe('formatSection', () => {
    it('formats a commit with a PR link and GitHub username', () => {
      const commits = [
        {
          title: 'Add logging to all requests',
          prNumber: '121',
          authorName: 'Samwise Gamgee',
          username: 'samwisegamgee'
        }
      ]

      expect(formatSection(commits)).toBe(
        '\n- Add logging to all requests [#121](https://github.com/DEFRA/rod-catch-returns-api-js/pull/121) ([@samwisegamgee](https://github.com/samwisegamgee))'
      )
    })

    it('formats a commit without a PR link when prNumber is null', () => {
      const commits = [
        {
          title: 'Initial commit',
          prNumber: null,
          authorName: 'Pippin Took',
          username: null
        }
      ]

      expect(formatSection(commits)).toBe('\n- Initial commit (Pippin Took)')
    })

    it('formats multiple commits as separate lines', () => {
      const commits = [
        {
          title: 'First change',
          prNumber: '10',
          authorName: 'Bilbo Baggins',
          username: 'devone'
        },
        {
          title: 'Second change',
          prNumber: '11',
          authorName: 'Frodo Baggins',
          username: null
        }
      ]

      expect(formatSection(commits)).toBe(
        '\n- First change [#10](https://github.com/DEFRA/rod-catch-returns-api-js/pull/10) ([@devone](https://github.com/devone))\n' +
          '- Second change [#11](https://github.com/DEFRA/rod-catch-returns-api-js/pull/11) (Frodo Baggins)'
      )
    })

    it('returns null for an empty commits array', () => {
      expect(formatSection([])).toBeNull()
    })
  })
})
