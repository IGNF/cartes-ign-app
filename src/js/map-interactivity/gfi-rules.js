/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import InseeCommWiki from "../data-layer/com_wiki.json";

const gfiRules = {
  "TRANSPORTS.DRONES.RESTRICTIONS$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@limite",
      "subtitle": "Restrictions UAS catégorie Ouverte et Aéromodélisme - Source : SIA",
      "bodyBefore": [
        ["* Sauf conditions particulières publiées à l'arrêté « espaces » du 3 décembre 2020"],
      ],
    }
  },
  "VILLAGESETAPE$GEOPORTAIL:OGC:WMS": {
    0: {
      "title": "@toponyme",
      "subtitle": "Village étapes - Source : Fédération française des villages étapes",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=https://www.village-etape.fr/les-villages-etapes/ target=\"_blank\">Accéder au site web</a></p>"]
      ],
    }
  },
  "POI.MUSEUM$GEOPORTAIL:OGC:WMS": {
    0: {
      "title": "@toponyme",
      "subtitle": "Musées - Source : IGN",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=http://www.culture.gouv.fr/public/mistral/museo_fr?ACTION=CHERCHER&FIELD_98=REF&VALUE_98={{identifiant_gestionnaire}} target=\"_blank\">Accéder à la fiche Muséofile</a></p>"]
      ],
    }
  },
  "CJP-PARCS-JARDINS_BDD-POI_WLD_WM$GEOPORTAIL:OGC:WMS": {
    0: {
      "title": "@name",
      "subtitle": "Parcs et Jardins - Source : Conservatoire des jardins et paysages",
      "bodyBefore": [
        ["{{cjp}}"]
      ],
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"{{url}}\"",  "alt=\"{{url}}\" target=\"_blank.POI\">", "Accéder à la fiche</a></p>"],
      ],
    }
  },
  "POI.MONUMENTS_BDD_WLD_WM$GEOPORTAIL:OGC:WMS": {
    0: {
      "title": "@name",
      "subtitle": "Monuments nationaux - Source : Centre des monuments nationaux",
      "bodyAfter": [
        ["<img src=\"https://data.geopf.fr/annexes/ressources/poicmn/{{image}}\">"],
        ["<p class=\"monumentsHistoriquesImageAuthor\">{{image_author}}</p>"],
        ["<p class=\"monumentsHistoriquesContent\">{{content}}</p>"]
      ],
    }
  },
  "PROTECTEDAREAS.ZPS$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@sitename",
      "subtitle": "Sites NATURA 2000 au titre de la Directive Oiseaux - Source : Inventaire National du Patrimoine Naturel (INPN), Ministère de la Transition écologique, Muséum national d’Histoire naturelle (MNHN)",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"{{url}}\">Accéder à la fiche</a></p>"]
      ],
    }
  },
  "PROTECTEDAREAS.PN$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@nom",
      "subtitle": "Parcs nationaux - Source : Inventaire National du Patrimoine Naturel (INPN), Parcs Nationaux de France, Muséum national d’Histoire naturelle (MNHN)",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"{{url}}\">Accéder à la fiche</a></p>"]
      ],
    }
  },
  "PROTECTEDAREAS.PNR$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@nom",
      "subtitle": "Parcs naturels régionaux - Source : Inventaire National du Patrimoine Naturel (INPN), Fédération des Parcs naturels régionaux de France, Muséum national d’Histoire naturelle (MNHN)",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"{{url}}\">Accéder à la fiche</a></p>"]
      ],
    }
  },
  "PROTECTEDAREAS.RN$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@nom",
      "subtitle": "Réserves naturelles nationales - Source : Inventaire National du Patrimoine Naturel (INPN), Réserves naturelles de France (RNF), Muséum national d’Histoire naturelle (MNHN)",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"{{url}}\">Accéder à la fiche</a></p>"]
      ],
    }
  },
  "PROTECTEDSITES.MNHN.RESERVES-REGIONALES$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@nom",
      "subtitle": "Réserves naturelles régionales - Source : Inventaire National du Patrimoine Naturel (INPN), Muséum national d’Histoire naturelle (MNHN)",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"{{url}}\">Accéder à la fiche</a></p>"]
      ],
    }
  },
  "PROTECTEDAREAS.RNC$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@nom",
      "subtitle": "Réserves Naturelles de Corse - Source : Inventaire National du Patrimoine Naturel (INPN), Muséum national d’Histoire naturelle (MNHN)",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"{{url}}\">Accéder à la fiche</a></p>"]
      ],
    }
  },
  "PROTECTEDAREAS.SIC$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@sitename",
      "subtitle": "Sites Natura 2000 au titre de la Directive Habitats - Source : Inventaire National du Patrimoine Naturel (INPN), Ministère de la Transition écologique, Muséum national d’Histoire naturelle (MNHN)",
      "bodyBefore": [
      ],
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"{{url}}\">Accéder à la fiche</a></p>"]
      ],
    }
  },
  "FORETS.PUBLIQUES$GEOPORTAIL:OGC:WMTS": {
    13: {
      "title": "@llib_frt",
      "subtitle": "Forêts publiques - Source : Office National des Forêts",
    },
    0: {
      "title": "@llib2_frt",
      "subtitle": "Forêts publiques - Source : Office National des Forêts",
    }
  },
  "LANDCOVER.FORESTINVENTORY.V2$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@tfv",
      "subtitle": "Carte forestière - Source : IGN",
      "bodyBefore": [
        ["Type générique :", "{{tfv_g11}}"],
        ["Essence :", "{{essence}}"],
      ],
    }
  },
  "CADASTRALPARCELS.PARCELLAIRE_EXPRESS$GEOPORTAIL:OGC:WMTS":{
    0: {
      "title": "Parcelles Cadastrales",
      "subtitle": "PCI vecteur - Source : DGFIP",
      "bodyBefore": [
        ["Numéro de parcelle :", "{{numero}}"],
        ["Feuille :", "{{feuille}}"],
        ["Section :", "{{section}}"],
        ["Contenance :", "{{contenance}}"],
      ],
    }
  },
  "LANDUSE.AGRICULTURE2023$GEOPORTAIL:OGC:WMTS": {
    0 :{
      "pretitle": "Culture : ",
      "title": "@nom_cultu",
      "subtitle": "Registre parcellaire graphique 2023 - Source : Agence de services et de paiements (ASP)",
    }
  },

  "LIMITES_ADMINISTRATIVES_EXPRESS.LATEST$GEOPORTAIL:OGC:WMTS": {
    12: {
      "title": "@nom",
      "subtitle": "Limites administratives mises à jour en continu - Source : IGN",
      "bodyBefore": [
        ["Commune :", "{{nom}}"],
        ["Code INSEE :", "{{insee_com}}"],
        ["Statut :", "{{statut}}"],
        ["Département :", "{{insee_dep}}"],
        ["Population : {{population}} habitants"],
      ],
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a target=\"_blank\" href=\"https://www.insee.fr/fr/statistiques/2011101?geo=COM-{{insee_com}}\">Accéder à la fiche INSEE</a></p>", "<p class=\"positionWeb positionInfo\"><a target=\"_blank\" href=\"{{fiche_wikipedia}}\">Accéder à la fiche Wikipédia</a></p>"]
      ],
    },
    10: {
      "title": "@nom",
      "subtitle": "Limites administratives mises à jour en continu - Source : IGN",
      "bodyBefore": [
        ["Nature :", "{{nature}}"],
      ],
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a target=\"_blank\" href=\"https://www.insee.fr/fr/statistiques/2011101?geo=EPCI-{{code_siren}}\">Accéder à la fiche INSEE</a></p>"]
      ],
    },
    9: {
      "title": "@nom",
      "subtitle": "Limites administratives mises à jour en continu - Source : IGN",
      "bodyBefore": [
        ["Arrondissement Départemental :", "{{nom}}"],
      ],
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a target=\"_blank\" href=\"https://www.insee.fr/fr/statistiques/2011101?geo=ARR-{{insee_dep}}{{insee_arr}}\">Accéder à la fiche INSEE</a></p>"]
      ],
    },
    7: {
      "title": "@nom",
      "subtitle": "Limites administratives mises à jour en continu - Source : IGN",
      "bodyBefore": [
        ["Code INSEE :", "{{insee_dep}}"],
      ],
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a target=\"_blank\" href=\"https://www.insee.fr/fr/statistiques/2011101?geo=DEP-{{insee_dep}}\">Accéder à la fiche INSEE</a></p>"]
      ],
    },
    0: {
      "title": "@nom",
      "subtitle": "Limites administratives mises à jour en continu - Source : IGN",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a target=\"_blank\" href=\"https://www.insee.fr/fr/statistiques/2011101?geo=REG-{{insee_reg}}\">Accéder à la fiche INSEE</a></p>"]
      ],
    },
  },

  /**
     * Parse le GFI
     * @param {*} rule règle de parsing de GFI issue de ce fichier
     * @param {*} gfi gfi en mode json
     * @returns {Object} {title: ..., html: ...} pour l'affichage
     */
  parseGFI: (rule, gfi, zoom) => {
    const result = {
      geometry: gfi.features[0].geometry,
    };
    const featureProperties = gfi.features[0].properties;
    let z = 0;
    z = Object.keys(rule).map(x => parseInt(x)).sort().reduce((prev, curr) => {
      return  (curr <= parseInt(zoom) && prev <= curr ? curr : prev);
    }
    );
    let template = rule[z];
    if (template["title"][0] === "@") {
      let str = featureProperties[template.title.split("@")[1]].replace("", "'");
      result.title = str[0].toUpperCase() + str.slice(1);
    } else {
      result.title = template.title;
    }
    if (template["pretitle"]) {
      result.title = template["pretitle"] + result.title;
    }
    if (template["subtitle"]) {
      result.title += `<p class="positionSubTitle">${template["subtitle"]}</p>`;
    }
    let bodyBefore = "";
    if (template.bodyBefore) {
      bodyBefore += "<div class='positionHtmlBefore'>";
      template.bodyBefore.forEach( (bodyElement) => {
        let notFound = false;
        let p = bodyElement.map((str) => {
          let match = str.match("{{([^}]+)}}");
          while (match) {
            if (Object.prototype.hasOwnProperty.call(featureProperties, match[1])) {
              str = str.replace(match[0], featureProperties[match[1]]);
              match = str.match("{{([^}]+)}}");
            } else {
              notFound = true;
              return "";
            }
          }
          return str;
        });
        if (p && !notFound)
          bodyBefore += `${p.join(" ")}<br/>`;
      });
      bodyBefore += "</div>";
    }
    let bodyAfter = "";
    if (template.bodyAfter) {
      bodyAfter += "<div class='positionHtmlAfter'>";
      template.bodyAfter.forEach( (bodyElement) => {
        let notFound = false;
        let p = bodyElement.map((str) => {
          let match = str.match("{{([^}]+)}}");
          while (match) {
            if (Object.prototype.hasOwnProperty.call(featureProperties, match[1])) {
              if (match[1] === "identifiant_gestionnaire") {
                if (!featureProperties[match[1]]) {
                  return "";
                }
                featureProperties[match[1]] = featureProperties[match[1]].charAt(0).toUpperCase() + featureProperties[match[1]].slice(1);
              }
              str = str.replace(match[0], featureProperties[match[1]]);
              match = str.match("{{([^}]+)}}");
            } else {
              if (match[1] === "fiche_wikipedia") {
                if (!featureProperties["insee_com"]) {
                  return "";
                }
                featureProperties[match[1]] = InseeCommWiki[featureProperties["insee_com"]];
                if (!featureProperties[match[1]]) {
                  return "";
                }
                str = str.replace(match[0], featureProperties[match[1]]);
                match = str.match("{{([^}]+)}}");
              } else {
                notFound = true;
                return "";
              }
            }
          }
          return str;
        });
        if (p && !notFound)
          bodyAfter += `${p.join(" ")}`;
      });
      bodyAfter += "</div>";
    }

    result.html = bodyBefore;
    result.html2 = bodyAfter;
    return result;
  }
};

export default gfiRules;
