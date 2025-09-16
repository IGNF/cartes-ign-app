/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import BaseLayers from "../../../config/base-layer-config.json";
import ThematicLayers from "../../../config/thematics-layer-config.json";
import ConfigLayers from "../../../config/layers-config.json";

import QueryConfig from "../../../config/immersive-position-config.json";
import Code_cultuCaption from "../../../config/code_cultu-caption.json";
import Code_tfvCaption from "../../../config/code_tfv-caption.json";

import PoiConfig from "../../../config/poi-osm-layer-config.json";

import ComparePoiData from "../../../config/poi_rlt.json";

import InseeCommWiki from "../../../config/com_wiki.json";
import GfiRulesProps from "../../../config/gfi-rules.json";

import { Capacitor } from "@capacitor/core";
import { Device } from "@capacitor/device";

// REMOVEME
// Polyfill pour Promise.allSettled
Promise.allSettled = Promise.allSettled || ((promises) => Promise.all(
  promises.map(p => p
    .then(value => ({
      status: "fulfilled",
      value
    }))
    .catch(reason => ({
      status: "rejected",
      reason
    }))
  )
));

const config = {
  baseLayers: null,
  thematicLayers: null,
  configLayers: null,
  tempLayers: [],
  queryConfig: null,
  code_cultuCaption: null,
  code_tfvCaption: null,
  poiConfig: null,
  comparePoiData: null,
  inseeCommWiki: null,
  gfiRulesProps: null,
  hasLoaded: false,
};

const urls = {
  baseLayers: {
    url: "https://ignf.github.io/cartes-ign-app/base-layer-config.json",
    fallback: BaseLayers,
  },
  thematicLayers: {
    url: "https://ignf.github.io/cartes-ign-app/thematics-layer-config.json",
    fallback: ThematicLayers,
  },
  configLayers: {
    url: "https://ignf.github.io/cartes-ign-app/layers-config.json",
    fallback: ConfigLayers,
  },
  tempLayers: {
    url: "https://ignf.github.io/cartes-ign-temp-layers/temp_layers_config.json",
    fallback: [], // default empty list if not available
  },
  queryConfig: {
    url: "https://ignf.github.io/cartes-ign-app/immersive-position-config.json",
    fallback: QueryConfig,
  },
  code_cultuCaption: {
    url: "https://ignf.github.io/cartes-ign-app/code_cultu-caption.json",
    fallback: Code_cultuCaption,
  },
  code_tfvCaption: {
    url: "https://ignf.github.io/cartes-ign-app/code_tfv-caption.json",
    fallback: Code_tfvCaption,
  },
  poiConfig: {
    url: "https://ignf.github.io/cartes-ign-app/poi-osm-layer-config.json",
    fallback: PoiConfig,
  },
  comparePoiData: {
    url: "https://ignf.github.io/cartes-ign-app/poi_rlt.json",
    fallback: ComparePoiData,
  },
  inseeCommWiki: {
    url: "https://ignf.github.io/cartes-ign-app/com_wiki.json",
    fallback: InseeCommWiki,
  },
  gfiRulesProps: {
    url: "https://ignf.github.io/cartes-ign-app/gfi-rules.json",
    fallback: GfiRulesProps,
  },
};

async function loadConfigs() {
  if (config.hasLoaded) {
    return;
  }
  const keys = Object.keys(urls);

  // Run all fetches in parallel
  const results = await Promise.allSettled(
    keys.map((key) =>
      fetch(urls[key].url).then((resp) => resp.json())
    )
  );

  // Extract results with fallback if needed
  keys.forEach((key, i) => {
    if (results[i].status === "fulfilled") {
      config[key] = results[i].value;
    } else {
      console.warn(`Could not load ${key} from server, using fallback.`);
      config[key] = urls[key].fallback;
    }
  });

  // Disable tempLayers on iOS < 16 (not working because of preflight OPTIONS request)
  const info = await Device.getInfo();
  if (info.platform === "ios") {
    // info.osVersion is usually like "15.6.1" or "16.0"
    const version = parseFloat(info.osVersion);
    if (version < 16.0) {
      config.tempLayers = [];
    }
  }
  // Disable tempLayers on android webview < 99 (not working because of preflight OPTIONS request)
  // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Range#browser_compatibility
  if (info.platform === "android") {
    const webViewVersion = parseInt(info.webViewVersion.split(".")[0]);
    if (webViewVersion < 99) {
      config.tempLayers = [];
    }
  }
  // Filter temp layers
  config.tempLayers = config.tempLayers.filter((layer) => {
    if (!layer.isProdReady && Capacitor.getPlatform() !== "web") {
      return false;
    }
    if (Date.now() < Date.parse(layer.dateEnd) && Date.now() > Date.parse(layer.dateStart)) {
      return true;
    }
    return false;
  });

  // Add temp layers to thematicLayers
  if (config.tempLayers.length > 0) {
    config.thematicLayers.push({
      name: "Évènements",
      layers: config.tempLayers.map((layer) => layer.id),
    });
  }
  config.hasLoaded = true;
}

await loadConfigs();

export {
  config
};
