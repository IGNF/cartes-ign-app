/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import { config } from "../utils/config-utils";
import { marked } from "marked";

const gfiRules = {
  ...config.gfiRulesProps,
  /**
     * Parse le GFI
     * @param {*} rule règle de parsing de GFI issue de ce fichier
     * @param {*} gfi gfi en mode json
     * @returns {Object} {title: ..., html: ...} pour l'affichage
     */
  parseGFI: (rule, gfi, zoom) => {
    if (gfi.features.length == 0) {
      return;
    }
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
        result.title = str[0].toUpperCase() + str.slice(1) + "</p>";
      } else {
        result.title = "</p>";
      }
    } else {
      result.title = template.title + "</p>";
    }
    if (template["pretitle"]) {
      let pretitle = template["pretitle"];
      if (template["pretitle"][0] === "@") {
        let str = featureProperties[template.pretitle.split("@")[1]].replace("", "'");
        if (str.length) {
          pretitle = str[0].toUpperCase() + str.slice(1);
        } else {
          pretitle = "";
        }
      }
      result.title = pretitle + result.title;
    }
    result.title = `<p class="positionTitle">${result.title}`;
    if (template["title2"]) {
      let str = "";
      if (template["title2"][0] === "@") {
        if (template["title2type"] && template["title2type"] === "date") {
          str += "<span class=\"positionTitleDateicon\"></span>";
        }
        str += featureProperties[template.title2.split("@")[1]].replace("", "'");
        if (str) {
          str = str[0].toUpperCase() + str.slice(1);
        }
      } else {
        str = template["title2"];
      }
      if (str) {
        result.title += `<p class="positionTitle2">${str}`;
      }
    }
    if (template["title3"]) {
      let str;
      if (template["title3"][0] === "@") {
        str = featureProperties[template.title3.split("@")[1]].replace("", "'");
        if (str) {
          str = str[0].toUpperCase() + str.slice(1);
        }
      } else {
        str = template["title3"];
      }
      if (str) {
        result.title += `<span class="positionTitle3">&nbsp;- ${str}</span>`;
      }
    }
    if (template["title2"]) {
      result.title += "</p>";
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
              if (Array.isArray(featureProperties[match[1]])) {
                featureProperties[match[1]] = featureProperties[match[1]].join(", ");
              }
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
          // match markdown first
          let match = str.match("{{{([^}]+)}}}");
          while (match) {
            if (Object.prototype.hasOwnProperty.call(featureProperties, match[1])) {
              str = str.replace(match[0], marked(featureProperties[match[1]]));
              match = str.match("{{{([^}]+)}}}");
            }
          }
          match = str.match("{{([^}]+)}}");
          while (match) {
            if (Object.prototype.hasOwnProperty.call(featureProperties, match[1])) {
              if (match[1] === "identifiant_gestionnaire") {
                if (!featureProperties[match[1]]) {
                  return "";
                }
                featureProperties[match[1]] = featureProperties[match[1]].charAt(0).toUpperCase() + featureProperties[match[1]].slice(1);
              }
              if (featureProperties[match[1]][0] === "[") {
                featureProperties[match[1]] = JSON.parse(featureProperties[match[1]]).join(", ");
              }
              str = str.replace(match[0], featureProperties[match[1]]);
              match = str.match("{{([^}]+)}}");
            } else {
              if (match[1] === "fiche_wikipedia") {
                if (!featureProperties["code_insee"]) {
                  return "";
                }
                featureProperties[match[1]] = config.inseeCommWiki[featureProperties["code_insee"]];
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
