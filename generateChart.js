import QuickChart from 'quickchart-js'

export const generateChart = ( dataSaved, type ) => {
  const chart = new QuickChart();

  chart.setWidth(500)
  chart.setHeight(300);

  chart.setConfig({
    type: 'line',
    data: {
      labels: dataSaved.dates.slice(-250),
      datasets: [
        {
          label: type,
          display: false,
          data: dataSaved[type].slice(-250),
          borderColor: 'rgb(255, 99, 132)',
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        yAxes: [
            {
              ticks: {
                min: Math.trunc(Math.min(...dataSaved[type].slice(-250)) * 100) / 100,
                max: Math.max(...dataSaved[type].slice(-250)),
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
