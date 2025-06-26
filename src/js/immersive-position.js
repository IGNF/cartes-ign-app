/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import QueryConfig from "../../config/immersive-position-config.json";
import Code_cultuCaption from "../../config/code_cultu-caption.json";
import Code_tfvCaption from "../../config/code_tfv-caption.json";

import maplibregl from "maplibre-gl";
import PointToLineDistance from "@turf/point-to-line-distance";
import CleanCoords from "@turf/clean-coords";

import requestUtils from "./utils/request-utils";

let queryConfig;
let code_cultuCaption;
let code_tfvCaption;
try {
  const resp = await fetch("https://ignf.github.io/cartes-ign-app/immersive-position-config.json");
  queryConfig = await resp.json();
} catch (e) {
  queryConfig = QueryConfig;
}
try {
  const resp = await fetch("https://ignf.github.io/cartes-ign-app/code_cultu-caption.json");
  code_cultuCaption = await resp.json();
} catch (e) {
  code_cultuCaption = Code_cultuCaption;
}
try {
  const resp = await fetch("https://ignf.github.io/cartes-ign-app/code_tfv-caption.json");
  code_tfvCaption = await resp.json();
} catch (e) {
  code_tfvCaption = Code_tfvCaption;
}

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
    this.hasFeuillu = false;
    this.hasConnifere = false;
    this.hasNatural2000 = false;
  }

  /**
   * Computes html string from availmable data
   */
  computeHtml() {
    let htmlTemplate = `
      <p>&#x1F3E0; Vous êtes sur la commune de ${this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:commune"] ? this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:commune"][0][0] : "chargement..."}, qui compte ${this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:commune"] ? parseInt(this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:commune"][0][1]).toLocaleString() : "chargement..."} habitants, située dans le département de ${this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:departement"] ? this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:departement"][0] : "chargement..."}</p>
    `;

    if (this.data["BDTOPO_V3:parc_ou_reserve"] && this.data["BDTOPO_V3:parc_ou_reserve"].length) {
      let parcHtml = "<p>";
      for (let i = 0; i < this.data["BDTOPO_V3:parc_ou_reserve"].length; i++) {
        let egalementStr = i === 0 ? "" : "également ";
        if (["Parc naturel régional", "Parc national"].includes(this.data["BDTOPO_V3:parc_ou_reserve"][i][0])) {
          parcHtml += `&#x1F3DE;&#xFE0F; Vous êtes ${egalementStr}situé au sein du ${this.data["BDTOPO_V3:parc_ou_reserve"][i][1]}. `;
        } else if (["Réserve naturelle"].includes(this.data["BDTOPO_V3:parc_ou_reserve"][i][0])) {
          parcHtml += `Vous êtes ${egalementStr}situé au sein de la ${this.data["BDTOPO_V3:parc_ou_reserve"][i][1]}. `;
        } else if (this.data["BDTOPO_V3:parc_ou_reserve"][i][0] === "Site Natura 2000") {
          let name = this.data["BDTOPO_V3:parc_ou_reserve"].length === 1 ? ` (${this.data["BDTOPO_V3:parc_ou_reserve"][i][1]})` : "";
          parcHtml += `Vous êtes sur un site classé Natura 2000${name} où la faune et la flore sont protégées.`;
        } else {
          parcHtml += `Vous êtes ${egalementStr}situé au sein du/de la ${this.data["BDTOPO_V3:parc_ou_reserve"][i][0]} de ${this.data["BDTOPO_V3:parc_ou_reserve"][i][1]}. `;
        }
      }
      parcHtml += "</p>";
      htmlTemplate += parcHtml;
    }

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

    if (this.data["BDTOPO_V3:toponymie_lieux_nommes"] && this.data["BDTOPO_V3:toponymie_lieux_nommes"].length) {
      let boisList = this.data["BDTOPO_V3:toponymie_lieux_nommes"][0];
      for (let i = 1; i < this.data["BDTOPO_V3:toponymie_lieux_nommes"].length; i++) {
        boisList += ", " + this.data["BDTOPO_V3:toponymie_lieux_nommes"][i];
      }
      const boisHtml = `<p>Vous êtes à proximité des bois suivants : ${boisList}.</p>`;
      htmlTemplate += boisHtml;
    }

    if (this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"] && this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"].length) {
      let plantHtml;
      let feuilluStr = this.hasFeuillu ? "&#127795; " : "";
      let connifereStr = this.hasConnifere ? "&#127794; " : "";
      if (this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"].length === 1) {
        plantHtml = `
          <p>Aux alentours, l’essence des bois et forêts est principalement constituée de ${feuilluStr}${connifereStr} ${this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"][0]}.`;
      } else {
        let essenceList = this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"][0];
        for (let i = 1; i < this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"].length - 1; i++) {
          essenceList += ", " + this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"][i];
        }
        essenceList += " et " + this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"][this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"].length - 1];
        plantHtml = `
          <p>Aux alentours, l’essence des bois et forêts est principalement constituée de ${feuilluStr}${connifereStr} ${essenceList}.`;
      }
      if (this.data["RPG.LATEST:parcelles_graphiques"] && this.data["RPG.LATEST:parcelles_graphiques"].length) {
        let cultureList = this.data["RPG.LATEST:parcelles_graphiques"][0];
        if (this.data["RPG.LATEST:parcelles_graphiques"].length > 1) {
          for (let i = 1; i < this.data["RPG.LATEST:parcelles_graphiques"].length - 1; i++) {
            cultureList += ", " + this.data["RPG.LATEST:parcelles_graphiques"][i];
          }
          cultureList += " et " + this.data["RPG.LATEST:parcelles_graphiques"][this.data["RPG.LATEST:parcelles_graphiques"].length - 1];
        }
        plantHtml += ` L'agriculture est dédiée à la production de cultures telles que ${cultureList}.`;
      }
      plantHtml += "</p>";

      htmlTemplate += plantHtml;

    } else if (this.data["RPG.LATEST:parcelles_graphiques"] && this.data["RPG.LATEST:parcelles_graphiques"].length) {
      let cultureList = this.data["RPG.LATEST:parcelles_graphiques"][0];
      if (this.data["RPG.LATEST:parcelles_graphiques"].length > 1) {
        for (let i = 1; i < this.data["RPG.LATEST:parcelles_graphiques"].length - 1; i++) {
          cultureList += ", " + this.data["RPG.LATEST:parcelles_graphiques"][i];
        }
        cultureList += " et " + this.data["RPG.LATEST:parcelles_graphiques"][this.data["RPG.LATEST:parcelles_graphiques"].length - 1];
      }
      const plantHtml = `Aux alentours, l'agriculture est dédiée à la production de cultures telles que ${cultureList}.</p>`;
      htmlTemplate += plantHtml;
    }

    if (this.data["BDTOPO_V3:cours_d_eau"] && this.data["BDTOPO_V3:cours_d_eau"].length) {
      let waterList = this.data["BDTOPO_V3:cours_d_eau"][0][0];
      for (let i = 1; i < this.data["BDTOPO_V3:cours_d_eau"].length; i++) {
        waterList += ", " + this.data["BDTOPO_V3:cours_d_eau"][i][0];
      }

      if (this.data["BDTOPO_V3:plan_d_eau"] && this.data["BDTOPO_V3:plan_d_eau"].length) {
        for (let i = 0; i < this.data["BDTOPO_V3:plan_d_eau"].length; i++) {
          waterList += ", " + this.data["BDTOPO_V3:plan_d_eau"][i][1];
        }
      }
      const waterHtml = `<p>&#x1F30A; Les cours d'eau environnants sont ${waterList}.</p>`;
      htmlTemplate += waterHtml;

    } else if (this.data["BDTOPO_V3:plan_d_eau"] && this.data["BDTOPO_V3:plan_d_eau"].length) {
      let waterList = this.data["BDTOPO_V3:plan_d_eau"][0][1];
      for (let i = 1; i < this.data["BDTOPO_V3:plan_d_eau"].length; i++) {
        waterList += ", " + this.data["BDTOPO_V3:plan_d_eau"][i][1];
      }
      const waterHtml = `<p>&#x1F30A; Les cours d'eau environnants sont ${waterList}.</p>`;
      htmlTemplate += waterHtml;
    }

    if (this.data["BDTOPO_V3:zone_d_habitation"] && this.data["BDTOPO_V3:zone_d_habitation"].length) {
      let otherList = "&#x1F3F0; " + this.data["BDTOPO_V3:zone_d_habitation"][0];
      for (let i = 1; i < this.data["BDTOPO_V3:zone_d_habitation"].length; i++) {
        otherList += ", " + this.data["BDTOPO_V3:zone_d_habitation"][i];
      }
      if (this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"] && this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"].length) {
        for (let i = 0; i < this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"].length; i++) {
          otherList += `, ${this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"][i][1]} (${this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"][i][0]})`;
        }
      }
      const otherHtml = `<p>&#x1F9D0; Non loin se trouvent également : ${otherList}.</p>`;
      htmlTemplate += otherHtml;

    } else if (this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"] && this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"].length) {
      let otherList = `${this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"][0][1]} (${this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"][0][0]})`;
      for (let i = 1; i < this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"].length; i++) {
        if (this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"][i][0] === "Construction") {
          otherList += `, ${this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"][i][1]}`;
        } else {
          otherList += `, ${this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"][i][1]} (${this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"][i][0]})`;
        }
      }
      const otherHtml = `<p>&#x1F9D0; Non loin se trouvent également : ${otherList}.</p>`;
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
      config.get_geom || false,
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
      dataResults = dataResults.filter( (essence) => essence !== "NC" && essence !== "NR");
    }
    if (layer === "BDTOPO_V3:parc_ou_reserve") {
      dataResults = dataResults.filter( (parc) => {
        if ( !(["Site Natura 2000", "Parc naturel régional", "Parc national", "Réserve naturelle"].includes(parc[0])) ) {
          return false;
        }
        if (["Périmètre de protection d'une réserve naturelle nationale", "Périmètre de protection d'une réserve naturelle régionale"].includes(parc[2])) {
          return false;
        }
        if (parc[0] === "Site Natura 2000") {
          if (this.hasNatural2000) {
            return false;
          }
          this.hasNatural2000 = true;
        }
        return true;
      }).sort((a, b) => {
        if (a[0] === "Parc national") {
          return -1;
        }
        if (b[0] === "Parc national") {
          return 1;
        }
        if (b[0] === "Parc naturel régional" && a[0] !== "Parc national") {
          return 1;
        }
        if (a[0] === "Parc naturel régional" && b[0] !== "Parc national") {
          return -1;
        }
        if (a[0] === "Site Natura 2000") {
          return 1;
        }
        if (b[0] === "Site Natura 2000") {
          return -1;
        }
      });
    }
    if (layer === "BDTOPO_V3:zone_d_activite_ou_d_interet") {
      dataResults = dataResults.filter( (zai) => zai[1] !== null).sort( (a, b) => {
        const coordsA = new maplibregl.LngLat(...a[2].coordinates[0][0][0]);
        const coordsB = new maplibregl.LngLat(...b[2].coordinates[0][0][0]);
        const coordsRef = new maplibregl.LngLat(this.lng, this.lat);
        return coordsRef.distanceTo(coordsA) - coordsRef.distanceTo(coordsB);
      }).slice(0, 5);
    }
    if (layer === "BDTOPO_V3:plan_d_eau") {
      dataResults = dataResults.filter( (plan) => plan[1] !== null);
    }
    if (layer === "RPG.LATEST:parcelles_graphiques") {
      dataResults = dataResults.map( (code_cultu) => code_cultuCaption[code_cultu]).filter((culture) => culture);
    }
    if (layer === "LANDCOVER.FORESTINVENTORY.V2:formation_vegetale") {
      dataResults = dataResults.map( (code_tfv) => {
        if (code_tfvCaption[code_tfv]) {
          if (code_tfv[2] === "1") {
            this.hasFeuillu = true;
          }
          if (code_tfv[2] === "2") {
            this.hasConnifere = true;
          }
        }
        return code_tfvCaption[code_tfv];
      }).filter((essence) => essence);
    }
    if (layer === "BDTOPO_V3:zone_d_habitation") {
      dataResults = dataResults.filter( (feat) => feat[0]).sort( (a, b) => {
        const coordsA = new maplibregl.LngLat(...a[1].coordinates[0][0][0]);
        const coordsB = new maplibregl.LngLat(...b[1].coordinates[0][0][0]);
        const coordsRef = new maplibregl.LngLat(this.lng, this.lat);
        return coordsRef.distanceTo(coordsA) - coordsRef.distanceTo(coordsB);
      }).map( feat => feat[0]).slice(0, 5);
    }
    if (layer === "BDTOPO_V3:cours_d_eau") {
      dataResults = dataResults.filter( (cours) => {
        if (cours[0].split(" ")[0] === "Bras") {
          return false;
        }
        const splitted = cours[0].split(" ");
        for (let word of splitted) {
          if (word.match(/[0-9][0-9]/g)) {
            return false;
          }
        }
        return true;
      }).sort( (a, b) => {
        let featureA = a[1];
        if (featureA.type === "MultiLineString") {
          featureA = {
            type: "LineString",
            coordinates: featureA.coordinates[0]
          };
        }
        let featureB = b[1];
        if (featureB.type === "MultiLineString") {
          featureB = {
            type: "LineString",
            coordinates: featureB.coordinates[0]
          };
        }

        const distanceA = PointToLineDistance([this.lng, this.lat], CleanCoords(featureA));
        const distanceB = PointToLineDistance([this.lng, this.lat], CleanCoords(featureB));
        return distanceA - distanceB;
      });
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
  async #computeGenericGPFWFS(layer, attributes, around=0, geom_name="geom", additional_cql="", epsg=4326, getGeom=false) {
    const results_attributes = await requestUtils.requestWfs(
      this.lat, this.lng, layer, attributes, around, geom_name, additional_cql, epsg, getGeom
    );
    return Array.from(
      new Set( this.#filterData(layer, results_attributes) )
    );
  }
}

export default ImmersivePosion;
