/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import InseeCommWiki from "../../../config/com_wiki.json";
import GfiRules from "../../../config/gfi-rules.json";
let inseeCommWiki;
try {
  const resp = await fetch("https://ignf.github.io/cartes-ign-app/com_wiki.json");
  inseeCommWiki = await resp.json();
} catch (e) {
  inseeCommWiki = InseeCommWiki;
}

let gfiRulesProps;
try {
  const resp = await fetch("https://ignf.github.io/cartes-ign-app/gfi-rules.json");
  gfiRulesProps = await resp.json();
} catch (e) {
  gfiRulesProps = GfiRules;
}

const gfiRules = {
  ...gfiRulesProps,
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
    let template = rule[`${z}`];
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
