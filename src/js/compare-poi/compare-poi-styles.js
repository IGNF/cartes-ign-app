/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

// styles personnalisés
const layers = {
  "selected-compare-poi": {
    id: "selected-compare-poi",
    type: "circle",
    source: "",
    minzoom: 2,
    paint: {
      "circle-radius": [
        "step",
        [
          "zoom"
        ],
        ["+", 8.5, ["*", 6.5, ["coalesce", ["get", "radiusRatio"], 0]]],
        18,
        ["+", 10.5, ["*", 8.5, ["coalesce", ["get", "radiusRatio"], 0]]],
      ],
      "circle-opacity": ["coalesce", ["get", "opacity"], 0],
      "circle-color": ["case", ["has", "color"], ["get", "color"], "#26A581"],
    }
  },
};

export default layers;
