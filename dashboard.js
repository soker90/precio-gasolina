import { getDateAge, validatePriceData } from './price-data.js'

const GASOLINA_COLOR = { border: 'rgb(231, 76, 60)', bg: 'rgba(231, 76, 60, 0.08)' }
const DIESEL_COLOR = { border: 'rgb(41, 128, 185)', bg: 'rgba(41, 128, 185, 0.08)' }

function chartOptions(data, labels) {
  return {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Gasolina 95',
          data: data.gasolina,
          borderColor: GASOLINA_COLOR.border,
          backgroundColor: GASOLINA_COLOR.bg,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Diesel A',
          data: data.diesel,
          borderColor: DIESEL_COLOR.border,
          backgroundColor: DIESEL_COLOR.bg,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: 'Inter', size: 12 }, boxWidth: 12, padding: 16 },
        },
        tooltip: {
          callbacks: {
            label: context => ` ${context.dataset.label}: ${context.parsed.y.toLocaleString('es-ES', { minimumFractionDigits: 3 })} €/L`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: '#f0f0f0' },
          ticks: { font: { family: 'Inter', size: 11 }, maxTicksLimit: 10 },
        },
        y: {
          grid: { color: '#f0f0f0' },
          ticks: {
            font: { family: 'Inter', size: 11 },
            callback: value => `${value.toLocaleString('es-ES', { minimumFractionDigits: 3 })} €`,
          },
        },
      },
    },
  }
}

function renderStation({ id, filename, name }) {
  return fetch(`./${filename}?v=${Date.now()}`, { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status} al cargar ${filename}`)
      return response.json()
    })
    .then(data => {
      validatePriceData(data, filename)
      const gasoline = data.gasolina.at(-1)
      const diesel = data.diesel.at(-1)
      const lastDate = data.dates.at(-1)

      document.getElementById(`${id}-gasolina`).innerHTML =
        `${gasoline.toLocaleString('es-ES', { minimumFractionDigits: 3 })}<span> €/L</span>`
      document.getElementById(`${id}-diesel`).innerHTML =
        `${diesel.toLocaleString('es-ES', { minimumFractionDigits: 3 })}<span> €/L</span>`
      document.getElementById(`${id}-date`).textContent = `Última actualización: ${lastDate}`

      const canvas = document.getElementById(`chart-${id}`)
      new Chart(canvas, chartOptions(data, data.dates))

      return { name, lastDate, age: getDateAge(lastDate) }
    })
}

async function loadDashboard() {
  const status = document.getElementById('data-status')
  const stations = [
    { id: 'barataria', filename: 'data.json', name: 'Barataria' },
    { id: 'plazatoros', filename: 'data-5143.json', name: 'Plaza de Toros' },
  ]

  const results = await Promise.allSettled(stations.map(renderStation))
  const loaded = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value)
  const failed = results
    .filter(result => result.status === 'rejected')
    .map((result, index) => `${stations[results.indexOf(result)].name}: ${result.reason.message}`)

  if (loaded.length === 0) {
    status.textContent = `No se han podido cargar los precios. ${failed.join(' · ')}`
    status.classList.add('error')
    return
  }

  const stale = loaded.filter(station => station.age === null || station.age > 1)
  const messages = loaded.map(station => `${station.name}: ${station.lastDate}`)

  if (failed.length > 0) {
    status.textContent = `No se han podido cargar todos los datos. ${failed.join(' · ')}`
    status.classList.add('warning')
  } else if (stale.length > 0) {
    status.textContent = `Aviso: puede haber precios desactualizados. ${messages.join(' · ')}`
    status.classList.add('warning')
  } else {
    status.textContent = `Precios cargados correctamente. ${messages.join(' · ')}`
  }
}

loadDashboard().catch(error => {
  const status = document.getElementById('data-status')
  status.textContent = `No se han podido cargar los precios: ${error.message}`
  status.classList.add('error')
  console.error('Error cargando precios:', error)
})
