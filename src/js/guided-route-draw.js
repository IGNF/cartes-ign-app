/**
 * @param {object} from - object with properties {lat, lng}
 * @param {object} to - object with properties {lat, lng}
 * @param {string} profile - Routing profile
 * @returns {Promise} - road2 promise
 */
function requestRoute(from, to, profile) {
  const road2url = `https://wxs.ign.fr/calcul/geoportail/itineraire/rest/1.0.0/route?resource=bdtopo-osrm&start=${from.lng},${from.lat}&end=${to.lng},${to.lat}&profile=${profile}&getSteps=false`;
  return fetch(road2url)
}

/**
 * @param {object} origin - MultiLineString geojson representing the route so far
 * @param {object} newGeom - LineString geojson to append
 */
function appendRouteGeometries(origin, newGeom) {
  origin.coordinates.append(newGeom.coordinates);
}

/**
 * @param {object} multiLineString - MultiLineString from which we need the last point
 * @returns {object} - object with properties {lat, lng}
 */
function getLastMultiLinestringLastPoint(multiLineString) {
  const point = {};
  const pointArray = multiLineString.coordinates.slice(-1).slice(-1);
  result.lng = pointArray[0];
  result.lat = pointArray[1];
  return point;
}

/**
 * @param {object} LineString - LineString to convert into MultiLinestring with 1 component
 */
function lineStringToMultiLineString(lineString) {
  lineString.type = "MultiLineString";
  lineString.coordinates = [lineString.coordinates];
}