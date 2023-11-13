// TODO styles personnalisés
//   cf. https://maplibre.org/maplibre-gl-directions/#/examples/restyling

// The following layers are used in the "Restyling" example.
const layers = [
  {
    id: "maplibre-gl-directions-routeline",
    type: "line",
    source: "maplibre-gl-directions",
    layout: {
      "line-cap": "butt",
      "line-join": "round",
    },
    paint: {
      "line-pattern": "routeline",
      "line-width": 12,
    },
    filter: ["==", ["get", "route"], "SELECTED"],
  },
];

export default layers;