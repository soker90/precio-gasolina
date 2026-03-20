import { readFile, writeFile } from './fileUtils.js'
import fs from 'fs'
import path from 'path'

const FUEL_STATION_ID = process.env.FUEL_STATION_ID
const DATA_FILE = process.env.DATA_FILE || './data.json'
const GEOPORTAL_URL = `https://geoportalgasolineras.es/rest/${FUEL_STATION_ID}/busquedaEstacionPrecio`

const date = new Intl.DateTimeFormat('es-ES', { month: 'numeric', day: 'numeric' }).format(Date.now())

// Archivo temporal de precios previos (mismo directorio que DATA_FILE, prefijo "previous-")
const dataFileDir = path.dirname(DATA_FILE)
const dataFileBase = path.basename(DATA_FILE)
const PREV_FILE = path.join(dataFileDir, `previous-${dataFileBase}`)

fetch(GEOPORTAL_URL, { headers: { 'Accept': 'application/json' } })
.then(res => res.json())
.then((stationData) => {
    let dataSaved = readFile(DATA_FILE)
    
    if(dataSaved.dates.at(-1) === date){
      // Mismo día: guardar precios actuales antes de sobreescribir
      const numElments = dataSaved.dates.length - 1
      fs.writeFileSync(PREV_FILE, JSON.stringify({
        date,
        gasolina: dataSaved.gasolina[numElments],
        diesel: dataSaved.diesel[numElments],
      }, null, 2))
      dataSaved.gasolina[numElments] = stationData.precioGasolina95E5
      dataSaved.diesel[numElments] = stationData.precioGasoleoA
    } else {
      // Día nuevo: eliminar archivo previo si existe (no aplica comparación intra-día)
      if (fs.existsSync(PREV_FILE)) fs.unlinkSync(PREV_FILE)
      dataSaved.dates.push(date)
      dataSaved.gasolina.push(stationData.precioGasolina95E5)
      dataSaved.diesel.push(stationData.precioGasoleoA)
    }
    
    // Mantener solo los últimos 45 días
    dataSaved.dates    = dataSaved.dates.slice(-45)
    dataSaved.gasolina = dataSaved.gasolina.slice(-45)
    dataSaved.diesel   = dataSaved.diesel.slice(-45)

    writeFile(dataSaved, DATA_FILE)

    console.log(`Guardado con fecha ${date}: gasolina: ${stationData.precioGasolina95E5} y gasoil: ${stationData.precioGasoleoA}`)
    
})
  .catch(err => {
    console.error(err)
  })
