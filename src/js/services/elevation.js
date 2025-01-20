/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

/** resultats du service */
let results;

/** gestion annulation du fetch */
let abortController = new AbortController();
/**
 * Interface pour les evenements
 * @example
 * target.dispatchEvent(new CustomEvent("myEvent", { detail : {} }));
 * target.addEventListener("myEvent", handler);
 */
const target = new EventTarget();

/**
 * service
 * @param {*} coordinates
 * @returns
 * @fire elevation
 */
const compute = async (coordinates) => {

  // ex. request
  // https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json?
  //  lon=2.336889922615051&
  //  lat=48.867264998294104&
  //  indent=false&
  //  crs=%27CRS:84%27&
  //  zonly=true&
  //  resource=ign_rge_alti_wld

  clear();

  abortController = new AbortController();

  let url = new URL("https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json");
  let params = {
    indent: false,
    zonly: true,
    resource: "ign_rge_alti_wld",
    lon: coordinates.lon,
    lat: coordinates.lat
  };

  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  var response = await fetch(url, { signal : abortController.signal });
  results = await response.json();

  if (response.status !== 200) {
    throw new Error(response.message);
  }

  // ex. response
  // {"elevations": [35.81]}

  target.dispatchEvent(
    new CustomEvent("elevation", {
      bubbles: true,
      detail: results
    })
  );

  return results;
};

/**
 * obtenir la valeur Z
 * @example
 * { lon lat }
 */
const getElevation = () => {
  if (!results) {
    return 0;
  }
  if (!results.elevations) {
    return 0;
  }
  if (results.elevations[0] == -99999) {
    return 0;
  }
  return results.elevations[0];
};

const clear = () => {
  abortController.abort();
  results = null;
};

export default {
  target,
  compute,
  getElevation
};
