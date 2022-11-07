let filter = "TV (English)";

async function init(filter) {
  const response = await fetch("data/data.json");
  let data = await response.json();

  // Traitement du tableau de données
  function updateFilter(filter) {
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
  }
  updateFilter(filter);

  // Grouper le tableau par semaine
  const keyframes0 = d3.groups(data, (d) => d.week).reverse();

  // Interpolation pour créer des frames en plus afin d'obtenir une animation plus fluide
  let mem = [];
  for (s of keyframes0[0][1]) {
    mem[s.show_title] = s.weekly_hours_viewed;
  }
  let keyframeInterpolateNumber = 15;
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

  // Durée de l'animation
  const duration = 250;

  // Nombre de bars
  const n = 10;

  nameframes = d3.groups(
    keyframes.flatMap(([, data]) => data),
    (d) => d.show_title
  );
  prev = new Map(
    nameframes.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a]))
  );
  next = new Map(nameframes.flatMap(([, data]) => d3.pairs(data)));

  // Créer le graphique
  width = 800;
  margin = { top: 16, right: 24, bottom: 6, left: 0 };
  barSize = 48;
  height = margin.top + barSize * n + margin.bottom;
  const svg = d3.select("#graph").attr("viewBox", [0, 0, 800, height]);
  const container = d3.select(".graph-container");

  const scale = d3.scaleOrdinal(d3.schemeTableau10);

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

    date = date1 + " - " + date2;
    return date;
  }

  function displayMonth(date) {
    date = formatDate(date.substring(0, 10));
    date = date.substring(2, date.length);
    return date;
  }

  // Date en bas à droite
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

  // Axes
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

  // Labels
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

  // Bars
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

  // Sélection de la date
  const dateSelector = document.querySelector("#dateSelector");
  dateSelector.value = 0;

  async function chart(start) {
    // Créer un nouveau tableau qui commence à la date choisie par l'utilisateur
    keyframesSlice = keyframes.slice(dateSelector.value);

    const updateBars = bars(svg);
    const updateAxis = axis(svg);
    const updateLabels = labels(container);
    const updateTicker = ticker(container);

    for (const keyframe of keyframesSlice) {
      const transition = container
        .transition()
        .duration(duration)
        .ease(d3.easeLinear);

      // Extraire la valeur de la première barre
      x.domain([0, keyframe[1][0].weekly_hours_viewed]);

      updateAxis(keyframe, transition);
      updateBars(keyframe, transition);
      updateLabels(keyframe, transition);
      updateTicker(keyframe, transition);
      barSelection();

      await transition.end();

      // Bouton play/pause
      if (pause) {
        await pauser();
      }

      // Récupérer l'index de la keyframe en cours
      index = keyframes.findIndex((k) => k[0] == keyframe[0]);
      // Ajuster la range pour qu'elle avance en même temps que l'animation
      dateSelector.value = index;
    }
  }

  chart(dateSelector.value);

  // Slider de sélection de la date
  const dateBubble = document.querySelector(".dateBubble");
  const rangeContainer = document.querySelector(".range-container");

  dateSelector.addEventListener("mouseup", function () {
    dateBubble.style.display = "none";

    cleanGraph();
    chart(dateSelector.value);
  });

  dateBubble.style.left = (dateSelector.value * 100) / 661 + "%";
  dateBubble.innerText = displayMonth(keyframes[dateSelector.value][0]);

  dateSelector.addEventListener("input", function () {
    dateBubble.style.left = (dateSelector.value * 100) / 661 + "%";
    dateBubble.innerText = displayMonth(keyframes[dateSelector.value][0]);

    cleanGraph();
    chart(dateSelector.value);
  });

  dateSelector.addEventListener("mousedown", function () {
    dateBubble.style.display = "block";
  });
}

init(filter);

// Fonction de suppression du graphique
const graphContainer = document.querySelector(".graph-container");
const graph = document.querySelector("#graph");

function cleanGraph() {
  while (graph.lastChild) {
    graph.removeChild(graph.lastChild);
  }
  while (graphContainer.lastChild.id !== "graph") {
    graphContainer.removeChild(graphContainer.lastChild);
  }
}

// Play/Pause
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

// Sélection des barres
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

// Filtres
const filmFilter = document.querySelector(".film-filter");
const serieFilter = document.querySelector(".serie-filter");
const tabIndicator = document.querySelector(".tab-indicator");

const filmFilterWidth = filmFilter.offsetWidth;
const serieFilterWidth = serieFilter.offsetWidth;

tabIndicator.style.width = serieFilterWidth + "px";

serieFilter.addEventListener("click", () => {
  filter = "TV (English)";

  serieFilter.classList.add("selected");
  filmFilter.classList.remove("selected");

  tabIndicator.style.left = "0px";
  tabIndicator.style.width = serieFilterWidth + "px";

  cleanGraph();
  init(filter);
});

filmFilter.addEventListener("click", () => {
  filter = "Films (English)";

  filmFilter.classList.add("selected");
  serieFilter.classList.remove("selected");

  tabIndicator.style.left = serieFilterWidth + 32 + "px";
  tabIndicator.style.width = filmFilterWidth + "px";

  cleanGraph();
  init(filter);
});
