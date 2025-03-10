/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

/** resultats des services */
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
 * @fire reverse
 */
const compute = async (coordinates) => {
  clear();

  abortController = new AbortController();

  let url = new URL("https://data.geopf.fr/geocodage/reverse");
  let params = {
    index: "address,poi",
    searchgeom: `{"type":"Circle","coordinates":[${coordinates.lon},${coordinates.lat}],"radius":100}`,
    lon: coordinates.lon,
    lat: coordinates.lat,
    limit: 1,
    category: "commune",
  };

  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  var response = await fetch(url, { signal: abortController.signal });
  var geojson = await response.json();

  if (response.status !== 200) {
    throw new Error(response.message);
  }
  let number = "";
  let street = "";
  let postcode = "";
  let city = "";
  let lon = coordinates.lon;
  let lat = coordinates.lat;

  if (geojson.features[0]) {
    if (geojson.features[0].properties._type === "address") {
      if (geojson.features[0].properties.housenumber) {
        number = geojson.features[0].properties.housenumber;
      }
      if (geojson.features[0].properties.street) {
        street = geojson.features[0].properties.street;
      } else {
        street = geojson.features[0].properties.name;
      }
      postcode = geojson.features[0].properties.postcode;
      city = geojson.features[0].properties.city;
      lon = geojson.features[0].geometry.coordinates[0];
      lat = geojson.features[0].geometry.coordinates[1];
    } else if (geojson.features[0].properties._type === "poi") {
      if (geojson.features[0].properties.city) {
        city = geojson.features[0].properties.city[0];
      } else {
        city = geojson.features[0].properties.toponym;
      }
      if (geojson.features[0].properties.postcode) {
        postcode = geojson.features[0].properties.postcode[0];
      }
    }
  }

  var address = {
    number : number,
    street : street,
    postcode : postcode,
    city : city
  };

  results = {
    coordinates : {
      lon : lon,
      lat : lat,
    },
    address : address,
  };

  target.dispatchEvent(
    new CustomEvent("reverse", {
      bubbles: true,
      detail: results
    })
  );
  return results;
};

/**
 * obtenir les coordonnées
 * @example
 * { lon lat }
 */
const getCoordinates = () => {
  if (!results) {
    return null;
  }
  return results.coordinates;
};

/**
 * obtenir l'adresse
 * @example
 * { number  street  postcode  city }
 */
const getAddress = () => {
  if (!results) {
    return null;
  }
  if (results &&
        results.address.number === "" &&
        results.address.street === "" &&
        results.address.postcode === "" &&
        results.address.city === "") {
    return null;
  }
  return results.address;
};

const clear = () => {
  abortController.abort();
  results = null;
};

export default {
  target,
  compute,
  getCoordinates,
  getAddress
};
