export const unwrap = (result) => {
  if (result.status === 'rejected') {
    throw result.reason
  }
  return result.value
}
