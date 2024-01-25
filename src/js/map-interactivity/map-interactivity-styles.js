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
      "line-color": "#307CCD",
      "line-opacity": 1,
      "line-width": 12,
    }
  },
  "point": {
    id: "map-interactivity-point",
    type: "circle",
    source: "",
    paint: {
      "circle-radius": 12,
      "circle-color": "#307CCD",
      "circle-opacity": 0.85,
    }
  },
  "polygon": {
    id: "map-interactivity-polygon",
    type: "fill",
    source: "",
    layout: {},
    paint: {
      "fill-color": "#307CCD",
      "fill-opacity": 0.15,
    }
  },
  "polygon-outline": {
    id: "map-interactivity-polygon-outline",
    type: "line",
    source: "",
    layout: {},
    paint: {
      "line-color": "#307CCD",
      "line-opacity": 1,
      "line-width": 1,
    }
  }
};

export default layers;
