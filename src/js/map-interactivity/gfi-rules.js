const gfiRules = {
  "TRANSPORTS.DRONES.RESTRICTIONS$GEOPORTAIL:OGC:WMTS": {
    0: {"title": "@limite",
      "body": [
        ["Limite :", "{{limite}}"],
        ["Source des données : DGAC"]
      ]}
  },
  "VILLAGESETAPE$GEOPORTAIL:OGC:WMS": {
    0: {"title": "@toponyme",
      "body": [
        ["Commune labellisée Village étape"],
        ["<a href=https://www.village-etape.fr/les-villages-etapes/ target=\"_blank\">Plus d’informations</a>"]
      ]}
  },
  "POI.MUSEUM$GEOPORTAIL:OGC:WMS": {
    0: {"title": "@toponyme",
      "body": [
        ["{{nature}}"],
        ["Adresse :", "{{adresse_postale}}", "{{acheminement}}"]
      ]}
  },
  "CJP-PARCS-JARDINS_BDD-POI_WLD_WM$GEOPORTAIL:OGC:WMS": {
    0: {"title": "@name",
      "body": [
        ["Conservatoire des Parcs et jardins"],
        ["<a href=\"{{url}}\"",  "alt=\"{{url}}\" target=\"_blank.POI\">", "{{linkname}}</a>"],
        ["{{infos}}"]
      ]}
  },
  "POI.MONUMENTS_BDD_WLD_WM$GEOPORTAIL:OGC:WMS": {
    0: {"title": "@name",
      "body": [
        ["{{sstitle}}"],
        ["<img src=\"https://data.geopf.fr/annexes/ressources/poicmn/{{image}}\">"],
        ["{{image_author}}"],
        ["{{content}}"]
      ]}
  },
  "PROTECTEDAREAS.ZPS$GEOPORTAIL:OGC:WMTS": {
    0: {"title": "@sitename",
      "body": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ]}
  },
  "PROTECTEDAREAS.PN$GEOPORTAIL:OGC:WMTS": {
    0: {"title": "@nom",
      "body": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ]}
  },
  "PROTECTEDAREAS.PNR$GEOPORTAIL:OGC:WMTS": {
    0: {"title": "@nom",
      "body": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ]}
  },
  "PROTECTEDAREAS.RN$GEOPORTAIL:OGC:WMTS": {
    0: {"title": "@nom",
      "body": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ]}
  },
  "PROTECTEDSITES.MNHN.RESERVES-REGIONALES$GEOPORTAIL:OGC:WMTS": {
    0: {"title": "@nom",
      "body": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ]}
  },
  "PROTECTEDAREAS.RNC$GEOPORTAIL:OGC:WMTS": {
    0: {"title": "@nom",
      "body": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ]}
  },
  "PROTECTEDAREAS.SIC$GEOPORTAIL:OGC:WMTS": {
    0: {"title": "@sitename",
      "body": [
        ["<a href=\"{{url}}\">Plus d'informations</a>"]
      ]}
  },
  "FORETS.PUBLIQUES$GEOPORTAIL:OGC:WMTS": {
    13: {"title": "@llib_frt",
      "body": []},
    0: {"title": "@llib2_frt",
      "body": []}
  },
  "CADASTRALPARCELS.PARCELLAIRE_EXPRESS$GEOPORTAIL:OGC:WMTS":{
    0: {"title": "Parcelles Cadastrales",
      "body": [
        ["Numéro de parcelle :", "{{numero}}"],
        ["Feuille :", "{{feuille}}"],
        ["Section :", "{{section}}"],
        ["Commune : {{nom_com}}"],
        ["Département :", "{{code_dep}}"]

      ]}
  },
  "LANDUSE.AGRICULTURE2021$GEOPORTAIL:OGC:WMTS": {
    0 :{"title": "@nom_cultu",
      "body": [
        ["Registre Parcellaire Agricole 2021"]
      ]}
  },

  "LIMITES_ADMINISTRATIVES_EXPRESS.LATEST$GEOPORTAIL:OGC:WMTS": {
    12: {
      "title": "@nom",
      "body": [
        ["Commune :", "{{nom}}"],
        ["Statut :", "{{statut}}"],
        ["Code INSEE :", "{{insee_com}}"],
        ["Population : {{population}} habitants"],
        ["Département :", "{{insee_dep}}"],
        ["<a href=\"http://www.insee.fr/fr/themes/comparateur.asp?codgeo=COM-{{insee_com}}\">Accéder aux infos INSEE</a>"]
      ]
    },
    10: {
      "title": "@nom",
      "body": [
        ["{{nom}}"],
        ["Nature :", "{{nature}}"],
        ["<a href=\"http://www.insee.fr/fr/themes/comparateur.asp?codgeo=EPCI-{{code_siren}}\">Accéder aux infos INSEE</a>"]
      ]
    },
    9: {
      "title": "@nom",
      "body": [
        ["Arrondissement Départemental :", "{{nom}}"],
        ["Code INSEE Département :", "{{insee_dep}}"],
        ["Code INSEE Arrondissement :", "{{insee_arr}}"],
        ["Région :", "{{insee_reg}}"],
        ["<a href=\"http://www.insee.fr/fr/themes/comparateur.asp?codgeo=DEP-{{insee_dep}}\">Accéder aux infos INSEE</a>"]
      ]
    },
    7: {
      "title": "@nom",
      "body": [
        ["Département :", "{{nom}}"],
        ["Code INSEE :", "{{insee_dep}}"],
        ["Région :", "{{insee_reg}}"],
        ["<a href=\"http://www.insee.fr/fr/themes/comparateur.asp?codgeo=DEP-{{insee_dep}}\">Accéder aux infos INSEE</a>"]
      ]
    },
    0: {
      "title": "@nom",
      "body": [
        ["Région :", "{{nom}}"],
        ["Code INSEE :", "{{insee_reg}}"],
        ["<a href=\"http://www.insee.fr/fr/themes/comparateur.asp?codgeo=REG-{{insee_reg}}\">Accéder aux infos INSEE</a>"]
      ]
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
    let body = "<div>";

    template.body.forEach( (bodyElement) => {
      let p = bodyElement.map((str) => {
        let match = str.match("{{(.+)}}");
        if(match && Object.prototype.hasOwnProperty.call(featureProperties, match[1]))
          return str.replace(match[0], featureProperties[match[1]]);
        else return str;
      });
      if (p)
        body += `<p>${p.join(" ")}</p>`;
    });

    body += "</div>";
    result.html = body;
    return result;
  }
};

export default gfiRules;
