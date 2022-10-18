// const data = d3.json("data/data.json").then(response);


// function response(l) {
//   let duration = 250;
//   let n = 10;
//   console.log(l);
// }



let filter = "TV";

async function init() {
  const response = await fetch("data/data.json");
  let data = await response.json();


  data = data
    .filter((d) => d.category === "Films (English)" || d.category === "TV (English)")
    .map((d) => {
      delete d.cumulative_weeks_in_top_10;

      return d;

    });








  // Grouper le tableau par semaine
  data = d3.groups(data, (d) => d.week).reverse();

  // console.log(data);


  let weekcounter = 1;
  for (let week of data) {
    function charts() {
      // Appliquer le filtre
      let weekFiltered = week[1].filter((w) => w.category == "TV");
      // console.log(weekFiltered);
      //@todo trier par ordre decroissant le nombre de vue
      // const compare = (a, b) => b.weekly_hours_viewed - a.weekly_hours_viewed;
      // weekFiltered.sort(compare);
      // console.log('tableau trier', weekFiltered)


    }

    //@todo stock la valeur actuelle 



    charts();



    // setTimeout(charts, weekcounter * 1000);
    // weekcounter++;
  }


  //@todo crée une function formate data qui renvoie la data au mm format que mon data ligne 37
}

// let datachange = document.querySelector('btn_play')
// document.addEventListener("click", dataChangement);

// function dataChangement() {

//   // Permettre de changer de date automatiquement toutes les 2 secondes quand on effectue la fonction qui précède


//   myChart.data.datasets[0].data[5] = 100;
//   setTimeout(datachange, 2000);
//   myChart.update();

// }









const data = {
  labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  datasets: [{
    label: 'Weekly Sales',
    data: [18, 15, 13, 11, 9, 7, 6, 5, 3, 2],
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
    borderRadius: [
      '10',
    ]


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
        beginAtZero: true
      }

    }




  },



}




// render init block
const myChart = new Chart(
  document.getElementById('myChart'),
  config
);


init();


