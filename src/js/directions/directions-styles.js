/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

// styles personnalisés
//   cf. https://maplibre.org/maplibre-gl-directions/#/examples/restyling
const layers = [
  {
    id: "maplibre-gl-directions-routeline-casing",
    type: "line",
    source: "maplibre-gl-directions",
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#ffffff",
      "line-opacity": 1,
      "line-width": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        // on zoom levels 0-5 - 7px by default and 10px when highlighted
        0,
        // highlighted to default ratio (epsilon) = 10 / 7 ~= 1.42
        5,
        5,
        5,
        // exponentially grows on zoom levels 5-18 finally becoming 32px when highlighted
        18,
        // default = 32 / epsilon ~= 23
        20,
      ],
    },
    filter: ["!=", ["get", "type"], "SNAPLINE"],
  },
  // {
  //   id: "maplibre-gl-directions-snapline",
  //   type: "line",
  //   source: "maplibre-gl-directions",
  //   paint: {
  //     "line-dasharray": [0.5, 0.25],
  //     "line-color": "#307CCD",
  //     "line-opacity": 1,
  //     "line-width": [
  //       "interpolate",
  //       ["exponential", 1.5],
  //       ["zoom"],
  //       0,
  //       2,
  //       5,
  //       2,
  //       18,
  //       17,
  //     ],
  //   },
  //   filter: ["==", ["get", "type"], "SNAPLINE"],
  // },
  {
    id: "maplibre-gl-directions-routeline",
    type: "line",
    source: "maplibre-gl-directions",
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#307CCD",
      "line-opacity": 1,
      "line-width": [
        // same as alt-routeline
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
    },
    filter: ["!=", ["get", "type"], "SNAPLINE"],
  },
  {
    id: "maplibre-gl-directions-point-casing",
    type: "circle",
    source: "maplibre-gl-directions",
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        ["case",
          ["any",
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "ORIGIN"], false],
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "DESTINATION"], false]], 6,
          3
        ],
        5,
        ["case",
          ["any",
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "ORIGIN"], false],
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "DESTINATION"], false]], 6,
          3],
        18,
        ["case",
          ["any",
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "ORIGIN"], false],
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "DESTINATION"], false]], 17,
          12],
      ],
      "circle-color": "#307CCD",
    },
    filter: ["==", ["get", "type"], "SNAPPOINT"],
  },
  {
    id: "maplibre-gl-directions-point",
    type: "circle",
    source: "maplibre-gl-directions",
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        ["case",
          ["any",
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "ORIGIN"], false],
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "DESTINATION"], false]], 5,
          ["boolean", ["get", "highlight"], false], 3,
          1.5
        ],
        5,
        ["case",
          ["any",
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "ORIGIN"], false],
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "DESTINATION"], false]], 5,
          1.5],
        18,
        ["case",
          ["any",
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "ORIGIN"], false],
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "DESTINATION"], false]], 15,
          9],
      ],
      "circle-color": "#ffffff"
    },
    filter: ["==", ["get", "type"], "SNAPPOINT"],
  },
  {
    id: "maplibre-gl-directions-point-ORIGIN",
    type: "symbol",
    source: "maplibre-gl-directions",
    layout: {
      "icon-allow-overlap": true,
      "icon-image": "routeDepartureIcon",
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
    filter: ["all", ["==", ["get", "type"], "SNAPPOINT"], ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "ORIGIN"]],
  },
  {
    id: "maplibre-gl-directions-point-DESTINATION",
    type: "symbol",
    source: "maplibre-gl-directions",
    layout: {
      "icon-allow-overlap": true,
      "icon-image": "routeDestinationIcon",
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
    filter: ["all", ["==", ["get", "type"], "SNAPPOINT"], ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "DESTINATION"]],
  },
];

const previewLayers = {
  "directions-preview-point-casing": {
    id: "directions-preview-point-casing",
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
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "ORIGIN"], false],
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "DESTINATION"], false]], 6,
          3
        ],
        5,
        ["case",
          ["any",
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "ORIGIN"], false],
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "DESTINATION"], false]], 6,
          3],
        18,
        ["case",
          ["any",
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "ORIGIN"], false],
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "DESTINATION"], false]], 17,
          12],
      ],
      "circle-color": "#307CCD",
    },
    filter: ["==", ["get", "type"], "SNAPPOINT"],
  },
  "directions-preview-point": {
    id: "directions-preview-point",
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
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "ORIGIN"], false],
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "DESTINATION"], false]], 5,
          ["boolean", ["get", "highlight"], false], 3,
          1.5
        ],
        5,
        ["case",
          ["any",
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "ORIGIN"], false],
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "DESTINATION"], false]], 5,
          1.5],
        18,
        ["case",
          ["any",
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "ORIGIN"], false],
            ["boolean", ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "DESTINATION"], false]], 15,
          9],
      ],
      "circle-color": "#ffffff"
    },
    filter: ["==", ["get", "type"], "SNAPPOINT"],
  },
  "directions-preview-point-ORIGIN": {
    id: "directions-preview-point-ORIGIN",
    type: "symbol",
    source: "",
    layout: {
      "icon-allow-overlap": true,
      "icon-image": "routeDepartureIcon",
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
    filter: ["all", ["==", ["get", "type"], "SNAPPOINT"], ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "ORIGIN"]],
  },
  "directions-preview-point-DESTINATION": {
    id: "directions-preview-point-DESTINATION",
    type: "symbol",
    source: "",
    layout: {
      "icon-allow-overlap": true,
      "icon-image": "routeDestinationIcon",
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
    filter: ["all", ["==", ["get", "type"], "SNAPPOINT"], ["==", ["get", "category", ["get", "waypointProperties", ["properties"]]], "DESTINATION"]],
  },
};

export default {
  layers,
  previewLayers,
};
