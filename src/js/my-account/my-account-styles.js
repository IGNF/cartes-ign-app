// styles personnalisés
const layers = {
   "line-casing": {
    id: "my-account-line-casing",
    type: "line",
    source: "",
    layout: {
      "line-cap": "butt",
      "line-join": "round",
    },
    paint: {
      "line-color": "#26a581",
      "line-opacity": ["case", ["boolean", ["get", "visible"], false], 0.55, 0],
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
    id: "my-account-line",
    type: "line",
    source: "",
    layout: {
      "line-cap": "butt",
      "line-join": "round",
    },
    paint: {
      "line-color": "#26a581",
      "line-opacity": ["case", ["boolean", ["get", "visible"], false], 0.85, 0],
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
    id: "my-account-point-casing",
    type: "circle",
    source: "",
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        6,
        5,
        12,
        18,
        28,
      ],
      "circle-color": "#26a581",
      "circle-opacity": ["case", ["boolean", ["get", "visible"], false], 0.65, 0],
    }
  },
  "point": {
    id: "my-account-point",
    type: "circle",
    source: "",
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        3,
        5,
        7,
        18,
        16,
      ],
      "circle-color": "#26a581",
      "circle-opacity": ["case", ["boolean", ["get", "visible"], false], 1, 0],
    }
  },
};

export default layers;
