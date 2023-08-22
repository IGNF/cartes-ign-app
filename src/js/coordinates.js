import DOM from './dom';

/* Coordonnées */
/* CRS */
proj4.defs("EPSG:2154","+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:3857","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs");
proj4.defs("EPSG:27572","+proj=lcc +lat_1=46.8 +lat_0=46.8 +lon_0=0 +k_0=0.99987742 +x_0=600000 +y_0=2200000 +a=6378249.2 +b=6356515 +towgs84=-168,-60,320,0,0,0,0 +pm=paris +units=m +no_defs");

function convertCoords(coords) {
  /**
   * Returns [lat, lng] if geographic, [x, y] otherwise
   */
  let X;
  let Y;
  let lat;
  let lng;
  let new_coords;
  const crs = document.querySelector('input[name="coordRadio"]:checked').value;
  switch (crs) {
    case 'latlng':
      lat = coords[1].toFixed(6);
      lng = coords[0].toFixed(6);
      return [lat, lng];
    case 'merc':
      new_coords = proj4('EPSG:3857', coords)
      X = new_coords[0].toFixed(1);
      Y = new_coords[1].toFixed(1);
      return [X, Y];
    case 'l93':
      new_coords = proj4('EPSG:2154', coords)
      X = new_coords[0].toFixed(1);
      Y = new_coords[1].toFixed(1);
      return [X, Y];
    case 'l2e':
      new_coords = proj4('EPSG:27572', coords)
      X = new_coords[0].toFixed(1);
      Y = new_coords[1].toFixed(1);
      return [X, Y];
  }
}

/**
 *
 * @param {Object} coords Résultat de map.getCoords(), contient un champ lat et un champ lng
 */
function updateCenterCoords(coords) {
  const coordsToDisplay = convertCoords([coords.lng, coords.lat]);
  DOM.$centerCoords.innerHTML = coordsToDisplay[0] + ", " + coordsToDisplay[1];
}

function reticuleOnOff() {
  const checked = DOM.$chkPrintCoordsReticule.checked;
  if (checked) {
    document.getElementById("centerCoords").classList.remove("d-none");
    document.getElementById("centerReticule").classList.remove("d-none");
    document.getElementById("coordTypeDisplay").classList.remove("d-none");
  } else {
    document.getElementById("centerCoords").classList.add("d-none");
    document.getElementById("centerReticule").classList.add("d-none");
    document.getElementById("coordTypeDisplay").classList.add("d-none");
  }
}

export default {
  updateCenterCoords,
  reticuleOnOff,
}
