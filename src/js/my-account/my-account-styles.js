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
      "line-color": "#ffffff",
      "line-opacity": ["case", ["boolean", ["get", "visible"], false], 1, 0],
      "line-width": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        5,
        5,
        5,
        18,
        20,
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
      "line-opacity": ["case", ["boolean", ["get", "visible"], false], 1, 0],
      "line-width": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        2,
        5,
        2,
        18,
        17,
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
        3,
        5,
        3,
        18,
        12,
      ],
      "circle-color": "#26a581",
      "circle-opacity": ["case", ["boolean", ["get", "visible"], false], 1, 0],
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
        1.5,
        5,
        1.5,
        18,
        9,
      ],
      "circle-color": "#26a581",
      "circle-opacity": ["case", ["boolean", ["get", "visible"], false], 1, 0],
    }
  },
};

export default layers;
