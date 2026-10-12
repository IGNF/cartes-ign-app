/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import { config } from "../utils/config-utils";
import { marked } from "marked";
import DomUtils from "../utils/dom-utils";

const EMPTY_TEMPLATE_VALUE = "";

/**
 * Format the template value for display, handling arrays and null/undefined values.
 */
function formatTemplateValue(value) {
  if (value === null || value === undefined) {
    return EMPTY_TEMPLATE_VALUE;
  }

  if (typeof value === "string" && value.startsWith("[")) {
    try {
      const parsedValue = JSON.parse(value);
      if (Array.isArray(parsedValue)) {
        value = parsedValue;
      }
    } catch {
      // Keep malformed JSON strings as-is.
    }
  }

  return Array.isArray(value) ? value.join(", ") : String(value);
}

/**
 * Retrieve a property from feature properties, returning an empty string if it doesn't exist.
 */
function getTemplateProperty(featureProperties, propertyName) {
  // Return an empty string if the property does not exist in the feature properties.
  if (!Object.prototype.hasOwnProperty.call(featureProperties, propertyName)) {
    return EMPTY_TEMPLATE_VALUE;
  }
  return formatTemplateValue(featureProperties[propertyName]);
}

/**
 * Process a template string by replacing placeholders with values
 * @param {string} str - The template string to process
 * @param {Object} featureProperties - Feature properties to substitute
 * @param {Object} options - Processing options
 * @param {boolean} options.includeMarkdown - Process {{{ }}} markdown placeholders (default: true)
 * @param {boolean} options.includeHelpers - Process ~~ ~~ helper function placeholders (default: true)
 * @param {Object} options.specialHandlers - Special property handlers {propName: handler function}
 * @returns {string} Processed string; missing properties are replaced with empty strings
 */
function processTemplateString(str, featureProperties, options = {}) {
  const {
    includeMarkdown = true,
    includeHelpers = true,
    specialHandlers = {}
  } = options;
  // Match markdown first: {{{ content }}}
  if (includeMarkdown) {
    str = str.replace(/{{{([^}]+)}}}/g, (placeholder, propertyName) =>
      marked(getTemplateProperty(featureProperties, propertyName.trim()))
    );
  }

  // Then match operations: ~~ expression ~~
  if (includeHelpers) {
    str = str.replace(/~~(.*?)~~/g, (placeholder, expression) => {
      const expr = expression.trim();
      let result = EMPTY_TEMPLATE_VALUE;
      try {
        // Match helper(arg)
        const fnMatch = expr.match(/^([a-zA-Z0-9_]+)\((.*?)\)$/);
        if (fnMatch) {
          const fnName = fnMatch[1];
          const argName = fnMatch[2].trim();
          if (
            Object.prototype.hasOwnProperty.call(helpers, fnName) &&
            Object.prototype.hasOwnProperty.call(featureProperties, argName) &&
            featureProperties[argName] !== null &&
            featureProperties[argName] !== undefined
          ) {
            result = formatTemplateValue(helpers[fnName](featureProperties[argName]));
          }
        }
      } catch (e) {
        console.error(e);
      }
      return result;
    });
  }

  // Finally match raw properties: {{ property }}
  let suppressString = false;
  str = str.replace(/{{([^{}]+)}}/g, (placeholder, propertyName) => {
    const propName = propertyName.trim();

    // Apply special handler if available
    if (specialHandlers[propName]) {
      const result = specialHandlers[propName](featureProperties);
      if (result === null || result === undefined) {
        suppressString = true;
        return EMPTY_TEMPLATE_VALUE;
      }
      return formatTemplateValue(result);
    }

    return getTemplateProperty(featureProperties, propName);
  });

  return suppressString ? EMPTY_TEMPLATE_VALUE : str;
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
    let z;
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
        pretitle = processTemplateString(pretitle, featureProperties);
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
        identifiant_gestionnaire: (featureProperties) => {
          const value = featureProperties["identifiant_gestionnaire"];
          if (!value) {
            return null;
          }
          return value.charAt(0).toUpperCase() + value.slice(1);
        },
        fiche_wikipedia: (featureProperties) => {
          if (!featureProperties["code_insee"]) {
            return null;
          }
          const wikiValue = config.inseeCommWiki[featureProperties["code_insee"]];
          if (!wikiValue) {
            return null;
          }
          return wikiValue;
        },
        presentation_courte: (featureProperties) => {
          const value = featureProperties["presentation_courte"];
          if (!value) {
            return null;
          }
          try {
            return DomUtils.stringToHTML(value.trim()).innerText.trim();
          } catch {
            return value;
          }
        },
        presentation: (featureProperties) => {
          const value = featureProperties["presentation"];
          if (!value) {
            return null;
          }
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
