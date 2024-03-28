// styles personnalisés
const layers = {
  "point-casing": {
    id: "elevation-line-point-casing",
    type: "circle",
    source: "elevation-line-location",
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        4,
        5,
        4,
        18,
        15,
      ],
      "circle-color": "white",
      "circle-opacity": 1,
    }
  },
  "point": {
    id: "elevation-line-point",
    type: "circle",
    source: "elevation-line-location",
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
      "circle-color": getComputedStyle(document.body).getPropertyValue("--orange"),
      "circle-opacity": 1,
    }
  }
};

export default layers;
