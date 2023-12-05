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
 * @fires addlayer
 * @fires removelayer
 * @fires movelayer
 * @description 
 *      → manager    
 *      	→ instancie this.catalogue & this.switcher
 *     	→ ecouteurs sur les events 
 *	      	* addLayer
 *	      	   → this.catalogue → call this.switcher.addLayer
 *	      	   → this.switcher → call this.updateCounter
 *	      	* removeLayer
 *	      	   → this.catalogue → call this.switcher.removeLayer
 *	      	   → this.switcher → call this.updateCounter
 *      	→ loader de couches par defaut
 *         		→ call this.catalogue.addLayer
 *       
 *      → catalogue 
 *        	→ this.addLayer → call add interface → fire event addLayer
 *        	→ this.removeLayer → call remove interface → fire event removeLayer
 *      → switcher
 *        	→ this.addLayer → call addContainer & addGroup & map.addLayer → fire event addLayer
 *       	→ this.removeLayer → call removeContainer & removeGroup & map.removeLayer → fire event removeLayer
 *        	→ this.moveLayer → call moveContainer & moveGroup & map.moveLayer
 * 
 */
class LayerManager extends EventTarget {
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
        super();
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
        this.layerCatalogue.addEventListener("addlayer", (e) => {
            this.layerSwitcher.addLayer(e.detail.id);
        });
        this.layerCatalogue.addEventListener("removelayer", (e) => {
            this.layerSwitcher.removeLayer(e.detail.id);
        });

        this.layerSwitcher.addEventListener("addlayer", (e) => {
            /**
             * Evenement "addlayer"
             * @event addlayer
             * @type {*}
             * @property {*} id -
             * @property {*} options -
             */
            this.dispatchEvent(
                new CustomEvent("addlayer", {
                    bubbles: true,
                    detail: e.detail
                })
            );
            var element = document.getElementById(e.detail.id);
            element.classList.add('selectedLayer');
            this.#updateLayersCounter(e.type);
        });
        this.layerSwitcher.addEventListener("removelayer", (e) => {
            /**
             * Evenement "removelayer"
             * @event removelayer
             * @type {*}
             * @property {*} id -
             */
            this.dispatchEvent(
                new CustomEvent("removelayer", {
                    bubbles: true,
                    detail: e.detail
                })
            );
            var element = document.getElementById(e.detail.id);
            element.classList.remove('selectedLayer');
            if (e.detail.error) {
                return;
            }
            this.#updateLayersCounter(e.type);
        });
        this.layerSwitcher.addEventListener("movelayer", (e) => {
            /**
             * Evenement "movelayer"
             * @event movelayer
             * @type {*}
             * @property {*} id -
             * @property {*} positions -
             */
            this.dispatchEvent(
                new CustomEvent("movelayer", {
                    bubbles: true,
                    detail: e.detail
                })
            );
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
                        Globals.dataLayerDisplayed = layerName; // TODO transmettre liste de couches !
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
                    layerConfig.getThematicLayers().length;
        counter.textContent = value;
    }
}

export default LayerManager;
