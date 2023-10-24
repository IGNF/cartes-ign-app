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
    return `https://www.geoportail.gouv.fr/depot/layers/${name}/legendes/${name}-legend.png`;
};

/**
 * Obtenir les imagettes pour une couche
 * ex. https://www.geoportail.gouv.fr/depot/layers/ORTHOIMAGERY.ORTHOPHOTOS/vignettes/ORTHOIMAGERY.ORTHOPHOTOS-quickViewSMLL.jpg
 * @param {*} name 
 * @returns 
 */
const getQuickLookUrl = (name) => {
    return `https://www.geoportail.gouv.fr/depot/layers/${name}/vignettes/${name}-quickViewSMLL.jpg`;
};

export default {
    getQuickLookUrl,
    getLegend
};