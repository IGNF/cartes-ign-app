import Globals from './globals';
import LayerSwitcher from './layer-switcher';
import LayerCatalogue from './layer-catalogue';
import layerConfig from './layer-config';

/**
 * Manager des couches avec l'initialisation des 2 modules suivants :
 * - gestionnaire des couches (classique)
 * - gestion des thèmatiques et fonds de carte
 * @see LayerSwitcher
 * @see LayerCatalogue
 * @todo ...
 */
class LayerManger {
    /**
     * constructeur
     * @param {*} options -
     * @param {*} options.target - ...
     * @param {*} options.layers - ...
     * @example
     * new LayerManger({
     *   layers : [
     *     layers : "couche1, couche2, ...",
     *     type : "base" // data ou thematic
     *   ]
     * });
     */
    constructor(options) {
        this.options = options || {
            /**
             * [{
             *   layers : Globals.baseLayerDisplayed,
             *   type : "base"
             * }]
             */
            layers : [],
            target : null
        };

        this.layerCatalogue = null;
        this.layerSwitcher = null;
        this.#render();
        this.#listeners();
        this.#loadLayers();
    }

    /**
     * Ecouteurs
     */
    #listeners() {
        this.layerCatalogue.event.addEventListener("addlayer", (e) => {
            // cf. this.layerSwitcher.event.addEventListener("addlayer")
            this.layerSwitcher.addLayer(e.detail.id);
        });
        this.layerCatalogue.event.addEventListener("removelayer", (e) => {
            // cf. this.layerSwitcher.event.addEventListener("removelayer")
            this.layerSwitcher.removeLayer(e.detail.id);
        });

        this.layerSwitcher.event.addEventListener("addlayer", (e) => {
            var element = document.getElementById(e.detail.id);
            element.classList.add('selectedLayer');
            this.#updateLayersCounter(e.type);
        });
        this.layerSwitcher.event.addEventListener("removelayer", (e) => {
            var element = document.getElementById(e.detail.id);
            element.classList.remove('selectedLayer');
            this.#updateLayersCounter(e.type);
        });
    }

    /**
     * Rendu du menu de management des couches
     */
    #render() {
        var target = this.options.target || document.getElementById("layerManagerWindow");
        if (!target) {
            console.warn();
            return;
        }

        // ajout du module thematique
        this.layerCatalogue = new LayerCatalogue({
            target : document.getElementById("layer-thematics")
        });

        // ajout du module de gestionnaire de couche
        this.layerSwitcher = new LayerSwitcher({
            target : document.getElementById("layer-switcher")
        });

        this.#getLayersAvailableCounter();
    }

    /**
     * Afficher le menu
     * @public
     */
    show() {}

    /**
     * Fermer le menu
     * @public
     */
    hide() {}

    /**
     * Chargement de plusieurs couches
     * @todo prendre en compte une liste de couches
     * @todo transmettre des options de la couches (ex. opacité)
     */
    #loadLayers() {
        if (this.options.layers) {
            for (let i = 0; i < this.options.layers.length; i++) {
                const o = this.options.layers[i];
                var layers = o.layers.split(","); // TODO récuperer une liste de couches !
                for (let j = 0; j < layers.length; j++) {
                    const layerName = layers[j];

                    // ajout d'une couche de fonds
                    if (o.type === "base") {
                        this.layerCatalogue.addLayer(layerName); // TODO transmettre des options de la couches (ex. opacité)
                        Globals.baseLayerDisplayed = layerName; // TODO transmettre une liste de couches !
                    }
                    // ajout d'une couche de données
                    if (o.type === "data") {
                        this.layerCatalogue.addLayer(layerName); // TODO transmettre des options de la couches (ex. opacité)
                        Globals.dataLayerDisplayed = layerName; // TODO liste de couches !
                    }
                }
            }
        }
    }

    /**
     * Mise à jour du comtpeur de couches sur le gestionnaire de couches
     * @param {*} type
     */
    #updateLayersCounter(type) {
        // cf. l'abonnement à l'ajout / suppression de couche
        var counter = document.getElementById("layer-switcher-number");
        var value = parseInt(counter.textContent, 10);
        if (type === "addlayer") {
            value++;
        }
        if (type === "removelayer") {
            value--;
        }
        counter.textContent = value;
    }

    /**
     * Obtient le nombre de couches du catalogue disponibles
     */
    #getLayersAvailableCounter() {
        var counter = document.getElementById("layer-thematics-number");
        var value = layerConfig.getBaseLayers().length +
                    layerConfig.getRLTLayers().length +
                    layerConfig.getThematicLayers().length;
        counter.textContent = value;
    }
}

export default LayerManger;
