/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import InseeCommWiki from "../data-layer/com_wiki.json";
let inseeCommWiki;
try {
  const resp = await fetch("https://ignf.github.io/cartes-ign-app/com_wiki.json");
  inseeCommWiki = await resp.json();
} catch (e) {
  inseeCommWiki = InseeCommWiki;
}

const gfiRules = {
  "TRANSPORTS.DRONES.RESTRICTIONS$WMTS": {
    0: {
      "title": "@limite",
      "subtitle": "Restrictions UAS catégorie Ouverte et Aéromodélisme - Source : SIA",
      "bodyBefore": [
        ["* Sauf conditions particulières publiées à l'arrêté « espaces » du 3 décembre 2020"],
      ],
    }
  },
  "VILLAGESETAPE$WMS": {
    0: {
      "title": "@toponyme",
      "subtitle": "Village étapes - Source : Fédération française des villages étapes",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=https://www.village-etape.fr/les-villages-etapes/ target=\"_blank\">Accéder au site web</a></p>"]
      ],
    }
  },
  "POI.MUSEUM$WMS": {
    0: {
      "title": "@toponyme",
      "subtitle": "Musées - Source : IGN",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=http://www.culture.gouv.fr/public/mistral/museo_fr?ACTION=CHERCHER&FIELD_98=REF&VALUE_98={{identifiant_gestionnaire}} target=\"_blank\">Accéder à la fiche Muséofile</a></p>"]
      ],
    }
  },
  "CJP-PARCS-JARDINS_BDD-POI_WLD_WM$WMS": {
    0: {
      "title": "@name",
      "subtitle": "Parcs et Jardins - Source : Conservatoire des jardins et paysages",
      "bodyBefore": [
        ["{{cjp}}"]
      ],
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"{{url}}\"",  "alt=\"{{url}}\" target=\"_blank\">", "Accéder à la fiche</a></p>"],
      ],
    }
  },
  "POI.MONUMENTS_BDD_WLD_WM$WMS": {
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
  "IGNF_SITES-UNESCO$WMS": {
    0: {
      "title": "@nom",
      "title2": "@sous_titre",
      "subtitle": "Sites du patrimoine mondial de l'UNESCO - Sources : UNESCO, IGN",
      "bodyAfter": [
        ["<p class=\"unescoDate\"><img class=\"unescoimg\" src=\"https://data.geopf.fr/annexes/ressources/UNESCO/Unesco-Images-Redimentionnees/{{nom_image}}\">"],
        ["Année d'inscription : {{date_inscription}}</p>"],
        ["<p class=\"monumentsHistoriquesContent\">{{description}}</p>"],
        ["<p class=\"positionWeb positionInfo\"><a target=\"_blank\" href=\"{{lien_unesco}}\">Accéder à la fiche UNESCO</a></p>"],
      ],
    }
  },
  "PROTECTEDAREAS.ZPS$WMTS": {
    0: {
      "title": "@sitename",
      "subtitle": "Sites NATURA 2000 au titre de la Directive Oiseaux - Source : Inventaire National du Patrimoine Naturel (INPN), Ministère de la Transition écologique, Muséum national d’Histoire naturelle (MNHN)",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"{{url}}\" target=\"_blank\">Accéder à la fiche</a></p>"]
      ],
    }
  },
  "PROTECTEDAREAS.PN$WMTS": {
    0: {
      "title": "@nom",
      "subtitle": "Parcs nationaux - Source : Inventaire National du Patrimoine Naturel (INPN), Parcs Nationaux de France, Muséum national d’Histoire naturelle (MNHN)",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"{{url}}\" target=\"_blank\">Accéder à la fiche</a></p>"]
      ],
    }
  },
  "PROTECTEDAREAS.PNR$WMTS": {
    0: {
      "title": "@nom",
      "subtitle": "Parcs naturels régionaux - Source : Inventaire National du Patrimoine Naturel (INPN), Fédération des Parcs naturels régionaux de France, Muséum national d’Histoire naturelle (MNHN)",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"{{url}}\" target=\"_blank\">Accéder à la fiche</a></p>"]
      ],
    }
  },
  "PROTECTEDAREAS.RN$WMTS": {
    0: {
      "title": "@nom",
      "subtitle": "Réserves naturelles nationales - Source : Inventaire National du Patrimoine Naturel (INPN), Réserves naturelles de France (RNF), Muséum national d’Histoire naturelle (MNHN)",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"{{url}}\" target=\"_blank\">Accéder à la fiche</a></p>"]
      ],
    }
  },
  "PROTECTEDSITES.MNHN.RESERVES-REGIONALES$WMTS": {
    0: {
      "title": "@nom",
      "subtitle": "Réserves naturelles régionales - Source : Inventaire National du Patrimoine Naturel (INPN), Muséum national d’Histoire naturelle (MNHN)",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"{{url}}\" target=\"_blank\">Accéder à la fiche</a></p>"]
      ],
    }
  },
  "PROTECTEDAREAS.RNC$WMTS": {
    0: {
      "title": "@nom",
      "subtitle": "Réserves Naturelles de Corse - Source : Inventaire National du Patrimoine Naturel (INPN), Muséum national d’Histoire naturelle (MNHN)",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"{{url}}\" target=\"_blank\">Accéder à la fiche</a></p>"]
      ],
    }
  },
  "PROTECTEDAREAS.SIC$WMTS": {
    0: {
      "title": "@sitename",
      "subtitle": "Sites Natura 2000 au titre de la Directive Habitats - Source : Inventaire National du Patrimoine Naturel (INPN), Ministère de la Transition écologique, Muséum national d’Histoire naturelle (MNHN)",
      "bodyBefore": [
      ],
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"{{url}}\" target=\"_blank\">Accéder à la fiche</a></p>"]
      ],
    }
  },
  "FORETS.PUBLIQUES$WMTS": {
    13: {
      "title": "@llib_frt",
      "subtitle": "Forêts publiques - Source : Office National des Forêts",
    },
    0: {
      "title": "@llib2_frt",
      "subtitle": "Forêts publiques - Source : Office National des Forêts",
    }
  },
  "LANDCOVER.FORESTINVENTORY.V2$WMTS": {
    0: {
      "title": "@tfv",
      "subtitle": "Carte forestière - Source : IGN",
      "bodyBefore": [
        ["Type générique :", "{{tfv_g11}}"],
        ["Essence :", "{{essence}}"],
      ],
    }
  },
  "CADASTRALPARCELS.PARCELLAIRE_EXPRESS$WMTS":{
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
  "LANDUSE.AGRICULTURE2023$WMTS": {
    0 :{
      "pretitle": "Culture : ",
      "title": "@nom_cultu",
      "subtitle": "Registre parcellaire graphique 2023 - Source : Agence de services et de paiements (ASP)",
    }
  },

  "LIMITES_ADMINISTRATIVES_EXPRESS.LATEST$WMTS": {
    12: {
      "title": "@nom_officiel",
      "subtitle": "Limites administratives mises à jour en continu - Source : IGN",
      "bodyBefore": [
        ["Commune :", "{{nom_officiel}}"],
        ["Code INSEE :", "{{code_insee}}"],
        ["Statut :", "{{statut}}"],
        ["Département :", "{{code_insee_du_departement}}"],
        ["Population : {{population}} habitants"],
      ],
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a target=\"_blank\" href=\"https://www.insee.fr/fr/statistiques/2011101?geo=COM-{{code_insee}}\">Accéder à la fiche INSEE</a></p>", "<p class=\"positionWeb positionInfo\"><a target=\"_blank\" href=\"{{fiche_wikipedia}}\">Accéder à la fiche Wikipédia</a></p>"]
      ],
    },
    11: {
      "title": "@nom_officiel",
      "subtitle": "Limites administratives mises à jour en continu - Source : IGN",
      "bodyBefore": [
        ["Nature : Canton"],
      ],
    },
    10: {
      "title": "@nom_officiel",
      "subtitle": "Limites administratives mises à jour en continu - Source : IGN",
      "bodyBefore": [
        ["Nature :", "{{nature}}"],
      ],
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a target=\"_blank\" href=\"https://www.insee.fr/fr/statistiques/2011101?geo=EPCI-{{code_siren}}\">Accéder à la fiche INSEE</a></p>"]
      ],
    },
    9: {
      "title": "@nom_officiel",
      "subtitle": "Limites administratives mises à jour en continu - Source : IGN",
      "bodyBefore": [
        ["Arrondissement Départemental :", "{{nom_officiel}}"],
      ],
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a target=\"_blank\" href=\"https://www.insee.fr/fr/statistiques/2011101?geo=ARR-{{code_insee_du_departement}}{{code_insee}}\">Accéder à la fiche INSEE</a></p>"]
      ],
    },
    7: {
      "title": "@nom_officiel",
      "subtitle": "Limites administratives mises à jour en continu - Source : IGN",
      "bodyBefore": [
        ["Code INSEE :", "{{code_insee}}"],
      ],
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a target=\"_blank\" href=\"https://www.insee.fr/fr/statistiques/2011101?geo=DEP-{{code_insee}}\">Accéder à la fiche INSEE</a></p>"]
      ],
    },
    0: {
      "title": "@nom_officiel",
      "subtitle": "Limites administratives mises à jour en continu - Source : IGN",
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a target=\"_blank\" href=\"https://www.insee.fr/fr/statistiques/2011101?geo=REG-{{code_insee}}\">Accéder à la fiche INSEE</a></p>"]
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
      if (str.length) {
        result.title = str[0].toUpperCase() + str.slice(1);
      } else {
        result.title = "";
      }
    } else {
      result.title = template.title;
    }
    if (template["pretitle"]) {
      result.title = template["pretitle"] + result.title;
    }
    if (template["title2"]) {
      let str;
      if (template["title2"][0] === "@") {
        str = featureProperties[template.title2.split("@")[1]].replace("", "'");
        if (str) {
          str = str[0].toUpperCase() + str.slice(1);
        }
      } else {
        str = template["title2"];
      }
      if (str) {
        result.title += `<p class="positionTitle2">${str}</p>`;
      }
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
                featureProperties[match[1]] = inseeCommWiki[featureProperties["insee_com"]];
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
