// const data = d3.json("data/data.json").then(response);

// function response(l) {
//   let duration = 250;
//   let n = 10;
//   console.log(l);
// }

let filter = "TV";

async function init() {
  const response = await fetch("data/data.json");
  const data0 = await response.json();

  // Grouper le tableau par semaine
  const data = d3.groups(data0, (d) => d.week).reverse();

  let weekcounter = 1;
  for (let week of data) {
    function charts() {
      // Appliquer le filtre
      let weekFiltered = week[1].filter((w) => w.category == "TV");
      console.log(weekFiltered);
    }

    charts();

    // setTimeout(charts, weekcounter * 1000);
    // weekcounter++;
  }
}

const data = {
  labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  datasets: [{
    label: 'Weekly Sales',
    data: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],

    backgroundColor: [
      'red',
      'red',
      'red',
      'red',
      'red',
      'red',
      'red',
      'red',
      'red',
      'red',

    ],

  }]
};

// config 
const config = {
  type: 'bar',
  data,
  options: {
    indexAxis: 'y',

    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 20

          }

        }

      }
    }
  }



};

// render init block
const myChart = new Chart(
  document.getElementById('myChart'),
  config
);











init();
