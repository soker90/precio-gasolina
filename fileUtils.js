import fs from 'fs'

const DEFAULT_FILE = './data.json'

export const readFile = (file = DEFAULT_FILE) => {
  const fileSaved = fs.readFileSync(file, 'utf8')
  return JSON.parse(fileSaved)
}

export const writeFile = (dataSaved, file = DEFAULT_FILE) => {
  const newData = JSON.stringify(dataSaved, null, 2);
  fs.writeFileSync(file, newData)
}