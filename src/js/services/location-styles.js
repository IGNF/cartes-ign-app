// styles personnalisés
const layers = {
  "precision": {
    id: "location-precision",
    type: "fill",
    source: "location-precision",
    layout: {},
    paint: {
      "fill-color": "#26A581",
      "fill-opacity": 0.15,
    }
  },
  "precision-outline": {
    id: "location-precision-outline",
    type: "line",
    source: "location-precision",
    layout: {},
    paint: {
      "line-color": "#26A581",
      "line-opacity": 1,
      "line-width": 1,
    }
  }
};

export default layers;
