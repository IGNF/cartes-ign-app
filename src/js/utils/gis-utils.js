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
  }
};

export default gisUtils;