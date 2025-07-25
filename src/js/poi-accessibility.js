/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

/**
 * Copyright (c) 2018, Mapbox
 * @see https://github.com/mapbox/mapbox-gl-accessibility/tree/publisher-production
 */

import debounce from "lodash/debounce";

import Legend from "./map-interactivity/legend-plan-ign";

class MapboxAccessibility {
  constructor(map, options) {
    this.map = map;
    this.layers = options.layers || [
      "POI OSM isochrone$$$OSM.POI$TMS",
      "POI OSM 14$$$OSM.POI$TMS",
      "POI OSM 15$$$OSM.POI$TMS",
      "POI OSM 16et17$$$OSM.POI$TMS",
      "POI OSM 18et19$$$OSM.POI$TMS",
    ];
    this.features = null;
    map.on("movestart", this._movestart);
    map.on("moveend", this._render);
    map.on("render", this._render);
    this._debouncedQueryFeatures = debounce(this.queryFeatures, 100);
  }

  clearMarkers = () => {
    if (this.features) {
      this.features.forEach(feature => {
        if (feature.marker) {
          this.map.getCanvasContainer().removeChild(feature.marker);
          delete feature.marker;
        }
      });
    }
  };

  queryFeatures = () => {
    this._debouncedQueryFeatures.cancel();
    this.clearMarkers();

    this.features = this.map.queryRenderedFeatures({ layers: this.layers });
    this.features.map((feature) => {
      const label = Legend.beautifyLayerName(feature, "poi_osm").split("<p class=\"positionSubTitle\">")[0];

      feature.marker = document.createElement("button");
      feature.marker.setAttribute("title", label);
      feature.marker.setAttribute("tabindex", 0);
      feature.marker.className = "mapboxgl-accessibility-marker";

      let position;
      if (feature.geometry.type === "Point") {
        position = this.map.project(feature.geometry.coordinates);
      }
      feature.marker.style.transform = `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`;

      this.map.getCanvasContainer().appendChild(feature.marker);
      return feature;
    });
  };

  _movestart = () => {
    this._debouncedQueryFeatures.cancel();
    this.clearMarkers();
  };

  _render = () => {
    if (!this.map.isMoving()) {
      this._debouncedQueryFeatures();
    }
  };
}

export default MapboxAccessibility;
