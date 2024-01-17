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
      "line-color": "#307CCD",
      "line-opacity": 1,
      "line-width": 3,
    },
    filter: ["==", ["get", "type"], "SNAPLINE"],
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
        // don't forget it's the radius! The visible value is diameter (which is 2x)
        // on zoom levels 0-5 should be 5px more than the routeline casing. 7 + 5 = 12.
        // When highlighted should be +2px more. 12 + 2 = 14
        0,
        // highlighted to default ratio (epsilon) = 14 / 12 ~= 1.16
        3,
        5,
        3,
        // exponentially grows on zoom levels 5-18 finally becoming the same 5px wider than the routeline's casing on
        // the same zoom level: 23 + 5 = 28px
        18,
        // highlighted = default ~= 33
        12,
      ],
      "circle-color": "#307CCD",
    },
    filter: ["any", ["==", ["get", "type"], "HOVERPOINT"], ["==", ["get", "type"], "SNAPPOINT"], ["==", ["get", "type"], "WAYPOINT"]],
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
        // on zoom levels 0-5 - 5px smaller than the casing. 12 - 5 = 7.
        0,
        // feature to casing ratio (psi) = 7 / 12 ~= 0.58
        // highlighted to default ratio (epsilon) = 9 / 7 ~= 1.28
        1.5,
        5,
        1.5,
        // exponentially grows on zoom levels 5-18 finally becoming psi times the casing
        18,
        // psi * 28 ~= 16
        // when highlighted multiply by epsilon ~= 21
        9,
      ],
      "circle-color": "#ffffff"
    },
    filter: ["any", ["==", ["get", "type"], "HOVERPOINT"], ["==", ["get", "type"], "SNAPPOINT"], ["==", ["get", "type"], "WAYPOINT"]],
  },
];

export default layers;
