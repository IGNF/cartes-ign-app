/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

/**
 * Lazy loader for commune Wikipedia lookup data
 * Defers loading of 1.87MB JSON until first use
 */

let communeWikiData = null;
let loadingPromise = null;

export async function getCommuneWikiData() {
  if (communeWikiData) {
    return communeWikiData;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = import("../../../config/com_wiki.json")
    .then( (module) => {
      communeWikiData = module.default;
      return communeWikiData;
    })
    .catch( (err) => {
      loadingPromise = null;
      console.error("Failed to load commune wiki data:", err);
      return {};
    });

  return loadingPromise;
}
