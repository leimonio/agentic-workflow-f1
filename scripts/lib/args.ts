export const flag = (name: string) => process.argv.includes(`--${name}`)
export const option = (name: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? undefined : process.argv[i + 1]
}
