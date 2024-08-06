/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

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

  // https://en.wikipedia.org/wiki/Naismith's_rule#Scarf's_equivalence_between_distance_and_climb
  // all parameters in standard units (meters and m/s, result in seconds)
  getHikeTimeScarfsRule(horizontalDistance, verticalDistance, speed) {
    const equivalentDistance = horizontalDistance + 7.92 * verticalDistance;
    return equivalentDistance / speed;
  },
};

export default gisUtils;
