// styles personnalisés
const layers = {
  "precision": {
    id: "location-precision",
    type: "fill",
    source: "location-precision",
    layout: {},
    paint: {
      "fill-color": getComputedStyle(document.body).getPropertyValue("--dark-green"),
      "fill-opacity": 0.15,
    }
  },
  "precision-outline": {
    id: "location-precision-outline",
    type: "line",
    source: "location-precision",
    layout: {},
    paint: {
      "line-color": getComputedStyle(document.body).getPropertyValue("--dark-green"),
      "line-opacity": 1,
      "line-width": 1,
    }
  }
};

export default layers;
