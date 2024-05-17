/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

// styles personnalisés
const layers = {
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
  },
  "selected-poi": {
    id: "map-interactivity-selected-poi",
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
      "circle-color": ["coalesce", ["get", "color"], "#0000CC"]
    }
  },
  "selected-poi-symbol": {
    id: "map-interactivity-selected-poi-symbol",
    type: "symbol",
    source: "",
    minzoom: 2,
    layout: {
      visibility: "visible",
      "icon-image": "{symbo}_17"
    },
  },
};

export default layers;
