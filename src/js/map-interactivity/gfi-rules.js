const gfiRules = {
  "TRANSPORTS.DRONES.RESTRICTIONS$GEOPORTAIL:OGC:WMTS": {
    "properties": ["limite"],
    "title": "@limite",
    "body": [["Limite", "@limite"], ["Source des données", "DGAC"]]
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
      result.title = featureProperties[rule.title.split("@")[1]];
    } else {
      result.title = rule.title;
    }
    let body = "<div>";
    rule["body"].forEach( (bodyElement) => {
      let value;
      if (bodyElement[1][0] === "@") {
        value = featureProperties[bodyElement[1].split("@")[1]];
      } else {
        value = bodyElement[1];
      }
      body += `<p>${bodyElement[0]} : ${value}</p>`;
    });
    body += "</div>";
    result.html = body;
    return result;
  }
};

export default gfiRules;