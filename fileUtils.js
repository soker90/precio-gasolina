import fs from 'fs'

export const readFile = () =>{
  const fileSaved = fs.readFileSync('./data.json', 'utf8')
  return JSON.parse(fileSaved)
}

export const writeFile = dataSaved =>{
  const newData = JSON.stringify(dataSaved, null, 2);
  fs.writeFileSync('./data.json', newData)
}