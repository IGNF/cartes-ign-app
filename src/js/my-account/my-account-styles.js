/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

// styles personnalisés
const layers = {
  "line-casing": {
    id: "my-account-line-casing",
    type: "line",
    source: "",
    layout: {
      "line-cap": "round",
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
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#307CCD",
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
        ["case",
          ["any",
            ["boolean", ["==", ["get", "order"], "departure"], false],
            ["boolean", ["==", ["get", "order"], "destination"], false]], 6,
          3],
        5,
        ["case",
          ["any",
            ["boolean", ["==", ["get", "order"], "departure"], false],
            ["boolean", ["==", ["get", "order"], "destination"], false]], 6,
          3],
        18,
        ["case",
          ["any",
            ["boolean", ["==", ["get", "order"], "departure"], false],
            ["boolean", ["==", ["get", "order"], "destination"], false]], 17,
          12],
      ],
      "circle-color": "#307CCD",
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
        ["case",
          ["any",
            ["boolean", ["==", ["get", "order"], "departure"], false],
            ["boolean", ["==", ["get", "order"], "destination"], false]], 5,
          1.5
        ],
        5,
        ["case",
          ["any",
            ["boolean", ["==", ["get", "order"], "departure"], false],
            ["boolean", ["==", ["get", "order"], "destination"], false]], 5,
          1.5],
        18,
        ["case",
          ["any",
            ["boolean", ["==", ["get", "order"], "departure"], false],
            ["boolean", ["==", ["get", "order"], "destination"], false]], 15,
          9],
      ],
      "circle-color": "white",
      "circle-opacity": ["case", ["boolean", ["get", "visible"], false], 1, 0],
    }
  },
  "point-departure": {
    id: "my-account-point-departure",
    type: "symbol",
    source: "",
    layout: {
      "icon-image": "routeDepartureIcon",
      "icon-allow-overlap": true,
      "icon-size": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        10/50,
        5,
        10/50,
        18,
        30/50
      ],
    },
    paint: {
      "icon-opacity": ["case", ["boolean", ["get", "visible"], false], 1, 0],
    },
    filter: ["==", ["get", "order"], "departure"],
  },
  "point-destination": {
    id: "my-account-point-destination",
    type: "symbol",
    source: "",
    layout: {
      "icon-image": "routeDestinationIcon",
      "icon-allow-overlap": true,
      "icon-size": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        10/50,
        5,
        10/50,
        18,
        30/50
      ],
    },
    paint: {
      "icon-opacity": ["case", ["boolean", ["get", "visible"], false], 1, 0],
    },
    filter: ["==", ["get", "order"], "destination"],
  },
  "landmark-selected": {
    id: "my-account-landmarks-selected",
    type: "circle",
    source: "",
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        ["+", 6, ["*", 5, ["coalesce", ["get", "radiusRatio"], 0]]],
        5,
        ["+", 6, ["*", 5, ["coalesce", ["get", "radiusRatio"], 0]]],
        18,
        ["+", 17, ["*", 13, ["coalesce", ["get", "radiusRatio"], 0]]]
      ],
      "circle-color": ["get", "color"],
      "circle-opacity": ["case", ["boolean", ["get", "visible"], false], 0.6, 0],
    }
  },
  "landmark-casing": {
    id: "my-account-landmarks-casing",
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
        6,
        18,
        17
      ],
      "circle-color": "white",
      "circle-opacity": ["case", ["boolean", ["get", "visible"], false], 1, 0],
    }
  },
  "landmark": {
    id: "my-account-landmarks",
    type: "circle",
    source: "",
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        5,
        5,
        5,
        18,
        15
      ],
      "circle-color": ["get", "color"],
      "circle-opacity": ["case", ["boolean", ["get", "visible"], false], 1, 0],
    }
  },
  "landmark-icon": {
    id: "my-account-landmark-icon",
    type: "symbol",
    source: "",
    layout: {
      "icon-image": ["get", "icon"],
      "icon-allow-overlap": true,
      "icon-size": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        10/50,
        5,
        10/50,
        18,
        30/50
      ],
    },
    paint: {
      "icon-opacity": ["case", ["boolean", ["get", "visible"], false], 1, 0],
    },
  },
  "compare-landmark": {
    id: "my-account-compare-landmark",
    type: "symbol",
    source: "",
    layout: {
      "icon-image": ["get", "icon"],
      "icon-allow-overlap": true,
      "icon-size": 0.5,
      "icon-anchor": "bottom",
    },
    paint: {
      "icon-opacity": ["case", ["boolean", ["get", "visible"], false], 1, 0],
    },
  },
};

export default layers;
