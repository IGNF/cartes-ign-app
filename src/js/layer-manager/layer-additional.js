/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

/**
 * Données additionnelles pour les couches
 * (non disponible dans les getCapabilities)
 */

/**
 * Obtenir la legende de la couche
 * ex. https://data.geopf.fr/annexes/ressources/legendes/LEGEND.jpg
 * @param {*} name
 * @returns
 */
const getLegend = (name) => {
  return require(`../../html/img/legends/${name}.png`);
};

/**
 * Obtenir les imagettes pour une couche
 * @param {*} name
 * @returns
 */
const getQuickLookUrl = (name) => {
  return require(`../../html/img/layers/${name}.jpg`);
};

export default {
  getQuickLookUrl,
  getLegend
};
