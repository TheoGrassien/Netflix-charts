const data = {
  labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  datasets: [
    {
      label: "Weekly Sales",
      data: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],

      backgroundColor: [
        "red",
        "red",
        "red",
        "red",
        "red",
        "red",
        "red",
        "red",
        "red",
        "red",
      ],
    },
  ],
};

// config
const config = {
  type: "bar",
  data,
  options: {
    indexAxis: "y",

    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 20,
          },
        },
      },
    },
  },
};

// render init block
const myChart = new Chart(document.getElementById("myChart"), config);

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
