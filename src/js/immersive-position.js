/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import queryConfig from "./data-layer/immersvie-position-config.json";
import code_cultuCaption from "./data-layer/code_cultu-caption.json";
import proj4 from "proj4";
proj4.defs("EPSG:2154","+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");

/**
 * Gestion de la "position immersive" avec des requêtes faites aux données autour d'une position
 * @fires dataLoaded
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

    this.data = {};
  }

  /**
   * Computes html string from availmable data
   */
  computeHtml() {
    let htmlTemplate = `
      <p>Localisation</p>
      <p>Vous êtes sur la commune de ${this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:commune"] ? this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:commune"][0][0] : "chargement..."} (${this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:commune"] ? this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:commune"][0][1] : "chargement..."} habitants), du département de ${this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:departement"] ? this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:departement"][0] : "chargement..."}</p>
    `;

    if (this.data["BDTOPO_V3:foret_publique"] && this.data["BDTOPO_V3:foret_publique"].length) {
      let forestHTML;
      if (this.data["Essence intesection"] && this.data["Essence intesection"].length) {
        forestHTML = `
          <p>Vous vous trouvez dans la ${this.data["BDTOPO_V3:foret_publique"][0]}, dont l'essence principale est ${this.data["Essence intesection"][0]}</p>
        `;
      } else {
        forestHTML = `
          <p>Vous vous trouvez dans la ${this.data["BDTOPO_V3:foret_publique"][0]}.</p>
        `;
      }
      htmlTemplate += forestHTML;
    }

    if (this.data["BDTOPO_V3:parc_ou_reserve"] && this.data["BDTOPO_V3:parc_ou_reserve"].length) {
      let parcHtml = `
        <p>Vous êtes situé au sein ${this.data["BDTOPO_V3:parc_ou_reserve"][0][0]} de ${this.data["BDTOPO_V3:parc_ou_reserve"][0][1]}.
      `;
      if (this.data["BDTOPO_V3:parc_ou_reserve"][0][0] === "Site Natura 2000") {
        parcHtml += " Vous êtes sur un site classé Natura 2000 où la faune et la flore sont protégés.";
      }
      parcHtml += "</p>";
      htmlTemplate += parcHtml;
    }

    htmlTemplate += "<p>Alentours</p>";

    if (this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"] && this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"].length) {
      let plantHtml;
      if (this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"].length === 1) {
        plantHtml = `
          <p>Aux alentous, l'essence principale des bois et fôrets est ${this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"][0]}
        `;
      } else {
        let essenceList = "";
        for (let i = 0; i < this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"].length - 1; i++) {
          essenceList += this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"][i] + ", ";
        }
        essenceList += " et " + this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"][this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"].length - 1];
        plantHtml = `
          <p>Aux alentous, les essences principales des bois et forêts sont ${essenceList}
        `;
      }
      if (this.data["RPG.LATEST:parcelles_graphiques"] && this.data["RPG.LATEST:parcelles_graphiques"].length) {
        let cultureList = "";
        if (this.data["RPG.LATEST:parcelles_graphiques"].length === 1) {
          cultureList = this.data["RPG.LATEST:parcelles_graphiques"][0];
        } else {
          for (let i = 0; i < this.data["RPG.LATEST:parcelles_graphiques"].length - 1; i++) {
            cultureList += this.data["RPG.LATEST:parcelles_graphiques"][i] + ", ";
          }
          cultureList += " et " + this.data["RPG.LATEST:parcelles_graphiques"][this.data["RPG.LATEST:parcelles_graphiques"].length - 1];
        }
        plantHtml += ` et les cultures agricoles sont ${cultureList}`;
      }
      plantHtml += ".</p>";

      htmlTemplate += plantHtml;

    } else if (this.data["RPG.LATEST:parcelles_graphiques"] && this.data["RPG.LATEST:parcelles_graphiques"].length) {
      let cultureList = "";
      if (this.data["RPG.LATEST:parcelles_graphiques"].length === 1) {
        cultureList = this.data["RPG.LATEST:parcelles_graphiques"][0];
      } else {
        for (let i = 0; i < this.data["RPG.LATEST:parcelles_graphiques"].length - 1; i++) {
          cultureList += this.data["RPG.LATEST:parcelles_graphiques"][i] + ", ";
        }
        cultureList += " et " + this.data["RPG.LATEST:parcelles_graphiques"][this.data["RPG.LATEST:parcelles_graphiques"].length - 1];
      }
      const plantHtml = `Aux alentours, les cultures agricoles sont ${cultureList}.</p>`;
      htmlTemplate += plantHtml;
    }

    if (this.data["BDTOPO_V3:toponymie_lieux_nommes"] && this.data["BDTOPO_V3:toponymie_lieux_nommes"].length) {
      let boisList = this.data["BDTOPO_V3:toponymie_lieux_nommes"][0];
      for (let i = 1; i < this.data["BDTOPO_V3:toponymie_lieux_nommes"].length; i++) {
        boisList += ", " + this.data["BDTOPO_V3:toponymie_lieux_nommes"][i];
      }
      const boisHtml = `<p>Vous êtes à proximité des bois suivants : ${boisList}.</p>`;
      htmlTemplate += boisHtml;
    }

    if (this.data["BDTOPO_V3:cours_d_eau"] && this.data["BDTOPO_V3:cours_d_eau"].length) {
      let waterList = this.data["BDTOPO_V3:cours_d_eau"][0];
      for (let i = 1; i < this.data["BDTOPO_V3:cours_d_eau"].length; i++) {
        waterList += ", " + this.data["BDTOPO_V3:cours_d_eau"][i];
      }

      if (this.data["BDTOPO_V3:plan_d_eau"] && this.data["BDTOPO_V3:plan_d_eau"].length) {
        for (let i = 0; i < this.data["BDTOPO_V3:plan_d_eau"].length; i++) {
          waterList += ", " + this.data["BDTOPO_V3:plan_d_eau"][i][1];
        }
      }
      const waterHtml = `<p>Les cours d'eau environnants sont ${waterList}.</p>`;
      htmlTemplate += waterHtml;

    } else if (this.data["BDTOPO_V3:plan_d_eau"] && this.data["BDTOPO_V3:plan_d_eau"].length) {
      let waterList = this.data["BDTOPO_V3:plan_d_eau"][0][1];
      for (let i = 1; i < this.data["BDTOPO_V3:plan_d_eau"].length; i++) {
        waterList += ", " + this.data["BDTOPO_V3:plan_d_eau"][i][1];
      }
      const waterHtml = `<p>Les cours d'eau environnants sont ${waterList}.</p>`;
      htmlTemplate += waterHtml;
    }

    if (this.data["BDTOPO_V3:zone_d_habitation"] && this.data["BDTOPO_V3:zone_d_habitation"].length) {
      let otherList = this.data["BDTOPO_V3:zone_d_habitation"][0];
      for (let i = 1; i < this.data["BDTOPO_V3:zone_d_habitation"].length; i++) {
        otherList += ", " + this.data["BDTOPO_V3:zone_d_habitation"][i];
      }
      if (this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"] && this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"].length) {
        for (let i = 0; i < this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"].length; i++) {
          otherList += `, ${this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"][i][1]} (${this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"][i][0]})`;
        }
      }
      const otherHtml = `<p>Non loin se trouvent également : ${otherList}.</p>`;
      htmlTemplate += otherHtml;

    } else if (this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"] && this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"].length) {
      let otherList = `${this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"][0][1]} (${this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"][0][0]})`;
      for (let i = 1; i < this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"].length; i++) {
        otherList += `, ${this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"][i][1]} (${this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"][i][0]})`;
      }
      const otherHtml = `<p>Non loin se trouvent également : ${otherList}.</p>`;
      htmlTemplate += otherHtml;
    }

    return htmlTemplate;
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

    this.data[config.id] = result;

    this.dispatchEvent(
      new CustomEvent("dataLoaded", {
        bubbles: true,
      })
    );
  }

  /**
   * Filters the data results according to specific rules
   * @param {String} layer
   * @param {Array} dataResults
   * @returns
   */
  #filterData(layer, dataResults) {
    if (layer === "LANDCOVER.FORESTINVENTORY.V2:formation_vegetale") {
      dataResults = dataResults.filter( (essence) => essence !== "NC");
    }
    if (layer === "BDTOPO_V3:zone_d_activite_ou_d_interet") {
      dataResults = dataResults.filter( (zai) => zai[1] !== null);
    }
    if (layer === "RPG.LATEST:parcelles_graphiques") {
      dataResults = dataResults.map( (code_cultu) => code_cultuCaption[code_cultu]).filter((culture) => culture);
    }
    if (layer === "BDTOPO_V3:zone_d_habitation") {
      dataResults = dataResults.filter( (name) => name);
    }
    return dataResults;
  }

  /**
   * Computes data for a given layer of Geoplateforme's WFS
   * @param {string} layer name of the WFS layer
   * @param {Array} attributes list of strings of the relevant attributes to return
   * @param {number} around distance around the point in km for the query, default 0
   * @param {string} geom_name name of the geometry column, default "geom"
   * @param {string} additional_cql cql filter needed other than geometry, e.g. "AND nature_de_l_objet='Bois'", default ""
   * @param {number} epsg epsg number of the layer's CRS, default 4326
   * @returns {Promise(Array)} results of each attributes (no duplicates)
   */
  async #computeGenericGPFWFS(layer, attributes, around=0, geom_name="geom", additional_cql="", epsg=4326) {
    let coord1 = this.lat;
    let coord2 = this.lng;
    if (epsg !== 4326) {
      [coord1, coord2] = proj4(proj4.defs("EPSG:4326"), proj4.defs(`EPSG:${epsg}`), [this.lng, this.lat]);
    }
    let cql_filter = `INTERSECTS(${geom_name},Point(${coord1}%20${coord2}))`;
    if (around > 0) {
      cql_filter = `DWITHIN(${geom_name},Point(${coord1}%20${coord2}),${around},kilometers)`;
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
      if (attributes.length === 1) {
        results_attributes.push(feature_attributes[0]);
      } else {
        results_attributes.push(feature_attributes);
      }
    });
    return Array.from( new Set(this.#filterData(layer, results_attributes)) );
  }
}

export default ImmersivePosion;
