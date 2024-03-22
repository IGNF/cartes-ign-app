const gfiRules = {
  "TRANSPORTS.DRONES.RESTRICTIONS$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@limite",
      "subtitle": "Restrictions UAS catégorie Ouverte et Aéromodélisme - Producteur : DGAC",
      "bodyBefore": [
        ["* Sauf conditions particulières publiées à l'arrêté « espaces » du 3 décembre 2020"],
      ],
      "bodyAfter": [],
    }
  },
  "VILLAGESETAPE$GEOPORTAIL:OGC:WMS": {
    0: {
      "title": "@toponyme",
      "subtitle": "Village étapes - Producteur : ???",
      "bodyBefore": [
        ["Commune labellisée Village étape"],
        ["<a href=https://www.village-etape.fr/les-villages-etapes/ target=\"_blank\">Plus d’informations</a>"]
      ],
      "bodyAfter": [],
    }
  },
  "POI.MUSEUM$GEOPORTAIL:OGC:WMS": {
    0: {
      "title": "@toponyme",
      "subtitle": "Musées - Producteur : ???",
      "bodyBefore": [
        ["{{nature}}"],
        ["Adresse :", "{{adresse_postale}}", "{{acheminement}}"]
      ],
      "bodyAfter": [],
    }
  },
  "CJP-PARCS-JARDINS_BDD-POI_WLD_WM$GEOPORTAIL:OGC:WMS": {
    0: {
      "title": "@name",
      "subtitle": "Parcs et Jardins - Producteur : ???",
      "bodyBefore": [
        ["Conservatoire des Parcs et jardins"],
        ["<a href=\"{{url}}\"",  "alt=\"{{url}}\" target=\"_blank.POI\">", "{{linkname}}</a>"],
        ["{{infos}}"]
      ],
      "bodyAfter": [],
    }
  },
  "POI.MONUMENTS_BDD_WLD_WM$GEOPORTAIL:OGC:WMS": {
    0: {
      "title": "@name",
      "subtitle": "Monuments nationaux - Producteur : ???",
      "bodyBefore": [],
      "bodyAfter": [
        ["{{sstitle}}"],
        ["<img src=\"https://data.geopf.fr/annexes/ressources/poicmn/{{image}}\">"],
        ["{{image_author}}"],
        ["{{content}}"]
      ],
    }
  },
  "PROTECTEDAREAS.ZPS$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@sitename",
      "subtitle": "Sites NATURA 2000 au titre de la Directive Oiseaux - Producteur : ???",
      "bodyBefore": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ],
      "bodyAfter": [],
    }
  },
  "PROTECTEDAREAS.PN$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@nom",
      "subtitle": "Parcs nationaux - Producteur : ???",
      "bodyBefore": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ],
      "bodyAfter": [],
    }
  },
  "PROTECTEDAREAS.PNR$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@nom",
      "subtitle": "Parcs naturels régionaux - Producteur : ???",
      "bodyBefore": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ],
      "bodyAfter": [],
    }
  },
  "PROTECTEDAREAS.RN$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@nom",
      "subtitle": "Réserves naturelles nationales - Producteur : ???",
      "bodyBefore": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ],
      "bodyAfter": [],
    }
  },
  "PROTECTEDSITES.MNHN.RESERVES-REGIONALES$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@nom",
      "subtitle": "Réserves naturelles régionales - Producteur : ???",
      "bodyBefore": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ],
      "bodyAfter": [],
    }
  },
  "PROTECTEDAREAS.RNC$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@nom",
      "subtitle": "Réserves Naturelles de Corse - Producteur : ???",
      "bodyBefore": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ],
      "bodyAfter": [],
    }
  },
  "PROTECTEDAREAS.SIC$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@sitename",
      "subtitle": "Sites Natura 2000 au titre de la Directive Habitats - Producteur : ???",
      "bodyBefore": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ],
      "bodyAfter": [],
    }
  },
  "FORETS.PUBLIQUES$GEOPORTAIL:OGC:WMTS": {
    13: {
      "title": "@llib_frt",
      "subtitle": "Forêts publiques - Producteur : ???",
      "bodyBefore": [],
      "bodyAfter": [],
    },
    0: {
      "title": "@llib2_frt",
      "subtitle": "Forêts publiques - Producteur : ???",
      "bodyBefore": [],
      "bodyAfter": [],
    }
  },
  "CADASTRALPARCELS.PARCELLAIRE_EXPRESS$GEOPORTAIL:OGC:WMTS":{
    0: {
      "title": "Parcelles Cadastrales",
      "subtitle": "PCI vecteur - Producteur : DGFIP",
      "bodyBefore": [
        ["Numéro de parcelle :", "{{numero}}"],
        ["Feuille :", "{{feuille}}"],
        ["Section :", "{{section}}"],
        ["Commune : {{nom_com}}"],
        ["Département :", "{{code_dep}}"]
      ],
      "bodyAfter": [],
    }
  },
  "LANDUSE.AGRICULTURE2021$GEOPORTAIL:OGC:WMTS": {
    0 :{
      "title": "@nom_cultu",
      "subtitle": "Registre parcellaire graphique 2021 - Producteur : DGFIP",
      "bodyBefore": [
        ["Registre Parcellaire Agricole 2021"]
      ],
      "bodyAfter": [],
    }
  },

  "LIMITES_ADMINISTRATIVES_EXPRESS.LATEST$GEOPORTAIL:OGC:WMTS": {
    12: {
      "title": "@nom",
      "subtitle": "Limites administratives mises à jour en continu - Producteur : DGFIP",
      "bodyBefore": [
        ["Commune :", "{{nom}}"],
        ["Statut :", "{{statut}}"],
        ["Code INSEE :", "{{insee_com}}"],
        ["Population : {{population}} habitants"],
        ["Département :", "{{insee_dep}}"],
      ],
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"http://www.insee.fr/fr/themes/comparateur.asp?codgeo=COM-{{insee_com}}\">Accéder aux infos INSEE</a></p>"]
      ],
    },
    10: {
      "title": "@nom",
      "subtitle": "Limites administratives mises à jour en continu - Producteur : DGFIP",
      "bodyBefore": [
        ["{{nom}}"],
        ["Nature :", "{{nature}}"],
      ],
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"http://www.insee.fr/fr/themes/comparateur.asp?codgeo=COM-{{insee_com}}\">Accéder aux infos INSEE</a></p>"]
      ],
    },
    9: {
      "title": "@nom",
      "subtitle": "Limites administratives mises à jour en continu - Producteur : DGFIP",
      "bodyBefore": [
        ["Arrondissement Départemental :", "{{nom}}"],
        ["Code INSEE Département :", "{{insee_dep}}"],
        ["Code INSEE Arrondissement :", "{{insee_arr}}"],
        ["Région :", "{{insee_reg}}"],
      ],
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"http://www.insee.fr/fr/themes/comparateur.asp?codgeo=COM-{{insee_com}}\">Accéder aux infos INSEE</a></p>"]
      ],
    },
    7: {
      "title": "@nom",
      "subtitle": "Limites administratives mises à jour en continu - Producteur : DGFIP",
      "bodyBefore": [
        ["Département :", "{{nom}}"],
        ["Code INSEE :", "{{insee_dep}}"],
        ["Région :", "{{insee_reg}}"],
      ],
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"http://www.insee.fr/fr/themes/comparateur.asp?codgeo=COM-{{insee_com}}\">Accéder aux infos INSEE</a></p>"]
      ],
    },
    0: {
      "title": "@nom",
      "subtitle": "Limites administratives mises à jour en continu - Producteur : DGFIP",
      "bodyBefore": [
        ["Région :", "{{nom}}"],
        ["Code INSEE :", "{{insee_reg}}"],
      ],
      "bodyAfter": [
        ["<p class=\"positionWeb positionInfo\"><a href=\"http://www.insee.fr/fr/themes/comparateur.asp?codgeo=COM-{{insee_com}}\">Accéder aux infos INSEE</a></p>"]
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
      let str = featureProperties[template.title.split("@")[1]];
      result.title = str[0].toUpperCase() + str.slice(1);
    } else {
      result.title = template.title;
    }
    if (template["subtitle"]) {
      result.title += `<p class="positionSubTitle">${template["subtitle"]}</p>`;
    }
    let bodyBefore = "<div class='positionHtmlBefore'>";
    template.bodyBefore.forEach( (bodyElement) => {
      let p = bodyElement.map((str) => {
        let match = str.match("{{(.+)}}");
        if(match && Object.prototype.hasOwnProperty.call(featureProperties, match[1]))
          return str.replace(match[0], featureProperties[match[1]]);
        else return str;
      });
      if (p)
        bodyBefore += `<p>${p.join(" ")}</p>`;
    });
    bodyBefore += "</div>";

    let bodyAfter = "<div class='positionHtmlAfter'>";
    template.bodyAfter.forEach( (bodyElement) => {
      let p = bodyElement.map((str) => {
        let match = str.match("{{(.+)}}");
        if(match && Object.prototype.hasOwnProperty.call(featureProperties, match[1]))
          return str.replace(match[0], featureProperties[match[1]]);
        else return str;
      });
      if (p)
        bodyAfter += `<p>${p.join(" ")}</p>`;
    });
    bodyAfter += "</div>";

    result.html = bodyBefore;
    result.html2 = bodyAfter;
    return result;
  }
};

export default gfiRules;
