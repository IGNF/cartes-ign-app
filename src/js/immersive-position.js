/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import proj4 from "proj4";

const queryConfig = [
  {
    layer: "LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:commune",
    attributes: ["nom", "population"],
    event: "cityLoaded",
  },
  {
    layer: "LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:departement",
    attributes: ["nom"],
    event: "deptLoaded",
  },
  {
    layer: "BDTOPO_V3:parc_ou_reserve",
    attributes: ["nature", "toponyme"],
    geom_name: "geometrie",
    event: "parcLoaded",
  },
]

/**
 * Gestion de la "position immersive" avec des requêtes faites aux données autour d'une position
 * @fires cityLoaded
 * @fires deptLoaded
 * @fires parcLoaded
 * @fires forestLoaded
 * @fires agriLoaded
 * @fires zaiLoaded
 * @fires waterLoaded
 */
class ImmersivePosion extends EventTarget {
  /**
   * constructeur
   * @param {*} options -
   * @param {*} options.lat - latitude
   * @param {*} options.lng - longitude
   */
  constructor(options) {
    super();
    this.options = options || {
      lat : 0,
      lng : 0,
    };
    this.lat = this.options.lat;
    this.lng = this.options.lng;
  }

  /**
   * Computes all data queries
   */
  computeAll() {
    queryConfig.forEach( (config) => {
      this.#computeFromConfig(config);
    });
  }

  /**
   * Queries GPF's WFS for info defined in the config
   */
  async #computeFromConfig(config) {
    const result = await this.#computeGenericGPFWFS(
      config.layer,
      config.attributes,
      config.around || 0,
      config.geom_name || "geom",
      config.additional_cql || "",
      config.epsg || 4326,
    );

    this.dispatchEvent(
      new CustomEvent(config.event, {
        bubbles: true,
        detail: result
      })
    );
  }

  /**
   * Computes data for a given layer of Geoplateforme's WFS
   * @param {string} layer name of the WFS layer
   * @param {Array} attributes list of strings of the relevant attributes to return
   * @param {number} around distance around the point in km for the query, default 0
   * @param {string} geom_name name of the geometry column, default "geom"
   * @param {string} additional_cql cql filter needed other than geometry, e.g. "AND nature_de_l_objet='Bois'", default ""
   * @param {number} epsg epsg number of the layer's CRS, default 4326
   */
  async #computeGenericGPFWFS(layer, attributes, around=0, geom_name="geom", additional_cql="", epsg=4326) {
    let coord1 = this.lat;
    let coord2 = this.lng;
    if (epsg !== 4326) {
      [coord1, coord2] = proj4(proj4.defs("EPSG:4326"), proj4.defs(`EPSG:${epsg}`), [this.lng, this.lat])
    }
    let cql_filter = `INTERSECTS(${geom_name},Point(${coord1}%20${coord2}))`;
    if (around > 0) {
      cql_filter = `DWITHIN(geometrie,Point(${coord1}%20${coord2}),${around},kilometers)`;
    }
    if (additional_cql) {
      cql_filter += ` ${additional_cql}`;
    }

    const results = await fetch(
      `https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&typename=${layer}&outputFormat=json&count=10&CQL_FILTER=${cql_filter}`
    );
    const json = await results.json();

    const results_attributes = [];
    json.features.forEach((feature) => {
      const feature_attributes = [];
      attributes.forEach((attribute) => {
        feature_attributes.push(feature.properties[attribute]);
      });
      results_attributes.push(feature_attributes);
    });

    return results_attributes;
  }
}

export default ImmersivePosion;
