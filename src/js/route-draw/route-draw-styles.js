// styles personnalisés
const layers = {
   "line-casing": {
    id: "route-draw-line-casing",
    type: "line",
    source: "",
    layout: {
      "line-cap": "butt",
      "line-join": "round",
    },
    paint: {
      "line-color": "#ffffff",
      "line-opacity": 1,
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
    },
  },
  "line": {
    id: "route-draw-line",
    type: "line",
    source: "",
    layout: {
      "line-cap": "butt",
      "line-join": "round",
    },
    paint: {
      "line-color": "#307CCD",
      "line-opacity": 1,
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
    },
  },
  "point-casing": {
    id: "route-draw-point-casing",
    type: "circle",
    source: "",
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        ["case", ["boolean", ["get", "highlight"], false], 4, 3],
        5,
        ["case", ["boolean", ["get", "highlight"], false], 4, 3],
        18,
        ["case", ["boolean", ["get", "highlight"], false], 14, 12],
      ],
      "circle-color": "#307CCD",
    }
  },
  "point": {
    id: "route-draw-point",
    type: "circle",
    source: "",
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        ["case", ["boolean", ["get", "highlight"], false], 3, 1.5],
        5,
        ["case", ["boolean", ["get", "highlight"], false], 3, 1.5],
        18,
        ["case", ["boolean", ["get", "highlight"], false], 11, 9],
      ],
      "circle-color": "#ffffff",
    },
  },
  "point-departure": {
    id: "route-draw-point-departure",
    type: "symbol",
    source: "",
    layout: {
      "icon-image": "routeDepartureIcon",
      "icon-size": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        ["case", ["boolean", ["get", "highlight"], false], 6/50, 3/50],
        5,
        ["case", ["boolean", ["get", "highlight"], false], 6/50, 3/50],
        18,
        ["case", ["boolean", ["get", "highlight"], false], 22/50, 18/50],
      ],
    },
    filter: ["==", ["get", "order"], "departure"],
  },
  "point-destination": {
    id: "route-draw-point-destination",
    type: "symbol",
    source: "",
    layout: {
      "icon-image": "routeDestinationIcon",
      "icon-size": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        ["case", ["boolean", ["get", "highlight"], false], 6/50, 3/50],
        5,
        ["case", ["boolean", ["get", "highlight"], false], 6/50, 3/50],
        18,
        ["case", ["boolean", ["get", "highlight"], false], 22/50, 18/50],
      ],
    },
    filter: ["==", ["get", "order"], "destination"],
  },
};

export default layers;
