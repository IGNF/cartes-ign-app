import LayerConfig from './layer-config';
import LayerSwitcher from './layer-switcher';
import LayerThematics from './layer-thematics';

/**
 * Manager des couches avec l'utilisation des 2 modules suivants :
 * - gestionnaire des couches (classique)
 * - gestion des thèmatiquess
 * @see LayerConfig
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
        var target = this.options.target || document.getElementById("");
        if (!target) {
            console.warn();
            return;
        }

        var container = this.getContainer();
        if (!container) {
            console.warn();
            return;
        }

        // ajout du container
        target.appendChild(container);

        // ajout du module thematique
        this.LayerThematics = new LayerThematics({
            target : document.getElementById(""),
            config : LayerConfig.default
        });

        // ajout du module de gestionnaire de couche
        this.layerSwitcher = new LayerSwitcher({
            target : document.getElementById("")
        });
    }
    
    /**
     * Afficher le menu
     */
    show() {}

    /**
     * Fermer le menu
     */
    hide() {}
}

export default LayerManger;