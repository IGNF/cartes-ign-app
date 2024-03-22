const gfiRules = {
  "TRANSPORTS.DRONES.RESTRICTIONS$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@limite",
      "bodyBefore": [
        ["Limite :", "{{limite}}"],
        ["Source des données : DGAC"]
      ],
      "bodyAfter": [],
    }
  },
  "VILLAGESETAPE$GEOPORTAIL:OGC:WMS": {
    0: {
      "title": "@toponyme",
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
      "bodyBefore": [
        ["{{sstitle}}"],
        ["<img src=\"https://data.geopf.fr/annexes/ressources/poicmn/{{image}}\">"],
        ["{{image_author}}"],
        ["{{content}}"]
      ],
      "bodyAfter": [],
    }
  },
  "PROTECTEDAREAS.ZPS$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@sitename",
      "bodyBefore": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ],
      "bodyAfter": [],
    }
  },
  "PROTECTEDAREAS.PN$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@nom",
      "bodyBefore": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ],
      "bodyAfter": [],
    }
  },
  "PROTECTEDAREAS.PNR$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@nom",
      "bodyBefore": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ],
      "bodyAfter": [],
    }
  },
  "PROTECTEDAREAS.RN$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@nom",
      "bodyBefore": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ],
      "bodyAfter": [],
    }
  },
  "PROTECTEDSITES.MNHN.RESERVES-REGIONALES$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@nom",
      "bodyBefore": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ],
      "bodyAfter": [],
    }
  },
  "PROTECTEDAREAS.RNC$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@nom",
      "bodyBefore": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ],
      "bodyAfter": [],
    }
  },
  "PROTECTEDAREAS.SIC$GEOPORTAIL:OGC:WMTS": {
    0: {
      "title": "@sitename",
      "bodyBefore": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ],
      "bodyAfter": [],
    }
  },
  "FORETS.PUBLIQUES$GEOPORTAIL:OGC:WMTS": {
    13: {
      "title": "@llib_frt",
      "bodyBefore": [],
      "bodyAfter": [],
    },
    0: {
      "title": "@llib2_frt",
      "bodyBefore": [],
      "bodyAfter": [],
    }
  },
  "CADASTRALPARCELS.PARCELLAIRE_EXPRESS$GEOPORTAIL:OGC:WMTS":{
    0: {
      "title": "Parcelles Cadastrales",
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
      "bodyBefore": [
        ["Registre Parcellaire Agricole 2021"]
      ],
      "bodyAfter": [],
    }
  },

  "LIMITES_ADMINISTRATIVES_EXPRESS.LATEST$GEOPORTAIL:OGC:WMTS": {
    12: {
      "title": "@nom",
      "bodyBefore": [
        ["Commune :", "{{nom}}"],
        ["Statut :", "{{statut}}"],
        ["Code INSEE :", "{{insee_com}}"],
        ["Population : {{population}} habitants"],
        ["Département :", "{{insee_dep}}"],
        ["<a href=\"http://www.insee.fr/fr/themes/comparateur.asp?codgeo=COM-{{insee_com}}\">Accéder aux infos INSEE</a>"]
      ],
      "bodyAfter": [],
    },
    10: {
      "title": "@nom",
      "bodyBefore": [
        ["{{nom}}"],
        ["Nature :", "{{nature}}"],
        ["<a href=\"http://www.insee.fr/fr/themes/comparateur.asp?codgeo=EPCI-{{code_siren}}\">Accéder aux infos INSEE</a>"]
      ],
      "bodyAfter": [],
    },
    9: {
      "title": "@nom",
      "bodyBefore": [
        ["Arrondissement Départemental :", "{{nom}}"],
        ["Code INSEE Département :", "{{insee_dep}}"],
        ["Code INSEE Arrondissement :", "{{insee_arr}}"],
        ["Région :", "{{insee_reg}}"],
        ["<a href=\"http://www.insee.fr/fr/themes/comparateur.asp?codgeo=DEP-{{insee_dep}}\">Accéder aux infos INSEE</a>"]
      ],
      "bodyAfter": [],
    },
    7: {
      "title": "@nom",
      "bodyBefore": [
        ["Département :", "{{nom}}"],
        ["Code INSEE :", "{{insee_dep}}"],
        ["Région :", "{{insee_reg}}"],
        ["<a href=\"http://www.insee.fr/fr/themes/comparateur.asp?codgeo=DEP-{{insee_dep}}\">Accéder aux infos INSEE</a>"]
      ],
      "bodyAfter": [],
    },
    0: {
      "title": "@nom",
      "bodyBefore": [
        ["Région :", "{{nom}}"],
        ["Code INSEE :", "{{insee_reg}}"],
        ["<a href=\"http://www.insee.fr/fr/themes/comparateur.asp?codgeo=REG-{{insee_reg}}\">Accéder aux infos INSEE</a>"]
      ],
      "bodyAfter": [],
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
