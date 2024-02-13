// styles personnalisés
const layers = {
  "precision": {
    id: "location-precision",
    type: "fill",
    source: "location-precision",
    layout: {},
    paint: {
      "fill-color": "#26a581",
      "fill-opacity": 0.15,
    }
  },
  "precision-outline": {
    id: "location-precision-outline",
    type: "line",
    source: "location-precision",
    layout: {},
    paint: {
      "line-color": "#26a581",
      "line-opacity": 1,
      "line-width": 1,
    }
  }
};

export default layers;
