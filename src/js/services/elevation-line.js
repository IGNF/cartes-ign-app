/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import pThrottle from "p-throttle";

import { Capacitor } from "@capacitor/core";

/** resultats du service */
let results;

/** rate-limiting */
const throttle = pThrottle({
  limit: 4,
  interval: 1200
});

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
const compute = async (coordinateList) => {
  // ex. request
  // https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevationLine.json?
  //  lon=1.136383|1.12&
  //  lat=45.95352|49.9&
  //  indent=false&
  //  resource: ign_rge_alti_wld&
  //  sampling=500

  clear();
  if (Capacitor.getPlatform() === "ios") {
    await new Promise(res => setTimeout(res, 25));
  }
  abortController = new AbortController();
  let coordinateListList = [];
  while (coordinateList.length > 1500) {
    coordinateListList.push(coordinateList.splice(0, 1500));
  }
  coordinateListList.push(coordinateList);
  const promiseList = [];
  coordinateListList.forEach((coordList) => {
    const lonStr = coordList.map( (coord) => coord[0]).join("|");
    const latStr = coordList.map( (coord) => coord[1]).join("|");

    let url = new URL("https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevationLine.json");
    let params = {
      lon: lonStr,
      lat: latStr,
      indent: "false",
      sampling: 200,
      resource: "ign_rge_alti_wld",
    };

    const throttled = throttle(async (url, options) => {
      const response = await fetch(url, options);
      return response.json();
    });

    promiseList.push(
      throttled(url, {
        method: "POST",
        signal: abortController.signal,
        body: JSON.stringify(params),
        headers: {
          "accept": "application/json",
          "Content-Type": "application/json",
        },
      })
    );
  });

  const result = {
    "elevations": [],
  };
  // ex. response
  // {"elevations": [{"lon": 0.2367,"lat": 48.0551,"z": 96.53,"acc": 2.5},{"lon": 2.157,"lat": 46.6077,"z": 208.77,"acc": 2.5},{"lon": 4.3907,"lat": 43.91,"z": 182.68,"acc": 2.5}]}
  const responses = await Promise.all(promiseList);
  responses.forEach( (response) => {
    result["elevations"] = result["elevations"].concat(response["elevations"]);
  });

  target.dispatchEvent(
    new CustomEvent("elevationLine", {
      bubbles: true,
      detail: result
    })
  );

  return result;
};

/**
 * obtenir la valeur Z
 * @example
 * { lon lat }
 */
const getElevationLine = () => {
  if (!results.elevations) {
    return [];
  }
  return results.elevations;
};

const clear = () => {
  abortController.abort();
  results = null;
};

export default {
  target,
  compute,
  getElevationLine,
  clear,
};
