/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import { lineOverlap } from "@turf/line-overlap";

/**
 * Fonctions utilitaires
 */
let gisUtils = {
  // "get bounds from a polygon"
  getBoundingBox(data) {
    var bounds = {};
    for (var i = 0; i < data.length; i++) {
      var lon = data[i][0];
      var lat = data[i][1];
      bounds.xMin = bounds.xMin < lon ? bounds.xMin : lon;
      bounds.xMax = bounds.xMax > lon ? bounds.xMax : lon;
      bounds.yMin = bounds.yMin < lat ? bounds.yMin : lat;
      bounds.yMax = bounds.yMax > lat ? bounds.yMax : lat;
    }

    return [[bounds.xMin, bounds.yMin], [bounds.xMax, bounds.yMax]];
  },

  // adapted from https://github.com/IGNF/road2/blob/9069468d0f1fa22dcb59073f57b4924de4fcb4f3/src/js/utils/gisManager.js#L87C3-L144C4
  geoJsonMultiLineStringCoordsToSingleLineStringCoords(srcCoords) {
    if (srcCoords.length === 0) {
      return [];
    }

    if (srcCoords.length === 1) {
      return srcCoords[0];
    }

    // Transformation des coordonnées en mode MultiLineString vers LineString
    const dissolvedCoords = [];
    const firstLine = srcCoords[0];

    dissolvedCoords.push(...firstLine);

    for (let i = 1; i < srcCoords.length; i++) {
      let curr_line = srcCoords[i];
      curr_line.splice(0, 1);
      dissolvedCoords.push(...curr_line);
    }

    return dissolvedCoords;
  },

  getCoordinateDistance(coordA, coordB) {
    if (!Array.isArray(coordA) || !Array.isArray(coordB) || coordA.length < 2 || coordB.length < 2) {
      return Infinity;
    }

    const toRadians = (degrees) => degrees * Math.PI / 180;
    const lon1 = coordA[0];
    const lat1 = coordA[1];
    const lon2 = coordB[0];
    const lat2 = coordB[1];
    const earthRadius = 6371000;
    const deltaLat = toRadians(lat2 - lat1);
    const deltaLon = toRadians(lon2 - lon1);
    const sinLat = Math.sin(deltaLat / 2);
    const sinLon = Math.sin(deltaLon / 2);
    const a = sinLat * sinLat + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * sinLon * sinLon;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  },

  getRouteDisplayGeometry(route, toleranceMeters = 5) {
    if (!route || !route.data || !Array.isArray(route.data.steps) || route.data.steps.length === 0) {
      return {
        type: "LineString",
        coordinates: [],
      };
    }

    const mergedCoordinates = [];

    route.data.steps.forEach((step) => {
      if (!step || !step.geometry || !Array.isArray(step.geometry.coordinates) || step.geometry.coordinates.length === 0) {
        return;
      }

      const stepCoordinates = step.geometry.coordinates.map((coord) => [...coord]);

      if (mergedCoordinates.length > 0) {
        const previousCoord = mergedCoordinates[mergedCoordinates.length - 1];
        const nextCoord = stepCoordinates[0];
        const distance = this.getCoordinateDistance(previousCoord, nextCoord);

        if (distance <= toleranceMeters) {
          stepCoordinates.shift();
        } else if (distance <= toleranceMeters * 3) {
          stepCoordinates[0] = previousCoord.length >= 2 ? [previousCoord[0], previousCoord[1], ...(previousCoord.slice(2))] : [...previousCoord];
        }
      }

      mergedCoordinates.push(...stepCoordinates);
    });

    return {
      type: "LineString",
      coordinates: mergedCoordinates,
    };
  },

  // https://en.wikipedia.org/wiki/Naismith's_rule#Scarf's_equivalence_between_distance_and_climb
  // all parameters in standard units (meters and m/s, result in seconds)
  getHikeTimeScarfsRule(horizontalDistance, verticalDistance, speed) {
    const equivalentDistance = horizontalDistance + 7.92 * verticalDistance;
    return equivalentDistance / speed;
  },

  /**
   * Fonction de transformation coordonnées vers pixels d'une tuile
   * @param {*} lat
   * @param {*} lng
   * @param {*} zoom
   * @returns
  */
  latlngToTilePixel(lat, lng, zoom) {
    // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    const fullXTile = (lng + 180) / 360 * Math.pow(2, zoom);
    const fullYTile = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
    const tile = {
      x: Math.floor(fullXTile),
      y: Math.floor(fullYTile),
    };
    const tilePixel = {
      x: Math.floor((fullXTile - tile.x) * 256),
      y: Math.floor((fullYTile - tile.y) * 256),
    };
    return [tile, tilePixel];
  },

  /**
   * Détecte si un itinéraire (au format drawRouteSaveOptions) contient une boucle, i.e. si la géométrie se chevauche
   * @param {Object} route au format drawRouteSaveOptions
   * @returns {boolean} true si l'itinéraire contient une boucle, false sinon
   */
  hasRouteLoop(route) {
    if (!route || !route.data || !route.data.steps) {
      return false;
    }
    for (let i = 0; i < route.data.steps.length; i++) {
      const step = route.data.steps[i];
      for (let j = i + 1; j < route.data.steps.length; j++) {
        const step2 = route.data.steps[j];
        if (step.properties.id !== step2.properties.id) {
          const overlap = lineOverlap(step.geometry, step2.geometry);
          if (overlap.features.length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  },
};

export default gisUtils;
