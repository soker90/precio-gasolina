import fs from 'fs'
import fetch from 'node-fetch'

const FUEL_STATION_ID = 5205
const GEOPORTAL_URL = `https://geoportalgasolineras.es/rest/${FUEL_STATION_ID}/busquedaEstacionPrecio`

const date = new Intl.DateTimeFormat('es-ES').format(Date.now());

fetch(GEOPORTAL_URL, {headers: { 'Accept': ' application/json' }})
.then(res => res.json())
.then((stationData) => {
    const fileSaved = fs.readFileSync('./data.json', 'utf8')
    let dataSaved = JSON.parse(fileSaved)
  
    
    dataSaved.dates.push(date)
    dataSaved.gasolina.push(stationData.precioGasolina95E5)
    dataSaved.diesel.push(stationData.precioGasoleoA)
  
    const newData = JSON.stringify(dataSaved, null, 2);
    fs.writeFileSync('./data.json', newData)

    console.log(`Guardado con fecha ${date}: gasolina: ${stationData.precioGasolina95E5} y gasoil: ${stationData.precioGasoleoA}`)
    
})
  .catch(err => {
    console.error(err)
  })
