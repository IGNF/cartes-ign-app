/**
 * Données additionnelles pour les couches
 * (non disponible dans les getCapabilities)
 */

/**
 * Obtenir la legende de la couche
 * ex. https://www.geoportail.gouv.fr/depot/layers/ORTHOIMAGERY.ORTHOPHOTOS/legendes/ORTHOIMAGERY.ORTHOPHOTOS-legend.png
 * @param {*} name
 * @returns
 */
const getLegend = (name) => {
    return require(`../html/img/legends/${name}.png`);
};

/**
 * Obtenir les imagettes pour une couche
 * @param {*} name
 * @returns
 */
const getQuickLookUrl = (name) => {
    return require(`../html/img/layers/${name}.jpg`);
};

export default {
    getQuickLookUrl,
    getLegend
};
