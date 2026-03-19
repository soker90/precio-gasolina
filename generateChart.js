import QuickChart from 'quickchart-js'

export const generateChart = ( dataSaved, type, dataSaved2 = null, stationName1 = null, stationName2 = null ) => {
  const chart = new QuickChart();

  chart.setWidth(500)
  chart.setHeight(300);

  const data1 = dataSaved[type].slice(-250)
  const allValues = dataSaved2
    ? [...data1, ...dataSaved2[type].slice(-250)]
    : data1

  const datasets = [
    {
      label: stationName1 || type,
      display: false,
      data: data1,
      borderColor: 'rgb(255, 99, 132)',
      fill: false,
    },
  ]

  if (dataSaved2) {
    datasets.push({
      label: stationName2 || type,
      display: false,
      data: dataSaved2[type].slice(-250),
      borderColor: 'rgb(54, 162, 235)',
      fill: false,
    })
  }

  chart.setConfig({
    type: 'line',
    data: {
      labels: dataSaved.dates.slice(-250),
      datasets,
    },
    options: {
      responsive: true,
      scales: {
        yAxes: [
            {
              ticks: {
                min: Math.trunc(Math.min(...allValues) * 100) / 100,
                max: Math.max(...allValues),
                callback: (val) => {
                  return val.toLocaleString() + '€';
                },
              },
            },
        ],
    }
    },
  });

  return chart.getUrl()
}
