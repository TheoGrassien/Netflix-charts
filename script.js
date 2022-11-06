let filter = "TV (English)";

async function init() {
  const response = await fetch("data/data.json");
  let data = await response.json();

  // Traitement du tableau de données

  data = data
    // Appliquer le filtre
    .filter((d) => d.category === filter)

    // Supprimer les données inutiles
    .map((d) => {
      delete d.cumulative_weeks_in_top_10;
      return d;
    })
    .map((d) => {
      if (d.season_title != "N/A") {
        d.show_title = d.season_title;
      }
      return d;
    });

  // Il faudrait aussi faire en sorte qui si une saison est renseigné remplacé le show_title par le nom de la série

  // Grouper le tableau par semaine
  const keyframes0 = d3.groups(data, (d) => d.week).reverse();

  let mem = [];
  for (s of keyframes0[0][1]) {
    mem[s.show_title] = s.weekly_hours_viewed;
  }
  let keyframeInterpolateNumber = 10;
  let keyframes = [keyframes0.shift()];

  function interpolate(b, a, i, n) {
    return (a * i) / n + (b * (n - i)) / n;
  }

  for (let k of keyframes0) {
    for (let i = 1; i <= keyframeInterpolateNumber; i++) {
      let kp = [];
      kp[0] = k[0] + "-" + (1000 + i);
      kp[1] = [];
      for (let sp of k[1]) {
        kp[1].push({
          show_title: sp.show_title,
          weekly_hours_viewed: interpolate(
            mem[sp.show_title] || 0,
            sp.weekly_hours_viewed,
            i,
            keyframeInterpolateNumber
          ),
        });
      }
      kp[1].sort((a, b) => b.weekly_hours_viewed - a.weekly_hours_viewed);
      kp[1].forEach((s, i) => (s.weekly_rank = i + 1));
      keyframes.push(kp);
    }
    mem = [];
    for (s of k[1]) {
      mem[s.show_title] = s.weekly_hours_viewed;
    }
  }

  // Création du graphique

  // Durée de l'animation
  const duration = 250;

  // Nombre de bars
  const n = 10;

  // Interpolation
  // const k = 10;

  names = new Set(data.map((d) => d.show_title));

  // datevalues = Array.from(
  //   d3.rollup(
  //     data,
  //     ([d]) => d.weekly_hours_viewed,
  //     (d) => +new Date(d.week), // Bug de date surement parce que moi c'est une string
  //     (d) => d.show_title
  //   )
  // )
  //   .map(([week, data]) => {
  //     return [new Date(week), data];
  //   })
  //   .sort(([a], [b]) => d3.ascending(a, b));

  // function rank(value) {
  //   const data = Array.from(names, (name) => ({ name, value: value(name) }));
  //   data.sort((a, b) => d3.descending(a.value, b.value));
  //   for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
  //   return data;
  // }

  nameframes = d3.groups(
    keyframes.flatMap(([, data]) => data),
    (d) => d.show_title
  );
  prev = new Map(
    nameframes.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a]))
  );
  next = new Map(nameframes.flatMap(([, data]) => d3.pairs(data)));

  // Drawing
  width = 800;
  margin = { top: 16, right: 24, bottom: 6, left: 0 };
  barSize = 48;
  height = margin.top + barSize * n + margin.bottom;
  const svg = d3.select("#graph").attr("viewBox", [0, 0, 800, height]);
  const container = d3.select(".graph-container");

  const scale = d3.scaleOrdinal(d3.schemeTableau10);

  // function color() {
  //   const scale = d3.scaleOrdinal(d3.schemeTableau10);
  //   // if (data.some((d) => d.category !== undefined)) {
  //   //   const categoryByName = new Map(
  //   //     data.map((d) => [d.show_title, d.category])
  //   //   );
  //   //   scale.domain(Array.from(categoryByName.values()));
  //   //   return (d) => scale(categoryByName.get(d.show_title));
  //   // }
  //   return (d) => scale(d.show_title);
  // }

  x = d3.scaleLinear([0, 1], [margin.left, width - margin.right]);
  y = d3
    .scaleBand()
    .domain(d3.range(n + 1))
    .rangeRound([margin.top, margin.top + barSize * (n + 1 + 0.1)])
    .padding(0.1);

  // Formatage de la date
  function formatDate(date) {
    date = new Date(date);
    let options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    date = date.toLocaleDateString("fr", options);
    return date;
  }

  function addWeeks(numOfWeeks, date = new Date()) {
    date.setDate(date.getDate() + numOfWeeks * 7);

    return date;
  }

  function displayDate(date) {
    let date1 = formatDate(date.substring(0, 10));

    let date2 = addWeeks(1, new Date(date.substring(0, 10)));
    date2 = formatDate(date2);

    date = "Du " + date1 + " au " + date2;
    return date;
  }

  // Aficher la date en bas à droite
  // function ticker(svg) {
  //   const now = svg
  //     .append("text")
  //     .style("font", `bold ${barSize}px var(--sans-serif)`)
  //     .style("font-variant-numeric", "tabular-nums")
  //     .attr("fill", "white")
  //     .attr("text-anchor", "end")
  //     .attr("x", width - 6)
  //     .attr("y", margin.top + barSize * (n - 0.45))
  //     .attr("dy", "0.32em")
  //     .text(displayDate(keyframes[0][0]));

  //   return ([date], transition) => {
  //     transition.end().then(() => now.text(displayDate(date)));
  //   };
  // }

  function ticker(container) {
    const now = container
      .append("p")
      .attr("class", "ticker")
      // .style("font", `bold ${barSize}px var(--sans-serif)`)
      // .style("font-variant-numeric", "tabular-nums")
      // .attr("fill", "white")
      // .attr("text-anchor", "end")
      // .attr("x", width - 6)
      // .attr("y", margin.top + barSize * (n - 0.45))
      // .attr("dy", "0.32em")
      .text(displayDate(keyframes[0][0]));

    return ([date], transition) => {
      transition.end().then(() => now.text(displayDate(date)));
    };
  }

  function axis(svg) {
    const g = svg.append("g").attr("transform", `translate(0,${margin.top})`);

    const axis = d3
      .axisTop(x)
      .ticks(width / 160)
      .tickSizeOuter(0)
      .tickSizeInner(-barSize * (n + y.padding()));

    return (_, transition) => {
      g.transition(transition).call(axis);
      g.select(".tick:first-of-type text").remove();
      g.selectAll(".tick:not(:first-of-type) line")
        .attr("stroke", "white")
        .attr("opacity", "0.2");
      g.selectAll(".tick:not(:first-of-type) text")
        .attr("fill", "white")
        .attr("opacity", "0.2");
      g.select(".domain").remove();
    };
  }

  formatNumber = d3.format(",d");
  function textTween(a, b) {
    const i = d3.interpolateNumber(a, b);
    return function (t) {
      this.textContent = formatNumber(i(t));
    };
  }

  function labels(container) {
    let label = container
      .append("div")
      .style("position", "absolute")
      .style("top", "0")
      .attr("class", "labels")
      .style("width", "100%")
      .style("height", "100%")
      .selectAll("p");

    return ([date, data], transition) =>
      (label = label
        .data(data.slice(0, n), (d) => d.show_title)
        .join(
          (enter) =>
            enter
              .append("p")
              .attr("class", "label")
              // .select("p")
              .style("position", "absolute")
              .style(
                "left",
                (d) =>
                  (x((prev.get(d) || d).weekly_hours_viewed) / width) * 100 +
                  "%"
              )
              .style(
                "top",
                (d) =>
                  (y((prev.get(d) || d).weekly_rank - 1) / height) * 100 + "%"
              )
              .text((d) => d.show_title)
              .call(
                (text) =>
                  text
                    .append("p")
                    .attr("class", "label-number")
                    .style("position", "absolute")
                // .style("transform", "translateY(-50%)")
                // .style("top", "-2%")
                // .attr("dy", "0.6em")
              ),
          (update) => update,
          (exit) =>
            exit
              .transition(transition)
              .remove()
              .style(
                "left",
                (d) =>
                  (x((next.get(d) || d).weekly_hours_viewed) / width) * 100 +
                  "%"
              )
              .style(
                "top",
                (d) =>
                  (y((next.get(d) || d).weekly_rank - 1) / height) * 100 + "%"
              )
              .call((g) =>
                g
                  .select("p")
                  .tween("text", (d) =>
                    textTween(
                      d.weekly_hours_viewed,
                      (next.get(d) || d).weekly_hours_viewed
                    )
                  )
              )
        )
        .call((bar) =>
          bar
            .transition(transition)
            .style(
              "left",
              (d) => (x(d.weekly_hours_viewed) / width) * 100 + "%"
            )
            .style("top", (d) => (y(d.weekly_rank - 1) / height) * 100 + "%")
            .call((g) =>
              g
                .select("p")
                .tween("text", (d) =>
                  textTween(
                    (prev.get(d) || d).weekly_hours_viewed,
                    d.weekly_hours_viewed
                  )
                )
            )
        ));
  }

  function bars(svg) {
    let bar = svg
      .append("g")
      .attr("fill-opacity", 1)
      .attr("class", "bars")
      .selectAll("rect");

    return ([date, data], transition) =>
      (bar = bar
        .data(data.slice(0, n), (d) => d.show_title)
        .join(
          (enter) =>
            enter
              .append("rect")
              .attr("fill", "#e50914")
              // .attr("fill", color())
              .attr("height", y.bandwidth())
              .attr("x", x(0))
              .attr("y", (d) => y((prev.get(d) || d).weekly_rank - 1))
              .attr(
                "width",
                (d) => x((prev.get(d) || d).weekly_hours_viewed) - x(0)
              ),
          (update) => update,
          (exit) =>
            exit
              .transition(transition)
              .remove()
              .attr("y", (d) => y((next.get(d) || d).weekly_rank - 1))
              .attr(
                "width",
                (d) => x((next.get(d) || d).weekly_hours_viewed) - x(0)
              )
        )
        .call((bar) =>
          bar
            .transition(transition)
            .attr("y", (d) => y(d.weekly_rank - 1))
            .attr("width", (d) => x(d.weekly_hours_viewed) - x(0))
        ));
  }

  async function chart() {
    // replay;

    const updateBars = bars(svg);
    const updateAxis = axis(svg);
    const updateLabels = labels(container);
    const updateTicker = ticker(container);

    for (const keyframe of keyframes) {
      const transition = container
        .transition()
        .duration(duration)
        .ease(d3.easeLinear);

      // Extract the top bar’s value.
      x.domain([0, keyframe[1][0].weekly_hours_viewed]);

      updateAxis(keyframe, transition);
      updateBars(keyframe, transition);
      updateLabels(keyframe, transition);
      updateTicker(keyframe, transition);
      barSelection();

      // invalidation.then(() => svg.interrupt());
      await transition.end();

      if (pause) {
        await pauser();
      }
    }
  }

  chart();
}

init();

// Play Pause
const playButton = document.querySelector("#play");
const pauseButton = document.querySelector("#pause");
let pause = false;

pauseButton.addEventListener("click", function () {
  pause = true;
  pauseButton.style.display = "none";
  playButton.style.display = "block";
});

function pauser() {
  return new Promise((resolve) => {
    let playbuttonclick = function () {
      playButton.removeEventListener("click", playbuttonclick);
      playButton.style.display = "none";
      pauseButton.style.display = "block";
      pause = false;
      resolve("resolved");
    };
    playButton.addEventListener("click", playbuttonclick);
  });
}

// Bar selection
function barSelection() {
  const allBars = document.querySelectorAll(".bars rect");
  allBars.forEach((bar) => barHighlight(allBars, bar));
}

function barHighlight(allBars, bar) {
  bar.addEventListener("click", function (bar) {
    allBars.forEach((otherBar) => otherBar.classList.remove("selected"));
    bar.target.classList.toggle("selected");
  });
}

// Filter selection animation

const filmFilter = document.querySelector(".film-filter");
const serieFilter = document.querySelector(".serie-filter");
const tabIndicator = document.querySelector(".tab-indicator");

const filmFilterWidth = filmFilter.offsetWidth;
const serieFilterWidth = serieFilter.offsetWidth;

tabIndicator.style.width = serieFilterWidth + "px";

serieFilter.addEventListener("click", () => {
  filter = "TV";

  serieFilter.classList.add("selected");
  filmFilter.classList.remove("selected");

  tabIndicator.style.left = "0px";
  tabIndicator.style.width = serieFilterWidth + "px";
});

filmFilter.addEventListener("click", () => {
  filter = "Films";

  filmFilter.classList.add("selected");
  serieFilter.classList.remove("selected");

  tabIndicator.style.left = serieFilterWidth + 32 + "px";
  tabIndicator.style.width = filmFilterWidth + "px";
});
