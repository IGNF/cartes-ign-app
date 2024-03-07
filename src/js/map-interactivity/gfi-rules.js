const gfiRules = {
  "TRANSPORTS.DRONES.RESTRICTIONS$GEOPORTAIL:OGC:WMTS": {
    "title": "@limite",
    "body": [
      ["Limite :", "{{limite}}"],
      ["Source des données : DGAC"]
    ]
  },
  "VILLAGESETAPE$GEOPORTAIL:OGC:WMS": {
    "title": "@toponyme",
    "body": [
      ["Commune labellisée Village étape"],
      ["<a href=https://www.village-etape.fr/les-villages-etapes/ target=\"_blank\">Plus d’informations</a>"]
    ]
  },
  "POI.MUSEUM$GEOPORTAIL:OGC:WMS": {
    "title": "@toponyme",
    "body": [
      ["{{nature}}"],
      ["Adresse :", "{{adresse_postale}}", "{{acheminement}}"]
    ]
  },
  "CJP-PARCS-JARDINS_BDD-POI_WLD_WM$GEOPORTAIL:OGC:WMS": {
    "title": "@name",
    "body": [
      ["Conservatoire des Parcs et jardins"],
      ["<a href=\"{{url}}\"",  "alt=\"{{url}}\" target=\"_blank.POI\">", "{{linkname}}</a>"],
      ["{{infos}}"]
    ]
  },
  "POI.MONUMENTS_BDD_WLD_WM$GEOPORTAIL:OGC:WMS": {
    "title": "@name",
    "body": [
      ["{{sstitle}}"],
      ["<img src=\"https://data.geopf.fr/annexes/ressources/poicmn/{{image}}\">"],
      ["{{image_author}}"],
      ["{{content}}"]
    ]
  },
  "PROTECTEDAREAS.ZPS$GEOPORTAIL:OGC:WMTS": {
    "title": "@sitename",
    "body": [
      ["<a href=\"{{url}}\">Plus d'informations</a>"]
    ]
  },
  "PROTECTEDAREAS.PN$GEOPORTAIL:OGC:WMTS": {
    "title": "@nom",
    "body": [
      ["<a href=\"{{url}}\">Plus d'informations</a>"]
    ]
  },
  "PROTECTEDAREAS.PNR$GEOPORTAIL:OGC:WMTS": {
    "title": "@nom",
    "body": [
      ["<a href=\"{{url}}\">Plus d'informations</a>"]
    ]
  },
  "PROTECTEDAREAS.RN$GEOPORTAIL:OGC:WMTS": {
    "title": "@nom",
    "body": [
      ["<a href=\"{{url}}\">Plus d'informations</a>"]
    ]
  },
  "PROTECTEDSITES.MNHN.RESERVES-REGIONALES$GEOPORTAIL:OGC:WMTS": {
    "title": "@nom",
    "body": [
      ["<a href=\"{{url}}\">Plus d'informations</a>"]
    ]
  },
  "PROTECTEDAREAS.RNC$GEOPORTAIL:OGC:WMTS": {
    "title": "@nom",
    "body": [
      ["<a href=\"{{url}}\">Plus d'informations</a>"]
    ]
  },
  "PROTECTEDAREAS.SIC$GEOPORTAIL:OGC:WMTS": {
    "title": "@sitename",
    "body": [
      ["<a href=\"{{url}}\">Plus d'informations</a>"]
    ]
  },
  "FORETS.PUBLIQUES$GEOPORTAIL:OGC:WMTS": {
    "title": "@llib2_frt",
    "body": []
  },
  "CADASTRALPARCELS.PARCELLAIRE_EXPRESS$GEOPORTAIL:OGC:WMTS":{
    "title": "Parcelles Cadastrales",
    "body": [
      ["Numéro de parcelle :", "{{numero}}"],
      ["Feuille :", "{{feuille}}"],
      ["Section :", "{{section}}"],
      ["Commune : {{nom_com}}"],
      ["Département :", "{{code_dep}}"]

    ]
  },
  "LANDUSE.AGRICULTURE2021$GEOPORTAIL:OGC:WMTS": {
    "title": "@nom_cultu",
    "body": [
      ["Registre Parcellaire Agricole 2021"]
    ]
  },

  /**
     * Parse le GFI
     * @param {*} rule règle de parsing de GFI issue de ce fichier
     * @param {*} gfi gfi en mode json
     * @returns {Object} {title: ..., html: ...} pour l'affichage
     */
  parseGFI: (rule, gfi) => {
    const result = {
      geometry: gfi.features[0].geometry,
    };
    const featureProperties = gfi.features[0].properties;
    if (rule["title"][0] === "@") {
      let str = featureProperties[rule.title.split("@")[1]];
      result.title = str[0].toUpperCase() + str.slice(1);
    } else {
      result.title = rule.title;
    }
    let body = "<div>";

    rule.body.forEach( (bodyElement) => {
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