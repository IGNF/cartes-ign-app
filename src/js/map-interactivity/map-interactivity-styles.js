// styles personnalisés
const layers = {
  "line": {
    id: "map-interactivity-line",
    type: "line",
    source: "",
    layout: {
      "line-cap": "butt",
      "line-join": "round",
    },
    paint: {
      "line-color": "#26a581",
      "line-opacity": 0.85,
      "line-width": 12,
    }
  },
  "point": {
    id: "map-interactivity-point",
    type: "circle",
    source: "",
    paint: {
      "circle-radius": 12,
      "circle-color": "#26a581",
      "circle-opacity": 0.85,
    }
  },
  "polygon": {
    id: "map-interactivity-polygon",
    type: "fill",
    source: "",
    layout: {},
    paint: {
      "fill-color": "#26a581",
      "fill-opacity": 0.65,
    }
  },
  "polygon-outline": {
    id: "map-interactivity-polygon-outline",
    type: "line",
    source: "",
    layout: {},
    paint: {
      "line-color": "#26a581",
      "line-opacity": 1,
      "line-width": 3,
    }
  }
};

export default layers;
