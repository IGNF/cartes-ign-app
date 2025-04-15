/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import proj4 from "proj4";
proj4.defs("EPSG:2154","+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");

/**
 * Requests WFS data in a given location for a given layer of Geoplateforme's WFS
 * @param {number} lat latitude of the point
 * @param {number} lng longitude of the point
 * @param {string} layer name of the WFS layer
 * @param {Array} attributes list of strings of the relevant attributes to return
 * @param {number} around distance around the point in km for the query, default 0
 * @param {string} geom_name name of the geometry column, default "geom"
 * @param {string} additional_cql cql filter needed other than geometry, e.g. "AND nature_de_l_objet='Bois'", default ""
 * @param {number} epsg epsg number of the layer's CRS, default 4326
 * @returns {Promise(Array)} results of each attributes (no duplicates)
 */
async function requestWfs(lat, lng, layer, attributes, around=0, geom_name="geom", additional_cql="", epsg=4326, getGeom=false) {
  let coord1 = lat;
  let coord2 = lng;
  if (epsg !== 4326) {
    [coord1, coord2] = proj4(proj4.defs("EPSG:4326"), proj4.defs(`EPSG:${epsg}`), [lng, lat]);
  }
  let cql_filter = `INTERSECTS(${geom_name},Point(${coord1}%20${coord2}))`;
  if (around > 0) {
    cql_filter = `DWITHIN(${geom_name},Point(${coord1}%20${coord2}),${around},kilometers)`;
  }
  if (additional_cql) {
    cql_filter += ` ${additional_cql}`;
  }

  const results = await fetch(
    `https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&typename=${layer}&outputFormat=json&count=50&CQL_FILTER=${cql_filter}`
  );
  const json = await results.json();

  const results_attributes = [];
  json.features.forEach((feature) => {
    const feature_attributes = [];
    let allNull = true;
    attributes.forEach((attribute) => {
      feature_attributes.push(feature.properties[attribute]);
      if (feature.properties[attribute] !== null) {
        allNull = false;
      }
    });
    if (getGeom) {
      feature_attributes.push(feature.geometry);
    }
    if (attributes.length === 1 && feature_attributes[0] !== null && !getGeom) {
      results_attributes.push(feature_attributes[0]);
    } else if (!allNull && (attributes.length > 1 || getGeom)) {
      results_attributes.push(feature_attributes);
    }
  });
  return results_attributes;
}


export default {
  requestWfs,
};
