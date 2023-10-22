import Globals from './globals';
import LayerSwitcher from './layer-switcher';
import LayerThematics from './layer-thematics';

/**
 * Manager des couches avec l'utilisation des 2 modules suivants :
 * - gestionnaire des couches (classique)
 * - gestion des thèmatiquess
 * @see LayerSwitcher
 * @see LayerThematics
 * @todo ...
 */
class LayerManger {
    /**
     * constructeur
     * @param {*} options - 
     * @param {*} options.target - ...
     */
    constructor(options) {
        this.options = options || {
            target : null
        };

        this.LayerThematics = null;
        this.layerSwitcher = null;
        this.#render();
        this.#listeners();
    }

    /**
     * Ecouteurs
     */
    #listeners() {
        this.LayerThematics.event.addEventListener("addlayer", (e) => {
            this.#updateLayersCounter(e);
        });
        this.LayerThematics.event.addEventListener("removelayer", (e) => {
            this.#updateLayersCounter(e);
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
        this.LayerThematics = new LayerThematics({
            target : document.getElementById("layer-thematics")
        });

        // ajout du module de gestionnaire de couche
        this.layerSwitcher = new LayerSwitcher({
            target : document.getElementById("layer-switcher")
        });
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
     * Ajout de plusieurs couches
     * @param {Object} o
     * @param {Array} o.layers - liste de couches
     * @param {String} o.type - base | data | thematic
     * @todo prendre en compte une liste de couches à ajouter
     */
    addLayers(o) {
        var layers = o.layers.split(",");
        for (let index = 0; index < layers.length; index++) {
            const layerName = layers[index];
            
            // ajout d'une couche de fonds
            if (o.type === "base") {
                this.LayerThematics.addLayer(layerName);
                Globals.baseLayerDisplayed = layerName; // TODO liste de couches !
            }
            // ajout d'une couche de données
            if (o.type === "data") {
                this.LayerThematics.addLayer(layerName);
                Globals.dataLayerDisplayed = layerName; // TODO liste de couches !
            }
        }
    }

    /**
     * Suppression de plusieurs couches
     * @todo
     */
    removeLayers() {

    }

    /**
     * Mise à jour du comtpeur de couches
     * @todo
     */
    #updateLayersCounter(e) {
        console.log(e);
        // cf. l'abonnement à l'ajout / suppression de couche
        var counter = document.getElementById("layer-switcher-number");
    }
}

export default LayerManger;