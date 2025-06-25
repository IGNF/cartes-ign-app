/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

// styles personnalisés
const layers = {
  "line": {
    id: "track-record-line",
    type: "line",
    source: "",
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#26A581",
      "line-opacity": [
        "case",
        ["boolean", ["get", "invisible"], false], 0,
        1],
      "line-width": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        2,
        5,
        2,
        18,
        4,
      ],
    },
    filter: ["!", ["boolean", ["get", "fictif"], false]],
  },
  "currentLine": {
    id: "track-record-current-line",
    type: "line",
    source: "",
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#26A581",
      "line-dasharray": [0.5, 2],
      "line-opacity": [
        "case",
        ["boolean", ["get", "invisible"], false], 0,
        1],
      "line-width": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        2,
        5,
        2,
        18,
        4,
      ],
    },
    filter: ["!", ["boolean", ["get", "fictif"], false]],
  },
  "point": {
    id: "track-record-point",
    type: "circle",
    source: "",
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        2.5,
        5,
        2.5,
        18,
        4,
      ],
      "circle-color": "#26A581",
    },
  },
};

export default layers;
