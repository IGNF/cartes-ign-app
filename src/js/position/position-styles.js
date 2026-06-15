/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

// styles personnalisés
const layers = {
  "geotrek-geom-casing": {
    id: "geotrek-geom-casing",
    type: "line",
    source: "geotrek-geom",
    paint: {
      "line-width": 8,
      "line-color": "white",
    },
    layout: {
      "line-cap": "round",
      "line-join": "round"
    },
  },

  "geotrek-geom": {
    id: "geotrek-geom",
    type: "line",
    source: "geotrek-geom",
    paint: {
      "line-width": 5,
      "line-color": "#3993F3",
    },
    layout: {
      "line-cap": "round",
      "line-join": "round"
    },
  },

  "geotrek-steps-circles": {
    id: "geotrek-steps-circles",
    type: "circle",
    source: "geotrek-steps",
    minzoom: 11,
    paint: {
      "circle-radius": 15,
      "circle-color": "white",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#B8BCC1",
    },
    layout: {
      "circle-sort-key": ["-", ["get", "index"]]
    }
  },

  "geotrek-steps-labels": {
    id: "geotrek-steps-labels",
    type: "symbol",
    source: "geotrek-steps",
    minzoom: 11,
    layout: {
      "symbol-sort-key": ["get", "index"],
      "text-field": ["get", "index"],
      "text-size": 12,
      "text-font": ["Source Sans Pro Semibold"]
    },
    paint: {
      "text-color": "black"
    }
  },

  "geotrek-start": {
    "id": "geotrek-start",
    "type": "symbol",
    "source": "geotrek-start",
    "layout": {
      "icon-image": "pill-black",
      "icon-text-fit": "width",
      "text-field": [
        "format",
        ["image", [
          "match",
          ["get", "pratique_norm"],
          "Pédestre", "pedestre-white",
          "Cyclo", "cyclo-white",
          "Équestre", "equestre-white",
          "pedestre-white"
        ]],

        "   ",
        ["get", "kilometers"],
        "   ",

        ["image", [
          "concat",
          "dot-",
          [
            "match",
            ["get", "difficulte"],
            "Tresfacile", "Tresfacile",
            "Facile", "Facile",
            "Difficile", "Difficile",
            "Tresdifficile", "Tresdifficile",
            "default"
          ]
        ]]
      ],
      "text-size": 14,
      "text-font": ["Source Sans Pro Semibold"],
    },
    "paint": {
      "text-color": "white",
      "icon-translate": [0, -20],
      "text-translate": [0, -24],
    }
  },

  "geotrek-end": {
    "id": "geotrek-end",
    "type": "symbol",
    "source": "geotrek-end",
    "layout": {
      "icon-image": "pill-black",
      "icon-text-fit": "width",
      "text-field": "Arrivée",
      "text-size": 14,
      "text-font": ["Source Sans Pro Semibold"],
    },
    "paint": {
      "text-color": "white",
      "icon-translate": [0, -20],
      "text-translate": [0, -24],
    }
  },
};

export default layers;
