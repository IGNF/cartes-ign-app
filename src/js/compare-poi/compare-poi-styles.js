// styles personnalisés
const layers = {
  "selected-compare-poi": {
    id: "selected-compare-poi",
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
      "circle-color": "#26A581"
    }
  },
};

export default layers;
