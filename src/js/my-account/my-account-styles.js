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
    filter: ["==", ["get", "order"], "departure"],
  },
  "point-destination": {
    id: "my-account-point-destination",
    type: "symbol",
    source: "",
    layout: {
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
    filter: ["==", ["get", "order"], "destination"],
  },
};

export default layers;
