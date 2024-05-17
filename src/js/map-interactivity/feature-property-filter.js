/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import parseOsmOpeningHours from "./parse-osm-opening-hours";
import wayNameDictionnary from "./way-name-dictionnary";

/**
 *
 * @param {feature} feature maplibre issue de tuile vecteur
 * @returns chaine de caractère HTML qui décrit la feature
 */

const isIndifferencie = (prop) => {
  if (prop == "Indifférenciée" || prop == "Indifférencié") return true;
  else return false;
};

const getProperty = (feature, prop) => {
  return Object.prototype.hasOwnProperty.call(feature.properties, prop) ? feature.properties[prop] : "";
};

const featurePropertyFilter = (feature) => {

  let result = {
    before: "<div class='positionHtmlBefore'>",
    after: "<div class='positionHtmlAfter'>",
  };
  if (feature.source === "poi_osm") {
    let web =  getProperty(feature, "web");
    let telephone = getProperty(feature, "telephone");
    let horaire = getProperty(feature, "horaire");
    if (horaire) {
      try {
        result.after += `<p class="positionHours positionInfo">Horaire : ${parseOsmOpeningHours(horaire)}</p>`;
      } catch {
        console.warn("Could not parse horaire: " + horaire);
        result.after += `<p class="positionHours positionInfo">Horaire : ${horaire}</p>`;
      }
    }
    if (web) {
      result.after += `<p class="positionWeb positionInfo"><a href="${web}" target="_blank">Accéder au site web</a></p>`;
    }
    if (telephone) {
      telephone = telephone.replace(/\s/g, "");
      const telArray = telephone.split("");
      if (telArray[0] === "0") {
        let offset = 0;
        for (let i = 2; i < 10; i += 2) {
          telArray.splice(i + offset, 0, " ");
          offset++;
        }
      } else {
        telArray.splice(3, 0, " ");
        let offset = 0;
        for (let i = 5; i < 13; i += 2) {
          telArray.splice(i + offset, 0, " ");
          offset++;
        }
      }
      result.after += `<p class="positionTelephone positionInfo"><a href="tel:${telephone}">${telArray.join("")}</a></p>`;
    }
    result.after += "</div>";
    result.before = "";
    return result;
  }

  // Pour la plupart des layers bdtopo
  let toponyme = getProperty(feature, "toponyme");
  let nature = getProperty(feature, "nature");
  let nature_detaillee = getProperty(feature, "nature_detaillee");
  let hauteur = getProperty(feature, "hauteur");

  // pas de légende bdtopo
  const noBdtopoAttr = ["surface_hydrographique", "construction_lineaire", "detail_hydrographique", "zone_d_estran", "ligne_orographique"];
  if (noBdtopoAttr.includes(feature.layer["source-layer"])) {
    result.after += "</div>";
    result.before = "";
    return result;
  }
  if (feature.layer["source-layer"] == "surface_hydrographique" && ["Marais salant", "Marais"].includes(nature)) {
    result.after += "</div>";
    result.before = "";
    return result;
  }

  //  Propriétés spécifiques reservoir
  if(feature.layer["source-layer"] == "reservoir") {
    let volume = getProperty(feature, "volume");
    if (hauteur) {
      result.before += `Hauteur : ${hauteur.toLocaleString("fr-FR")} mètres  <br/>`;
    }
    if (volume) {
      result.before = `Volume : ${volume.toLocaleString("fr-FR")} m3 <br/>`;
    }
    result.before += "</div>";
    result.after = "";
    return result;
  }

  // Propriétés spécifiques troncon_de_route
  if(feature.layer["source-layer"] == "troncon_de_route") {
    console.log(feature);
    let cpx_numero = getProperty(feature, "cpx_numero");
    let cpx_toponyme_route_nommee = getProperty(feature, "cpx_toponyme_route_nommee");
    let nom_1_droite = getProperty(feature, "nom_1_droite");
    let nom_1_gauche = getProperty(feature, "nom_1_gauche");
    let cpx_toponyme_voie_verte = getProperty(feature, "cpx_toponyme_voie_verte");
    let cpx_toponyme_itineraire_cyclable = getProperty(feature, "cpx_toponyme_itineraire_cyclable");
    let nombre_de_voies = getProperty(feature, "nombre_de_voies");
    let voie_prive = getProperty(feature, "voie_prive");
    let acces_pieton = getProperty(feature, "acces_pieton");

    if (cpx_numero) {
      result.before += `Numéro : ${cpx_numero}<br/>`;
    }
    if (cpx_toponyme_route_nommee) {
      result.before += `Nom : ${cpx_toponyme_route_nommee}<br/>`;
    } else if (nom_1_droite) {
      const firstWord = nom_1_droite.split(" ")[0];
      if (firstWord in wayNameDictionnary) {
        const nom_1_droite_array = nom_1_droite.split(" ");
        nom_1_droite_array.splice(0, 1, wayNameDictionnary[firstWord]);
        nom_1_droite = nom_1_droite_array.join(" ");
      }
      result.before += `Nom : ${nom_1_droite}<br/>`;
    } else if (nom_1_gauche) {
      const firstWord = nom_1_gauche.split(" ")[0];
      if (firstWord in wayNameDictionnary) {
        const nom_1_gauche_array = nom_1_gauche.split(" ");
        nom_1_gauche_array.splice(0, 1, wayNameDictionnary[firstWord]);
        nom_1_gauche = nom_1_gauche_array.join(" ");
      }
      result.before += `Nom : ${nom_1_gauche}<br/>`;
    }
    if (cpx_toponyme_voie_verte)
      result.before += `${cpx_toponyme_voie_verte}<br/>`;
    if (cpx_toponyme_itineraire_cyclable)
      result.before += `${cpx_toponyme_itineraire_cyclable}<br/>`;
    if (nombre_de_voies) {
      result.before += `Nombre de voies : ${nombre_de_voies}<br/>`;
    }
    if (acces_pieton) {
      result.before += `Mode d'accès piéton : ${acces_pieton}<br/>`;
    }
    if (voie_prive) {
      result.before += "Voie privée<br/>";
    }
    result.before += "</div>";
    result.after = "";
    return result;
  }

  //  Propriétés spécifiques batiment
  if(feature.layer["source-layer"] == "batiment") {

    // Batiment religieux
    let usage = getProperty(feature, "usage_1");
    if (usage == "Religieux" && !isIndifferencie(nature)) {
      result.before += `${nature}<br/>`;
    }
    // Autres batiments
    else {
      let nombre_de_logements = getProperty(feature, "nombre_de_logements");
      let nombre_d_etages = getProperty(feature, "nombre_d_etages");
      let date_d_apparition = getProperty(feature, "date_d_apparition");

      if(nombre_de_logements && (nature == "Bâtiment résidentiel ou quelconque" || nature == "Indifférenciée")) {
        result.before += `Nombre de logements : ${nombre_de_logements}<br/>`;
      }
      if(nombre_d_etages) {
        if (nombre_d_etages == "0")
          result.before += "Bâtiment de plain-pied<br/>";
        else
          result.before += `Nombre d'étages : ${nombre_d_etages}<br/>`;
      }
      if(hauteur) {
        result.before += `Hauteur : ${hauteur.toLocaleString("fr-FR")} mètres<br/>`;
      }
      if(date_d_apparition) {
        let match = date_d_apparition.match("([0-9]+)/");
        let year = match[1] ? match[1] : "";
        result.before += `Année de construction : ${year}<br/>`;
      }
    }

    result.before += "</div>";
    result.after = "";
    return result;
  }

  //  Propriétés spécifiques ligne de chemin de fer
  if(feature.layer["source-layer"] == "troncon_de_voie_ferree") {
    // Batiment
    let cpx_toponyme = getProperty(feature, "cpx_toponyme");
    let usage = getProperty(feature, "usage");
    let nombre_de_voies = getProperty(feature, "nombre_de_voies");

    if(cpx_toponyme) {
      result.before += `Nom : ${cpx_toponyme}<br/>`;
    }
    if(usage) {
      result.before += `Usage : ${usage}<br/>`;
    }
    if(nombre_de_voies) {
      result.before += `Nombre de voies : ${nombre_de_voies}<br/>`;
    }
    result.before += "</div>";
    result.after = "";
    return result;
  }
  // Régles spécifiques cimetière
  if (feature.layer["source-layer"] == "cimetiere") {
    if (nature) {
      result.before += `Cimetière ${nature.toLowerCase()}<br/>`;
    }
    result.before += "</div>";
    result.after = "";
    return result;
  }

  // Régles spécifiques réservoir
  if (feature.layer["source-layer"] == "reservoir") {
    let volume = getProperty(feature, "volume");
    if (nature) {
      result.before += `${nature}<br/>`;
    }
    if (hauteur) {
      result.before += `Hauteur : ${feature.properties.hauteur.toLocaleString("fr-FR")} mètres  <br/>`;
    }
    if (volume) {
      result.before += `Volume : ${feature.properties.volume.toLocaleString("fr-FR")} mètres  <br/>`;
    }
    result.before += "</div>";
    result.after = "";
    return result;
  }

  // Régles spécifiques construction ponctuelle
  if (feature.layer["source-layer"] == "construction_ponctuelle") {
    let date_d_apparition = getProperty(feature, "date_d_apparition");
    if (nature_detaillee) {
      result.before += `Type : ${nature_detaillee}<br/>`;
    }
    if (hauteur) {
      result.before += `Hauteur : ${feature.properties.hauteur.toLocaleString("fr-FR")} mètres  <br/>`;
    }
    if(date_d_apparition) {
      let match = date_d_apparition.match("([0-9]+)/");
      let year = match[1] ? match[1] : "";
      result.before += `Année de construction : ${year}<br/>`;
    }
    result.before += "</div>";
    result.after = "";
    return result;
  }

  // Régles spécifiques zone_de_vegetation
  if (feature.layer["source-layer"] == "zone_de_vegetation") {
    const vegetationNoAttr = ["Lande ligneuse", "Vigne", "Verger", "Forêt ouverte", "Mangrove"];
    if (!vegetationNoAttr.includes(nature)) {
      result.before += nature + "<br/>";
    }
    result.before += "</div>";
    result.after = "";
    return result;
  }


  // pour toutes les couches qui restent
  if (toponyme) {
    result.before += `<b>${toponyme}</b><br/>`;
  }
  if (nature && nature_detaillee) {
    result.before += nature + ", " + nature_detaillee + "<br/>";
  }
  else if (nature && !nature_detaillee) {
    result.before += nature + "<br/>";
  }

  result.before += "</div>";
  result.after = "";
  return result;
};

export default featurePropertyFilter;
