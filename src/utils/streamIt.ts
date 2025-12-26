export const streamIt = (json: Object) => {
  const objectString = JSON.stringify(json)
  return `data: ${objectString}\n\n`
}
