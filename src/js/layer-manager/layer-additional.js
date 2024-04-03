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
