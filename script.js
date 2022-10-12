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

init();
