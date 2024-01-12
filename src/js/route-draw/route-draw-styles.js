// styles personnalisés
const layers = {
   "line-casing": {
    id: "route-draw-line-casing",
    type: "line",
    source: "",
    layout: {
      "line-cap": "butt",
      "line-join": "round",
    },
    paint: {
      "line-color": "#26a581",
      "line-opacity": ["case", ["boolean", ["get", "invisible"], false], 0, 0.55],
      "line-width": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        7 * 2,
        5,
        7 * 2,
        18,
        23 * 2,
      ],
    }
  },
  "line": {
    id: "route-draw-line",
    type: "line",
    source: "",
    layout: {
      "line-cap": "butt",
      "line-join": "round",
    },
    paint: {
      "line-color": "#26a581",
      "line-opacity": ["case", ["boolean", ["get", "invisible"], false], 0, 0.85],
      "line-width": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        3 * 2,
        5,
        3 * 2,
        18,
        10 * 2,
      ],
    }
  },
  "point-casing": {
    id: "route-draw-point-casing",
    type: "circle",
    source: "",
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        ["case", ["boolean", ["get", "highlight"], false], 7, 6],
        5,
        ["case", ["boolean", ["get", "highlight"], false], 14, 12],
        18,
        ["case", ["boolean", ["get", "highlight"], false], 33, 28],
      ],
      "circle-color": "#26a581",
      "circle-opacity": 0.65,
    }
  },
  "point": {
    id: "route-draw-point",
    type: "circle",
    source: "",
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        ["case", ["boolean", ["get", "highlight"], false], 4, 3],
        5,
        ["case", ["boolean", ["get", "highlight"], false], 9, 7],
        18,
        ["case", ["boolean", ["get", "highlight"], false], 21, 16],
      ],
      "circle-color": "#26a581",
    }
  },
};

export default layers;