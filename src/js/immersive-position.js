/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import proj4 from "proj4";
proj4.defs("EPSG:2154","+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");

const queryConfig = [
  {
    layer: "LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:commune",
    attributes: ["nom", "population"],
  },
  {
    layer: "LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:departement",
    attributes: ["nom"],
  },
  {
    layer: "BDTOPO_V3:parc_ou_reserve",
    attributes: ["nature", "toponyme"],
    geom_name: "geometrie",
  },
  {
    layer: "BDTOPO_V3:foret_publique",
    attributes: ["toponyme"],
    geom_name: "geometrie",
    around: 5,
  },
  {
    layer: "BDTOPO_V3:toponymie_lieux_nommes",
    attributes: ["graphie_du_toponyme"],
    geom_name: "geometrie",
    around: 5,
    additional_cql: "AND nature_de_l_objet='Bois'",
  },
  {
    layer: "LANDCOVER.FORESTINVENTORY.V2:formation_vegetale",
    attributes: ["essence"],
    around: 5,
    epsg: 2154,
  },
  {
    layer: "RPG.LATEST:parcelles_graphiques",
    attributes: ["code_cultu"],
    around: 5,
  },
  {
    layer: "BDTOPO_V3:zone_d_activite_ou_d_interet",
    attributes: ["nature", "toponyme"],
    geom_name: "geometrie",
    around: 5,
    additional_cql: "AND categorie='Culture et loisirs' AND nature IN ('Abri de montagne', 'Aire de détente', 'Camping', 'Construction', 'Ecomusée', 'Hébergement de loisirs', 'Monument', 'Musée', 'Office de tourisme', 'Parc de loisirs', 'Parc zoologique', 'Point de vue', 'Refuge', 'Vestige archéologique')",
  },
  {
    layer: "BDTOPO_V3:cours_d_eau",
    attributes: ["toponyme"],
    geom_name: "geometrie",
    around: 5,
  },
  {
    layer: "BDTOPO_V3:plan_d_eau",
    attributes: ["nature", "toponyme"],
    geom_name: "geometrie",
    around: 5,
    additional_cql: "AND nature IN ('Canal', 'Estuaire', 'Camping', 'Glacier, névé', 'Lac', 'Lagune', 'Mangrove', 'Marais', 'Mare')",
  },
];

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

    // récupération des codes culture pour RPG
    this.codes_culture = {};
    fetch(
      "https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&typename=RPG.LATEST:codes_cultures&outputFormat=json&count=1000"
    ).then((resp) => resp.json()).then( (resp) => {
      resp.features.forEach((feature) => {
        this.codes_culture[feature.properties.code] = feature.properties.libelle;
      });
    });
  }

  /**
   * Computes html string from availmable data
   */
  computeHtml() {
    const htmlTemplate = `
      <p>Ville : ${this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:commune"] ? this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:commune"][0][0] : "chargement..."}, ${this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:commune"] ? this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:commune"][0][1] : "chargement..."} habitants</p>
      <p>Département : ${this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:departement"] ? this.data["LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:departement"][0] : "chargement..."}</p>
      <p>Parcs naturels : ${this.data["BDTOPO_V3:parc_ou_reserve"] ? JSON.stringify(this.data["BDTOPO_V3:parc_ou_reserve"]) : "aucun"}</p>
      <p>Foret : ${this.data["BDTOPO_V3:foret_publique"] ? JSON.stringify(this.data["BDTOPO_V3:foret_publique"]) : "..."} ${this.data["BDTOPO_V3:toponymie_lieux_nommes"] ? JSON.stringify(this.data["BDTOPO_V3:toponymie_lieux_nommes"]) : "..."}</p>
      <p>Essence principale : ${this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"] ? JSON.stringify(this.data["LANDCOVER.FORESTINVENTORY.V2:formation_vegetale"]) : "..."}</p>
      <p>Cultures : ${this.data["RPG.LATEST:parcelles_graphiques"] ? JSON.stringify(this.data["RPG.LATEST:parcelles_graphiques"]) : "..."}</p>
      <p>ZAI loisirs : ${this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"] ? JSON.stringify(this.data["BDTOPO_V3:zone_d_activite_ou_d_interet"]) : "..."}</p>
      <p>Cours d'eau : ${this.data["BDTOPO_V3:cours_d_eau"] ? JSON.stringify(this.data["BDTOPO_V3:cours_d_eau"]) : "..."}</p>
      <p>Plans d'eau : ${this.data["BDTOPO_V3:plan_d_eau"] ? JSON.stringify(this.data["BDTOPO_V3:plan_d_eau"]) : "..."}</p>
    `;
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

    this.data[config.layer] = result;

    this.dispatchEvent(
      new CustomEvent("dataLoaded", {
        bubbles: true,
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
        // Cas particulier du RPG : décodage de la culture en libellé
        if (layer === "RPG.LATEST:parcelles_graphiques" && attribute === "code_cultu" && Object.keys(this.codes_culture).length) {
          feature.properties[attribute] = this.codes_culture[feature.properties[attribute]];
        }
        feature_attributes.push(feature.properties[attribute]);
      });
      if (attributes.length === 1) {
        results_attributes.push(feature_attributes[0]);
      } else {
        results_attributes.push(feature_attributes);
      }
    });
    return Array.from( new Set(results_attributes) );
  }
}

export default ImmersivePosion;
