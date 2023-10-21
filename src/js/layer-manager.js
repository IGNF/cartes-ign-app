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
     * Ajout d'une couche
     * @param {*} layerName 
     * @param {*} type - base | data | thematic
     */
    addLayer(layerName, type="base") {
        // ajout d'une couche de fonds
        if (type === "base") {
            this.LayerThematics.addLayer(layerName);
            Globals.baseLayerDisplayed = layerName;
        }
        // ajout d'une couche de données
        if (type === "data") {
            this.LayerThematics.addLayer(layerName);
            Globals.dataLayerDisplayed = layerName;
        }
        // mise à jour du compteur de couches
        this.#updateLayerCounter();
    }

    /**
     * Suppression d'une couche
     * @todo
     */
    removeLayer() {

    }

    /**
     * Mise à jour du comtpeur de couches
     * @todo
     */
    #updateLayerCounter() {
        var counter = document.getElementById("layer-switcher-number");
    }
}

export default LayerManger;