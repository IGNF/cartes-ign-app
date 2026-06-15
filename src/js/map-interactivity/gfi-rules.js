/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import { config } from "../utils/config-utils";
import { marked } from "marked";
import DomUtils from "../utils/dom-utils";

/**
 * Process a template string by replacing placeholders with values
 * @param {string} str - The template string to process
 * @param {Object} featureProperties - Feature properties to substitute
 * @param {Object} options - Processing options
 * @param {boolean} options.includeMarkdown - Process {{{ }}} markdown placeholders (default: true)
 * @param {boolean} options.includeHelpers - Process ~~ ~~ helper function placeholders (default: true)
 * @param {Object} options.specialHandlers - Special property handlers {propName: handler function}
 * @returns {string|null} Processed string, or null if required property not found
 */
function processTemplateString(str, featureProperties, options = {}) {
  const {
    includeMarkdown = true,
    includeHelpers = true,
    specialHandlers = {}
  } = options;

  // Match markdown first: {{{ content }}}
  if (includeMarkdown) {
    let match = str.match("{{{([^}]+)}}}");
    while (match) {
      if (Object.prototype.hasOwnProperty.call(featureProperties, match[1])) {
        str = str.replace(match[0], marked(featureProperties[match[1]]));
        match = str.match("{{{([^}]+)}}}");
      } else {
        break;
      }
    }
  }

  // Then match operations: ~~ expression ~~
  if (includeHelpers) {
    let match = str.match(/~~(.*?)~~/);
    while (match) {
      const expr = match[1].trim();
      let result = "";
      try {
        // Match helper(arg)
        const fnMatch = expr.match(/^([a-zA-Z0-9_]+)\((.*?)\)$/);
        if (fnMatch) {
          const fnName = fnMatch[1];
          const argName = fnMatch[2].trim();
          if (
            Object.prototype.hasOwnProperty.call(helpers, fnName) &&
            Object.prototype.hasOwnProperty.call(featureProperties, argName)
          ) {
            result = helpers[fnName](featureProperties[argName]);
          }
        }
      } catch (e) {
        console.error(e);
      }
      str = str.replace(match[0], result);
      match = str.match(/~~(.*?)~~/);
    }
  }

  // Finally match raw properties: {{ property }}
  let match = str.match("{{([^}]+)}}");
  while (match) {
    const propName = match[1];

    // Apply special handler if available
    if (specialHandlers[propName]) {
      const result = specialHandlers[propName](featureProperties[propName]);
      if (result === null) {
        str = str.replace(match[0], "");
      } else {
        str = str.replace(match[0], result);
      }
    } else if (Object.prototype.hasOwnProperty.call(featureProperties, propName)) {
      let propValue = featureProperties[propName];

      // Parse JSON arrays if value starts with "["
      if (typeof propValue === "string" && propValue[0] === "[") {
        propValue = JSON.parse(propValue).join(", ");
      } else if (Array.isArray(propValue)) {
        propValue = propValue.join(", ");
      }

      str = str.replace(match[0], propValue);
    } else {
      str = str.replace(match[0], "");
    }

    match = str.match("{{([^}]+)}}");
  }

  return str;
}

function duration(hours) {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) {
    return `${m}&nbsp;min`;
  }
  if (m === 0) {
    return `${h}&nbsp;h`;
  }
  return `${h}h${m}`;
}

function tokilometers(value) {
  return `${(Math.round(value / 100) * 100 / 1000).toLocaleString("fr")} km`;
}

function sentierSource(source) {
  if (source === "ffr") {
    return "Fédération Française de Randonnée";
  } else if (source === "cv") {
    return "Club Vosgien";
  } else {
    return "IGN";
  }
}

const helpers = {
  duration,
  tokilometers,
  sentierSource,
};

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
      if (!featureProperties[template.title.split("@")[1]]) {
        result.title = "</p>";
      } else {
        let str = featureProperties[template.title.split("@")[1]].replace("", "'");
        if (str.length) {
          result.title = str[0].toUpperCase() + str.slice(1) + "</p>";
        } else {
          result.title = "</p>";
        }
      }
    } else {
      result.title = template.title + "</p>";
    }
    if (template["titlePrefix"]) {
      result.title = `${template["titlePrefix"]}${result.title}`;
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
      const processedSubtitle = processTemplateString(template["subtitle"], featureProperties);
      if (processedSubtitle !== null) {
        result.title += `<p class="positionSubTitle">${processedSubtitle}</p>`;
      }
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
      } else {
        let match = pretitle.match("{{([^}]+)}}");
        while (match) {
          if (Object.prototype.hasOwnProperty.call(featureProperties, match[1])) {
            if (Array.isArray(featureProperties[match[1]])) {
              featureProperties[match[1]] = featureProperties[match[1]].join(", ");
            }
            pretitle = pretitle.replace(match[0], featureProperties[match[1]]);
            match = pretitle.match("{{([^}]+)}}");
          }
        }
      }
      result.title = pretitle + `<div class="positionTitleWrapper">${result.title}</div>`;
    }
    let bodyBefore = "";
    if (template.bodyBefore) {
      bodyBefore += "<div class='positionHtmlBefore'>";
      template.bodyBefore.forEach((bodyElement) => {
        let notFound = false;
        let p = bodyElement.map((str) => {
          const result = processTemplateString(str, featureProperties);
          if (result === null) {
            notFound = true;
            return "";
          }
          return result;
        });
        if (p && !notFound) {
          bodyBefore += `${p.join(" ")}<br/>`;
        }
      });
      bodyBefore += "</div>";
    }
    let bodyAfter = "";
    if (template.bodyAfter) {
      bodyAfter += "<div class='positionHtmlAfter'>";
      const specialHandlers = {
        identifiant_gestionnaire: (value) => {
          if (!value) {
            return null;
          }
          return value.charAt(0).toUpperCase() + value.slice(1);
        },
        fiche_wikipedia: () => {
          if (!featureProperties["code_insee"]) {
            return null;
          }
          const wikiValue = config.inseeCommWiki[featureProperties["code_insee"]];
          if (!wikiValue) {
            return null;
          }
          return wikiValue;
        },
        presentation_courte: (value) => {
          try {
            return DomUtils.stringToHTML(value.trim()).innerText.trim();
          } catch {
            return value;
          }
        },
        presentation: (value) => {
          try {
            return DomUtils.stringToHTML(value.trim()).innerText.trim();
          } catch {
            return value;
          }
        },
      };
      template.bodyAfter.forEach((bodyElement) => {
        let notFound = false;
        let p = bodyElement.map((str) => {
          const result = processTemplateString(str, featureProperties, { specialHandlers });
          if (result === null) {
            notFound = true;
            return "";
          }
          return result;
        });
        if (p && !notFound) {
          bodyAfter += `${p.join(" ")}`;
        }
      });
      bodyAfter += "</div>";
    }

    let htmlEvent = "";
    if (template.htmlEvent) {
      htmlEvent += "<div class='positionHtmlEvent'>";
      template.htmlEvent.forEach( (bodyElement) => {
        let notFound = false;
        let p = bodyElement.map((str) => {
          const result = processTemplateString(str, featureProperties);
          if (result === null) {
            notFound = true;
            return "";
          }
          return result;
        });
        if (p && !notFound)
          htmlEvent += `${p.join(" ")}`;
      });
      htmlEvent += "</div>";
    }

    let htmlBeforeAddress = "";
    if (template.htmlBeforeAddress) {
      htmlBeforeAddress += "<div class='positionHtmlBeforeAddress'>";
      template.htmlBeforeAddress.forEach( (bodyElement) => {
        let notFound = false;
        let p = bodyElement.map((str) => {
          const result = processTemplateString(str, featureProperties);
          if (result === null) {
            notFound = true;
            return "";
          }
          return result;
        });
        if (p && !notFound)
          htmlBeforeAddress += `${p.join(" ")}`;
      });
      htmlBeforeAddress += "</div>";
    }

    result.html = bodyBefore;
    result.html2 = bodyAfter;
    result.htmlEvent = htmlEvent;
    result.htmlBeforeAddress = htmlBeforeAddress;
    return result;
  }
};

export default gfiRules;
