// styles personnalisés
//   cf. https://maplibre.org/maplibre-gl-directions/#/examples/restyling
const layers = [
  {
    id: "maplibre-gl-directions-snapline",
    type: "line",
    source: "maplibre-gl-directions",
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-dasharray": [3, 3],
      "line-color": "#26a581",
      "line-opacity": 0.65,
      "line-width": 3,
    },
    filter: ["==", ["get", "type"], "SNAPLINE"],
  },

  {
    id: "maplibre-gl-directions-alt-routeline-casing",
    type: "line",
    source: "maplibre-gl-directions",
    layout: {
      "line-cap": "butt",
      "line-join": "round",
    },
    paint: {
      "line-color": "#26a581",
      "line-opacity": 0.55,
      "line-width": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        // on zoom levels 0-5 - 7px by default and 10px when highlighted
        0,
        // highlighted to default ratio (epsilon) = 10 / 7 ~= 1.42
        ["case", ["boolean", ["get", "highlight"], false], 10 * 2, 7 * 2],
        5,
        ["case", ["boolean", ["get", "highlight"], false], 10 * 2, 7 * 2],
        // exponentially grows on zoom levels 5-18 finally becoming 32px when highlighted
        18,
        // default = 32 / epsilon ~= 23
        ["case", ["boolean", ["get", "highlight"], false], 32 * 2, 23 * 2],
      ],
    },
    filter: ["==", ["get", "route"], "ALT"],
  },
  {
    id: "maplibre-gl-directions-alt-routeline",
    type: "line",
    source: "maplibre-gl-directions",
    layout: {
      "line-cap": "butt",
      "line-join": "round",
    },
    paint: {
      "line-color": "#26a581",
      "line-opacity": 0.85,
      "line-width": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        // on zoom levels 0-5 - 4px smaller than the casing (2px on each side). 7 - 4 = 3.
        // Doesn't change when highlighted
        0,
        // feature to casing ratio (psi) = 3 / 7 ~= 0.42
        3 * 2,
        5,
        3 * 2,
        // exponentially grows on zoom levels 5-18 finally becoming psi times the casing
        18,
        // psi * 23  ~= 10
        10 * 2,
      ],
    },
    filter: ["==", ["get", "route"], "ALT"],
  },

  {
    id: "maplibre-gl-directions-routeline-casing",
    type: "line",
    source: "maplibre-gl-directions",
    layout: {
      "line-cap": "butt",
      "line-join": "round",
    },
    paint: {
      "line-color": [
        "interpolate-hcl",
        ["linear"],
        ["get", "congestion"],
        0,
        "#26a581",
        1,
        "#26a581",
        100,
        "#26a581",
      ],
      "line-opacity": 0.55,
      "line-width": [
        // same as the alt-routeline-casing
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        ["case", ["boolean", ["get", "highlight"], false], 10 * 2, 7 * 2],
        5,
        ["case", ["boolean", ["get", "highlight"], false], 10 * 2, 7 * 2],
        18,
        ["case", ["boolean", ["get", "highlight"], false], 32 * 2, 23 * 2],
      ],
    },
    filter: ["==", ["get", "route"], "SELECTED"],
  },
  {
    id: "maplibre-gl-directions-routeline",
    type: "line",
    source: "maplibre-gl-directions",
    layout: {
      "line-cap": "butt",
      "line-join": "round",
    },
    paint: {
      "line-color": [
        "interpolate-hcl",
        ["linear"],
        ["get", "congestion"],
        0,
        "#26a581",
        1,
        "#26a581",
        100,
        "#26a581",
      ],
      "line-opacity": 0.85,
      "line-width": [
        // same as alt-routeline
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        3 * 2,
        5,
        3 * 2,
        18,
        10 * 2,
      ],
    },
    filter: ["==", ["get", "route"], "SELECTED"],
  },

  {
    id: "maplibre-gl-directions-hoverpoint-casing",
    type: "circle",
    source: "maplibre-gl-directions",
    paint: {
      "circle-radius": [
        // same as snappoint-casing, but without highlighting (since it's always highlighted while present on the map)
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        14 * 2,
        5,
        14 * 2,
        18,
        33 * 2,
      ],
      "circle-color": "#26a581",
      "circle-opacity": 0.65,
    },
    filter: ["==", ["get", "type"], "HOVERPOINT"],
  },
  {
    id: "maplibre-gl-directions-hoverpoint",
    type: "circle",
    source: "maplibre-gl-directions",
    paint: {
      "circle-radius": [
        // same as snappoint, but without highlighting (since it's always highlighted while present on the map)
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        9 * 2,
        5,
        9 * 2,
        18,
        21 * 2,
      ],
      "circle-color": "#26a581",
    },
    filter: ["==", ["get", "type"], "HOVERPOINT"],
  },

  {
    id: "maplibre-gl-directions-snappoint-casing",
    type: "circle",
    source: "maplibre-gl-directions",
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        // don't forget it's the radius! The visible value is diameter (which is 2x)
        // on zoom levels 0-5 should be 5px more than the routeline casing. 7 + 5 = 12.
        // When highlighted should be +2px more. 12 + 2 = 14
        0,
        // highlighted to default ratio (epsilon) = 14 / 12 ~= 1.16
        ["case", ["boolean", ["get", "highlight"], false], 14 * 2, 12 * 2],
        5,
        ["case", ["boolean", ["get", "highlight"], false], 14 * 2, 12 * 2],
        // exponentially grows on zoom levels 5-18 finally becoming the same 5px wider than the routeline's casing on
        // the same zoom level: 23 + 5 = 28px
        18,
        // highlighted = default ~= 33
        ["case", ["boolean", ["get", "highlight"], false], 33 * 2, 28 * 2],
      ],
      "circle-color": ["case", ["boolean", ["get", "highlight"], false], "#26a581", "#26a581"],
      "circle-opacity": 0.65,
    },
    filter: ["==", ["get", "type"], "SNAPPOINT"],
  },
  {
    id: "maplibre-gl-directions-snappoint",
    type: "circle",
    source: "maplibre-gl-directions",
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        // on zoom levels 0-5 - 5px smaller than the casing. 12 - 5 = 7.
        0,
        // feature to casing ratio (psi) = 7 / 12 ~= 0.58
        // highlighted to default ratio (epsilon) = 9 / 7 ~= 1.28
        ["case", ["boolean", ["get", "highlight"], false], 9 * 2, 7 * 2],
        5,
        ["case", ["boolean", ["get", "highlight"], false], 9 * 2, 7 * 2],
        // exponentially grows on zoom levels 5-18 finally becoming psi times the casing
        18,
        // psi * 28 ~= 16
        // when highlighted multiply by epsilon ~= 21
        ["case", ["boolean", ["get", "highlight"], false], 21 * 2, 16 * 2],
      ],
      "circle-color": ["case", ["boolean", ["get", "highlight"], false], "#26a581", "#26a581"],
    },
    filter: ["==", ["get", "type"], "SNAPPOINT"],
  },

  {
    id: "maplibre-gl-directions-waypoint-casing",
    type: "circle",
    source: "maplibre-gl-directions",
    paint: {
      "circle-radius": [
        // same as snappoint-casing
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        ["case", ["boolean", ["get", "highlight"], false], 7, 6],
        5,
        ["case", ["boolean", ["get", "highlight"], false], 14, 12],
        18,
        ["case", ["boolean", ["get", "highlight"], false], 33, 28],
      ],
      "circle-color": ["case", ["boolean", ["get", "highlight"], false], "#26a581", "#26a581"],
      "circle-opacity": 0.65,
    },
    filter: ["==", ["get", "type"], "WAYPOINT"],
  },
  {
    id: "maplibre-gl-directions-waypoint",
    type: "circle",
    source: "maplibre-gl-directions",
    paint: {
      // same as snappoint
      "circle-radius": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        0,
        ["case", ["boolean", ["get", "highlight"], false], 4, 3],
        5,
        ["case", ["boolean", ["get", "highlight"], false], 9, 7],
        18,
        ["case", ["boolean", ["get", "highlight"], false], 21, 16],
      ],
      "circle-color": ["case", ["boolean", ["get", "highlight"], false], "#26a581", "#26a581"],
    },
    filter: ["==", ["get", "type"], "WAYPOINT"],
  },
];

export default layers;