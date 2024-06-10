/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

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
      "circle-color": "#F18345",
      "circle-opacity": 1,
    }
  }
};

export default layers;
