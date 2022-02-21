const fs = require('fs')

const FUEL_STATION_ID = 5205
const GEOPORTAL_URL = `https://geoportalgasolineras.es/rest/${5205}/busquedaEstacionPrecio`

const date = Date.now();

fetch(GEOPORTAL_URL).then(stationData => {
    const fileSaved = fs.readFileSync('./data.txt', 'utf8')
    let dataSaved = JSON.parse(fileSaved)
    
    dataSaved.dates.push(Date.now())
    dataSaved.gasolina.push(stationData.precioGasolina95E5)
    dataSaved.diesel.push(stationData.precioGasoleoA)
  
    const newData = JSON.stringify(dataSaved, null, 2);
    fs.writeFileSync('./data.txt', newData)
    
})
  .catch(err => {
    console.error(`${url} can't be downloaded. Error:`)
    console.error(err)
  })
