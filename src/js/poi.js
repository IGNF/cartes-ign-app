import maplibregl from "maplibre-gl";

import Globals from './globals';

/**
 * Contrôle de filtrage attributaire des POI
 */
class POI {
    /**
     * constructeur
     * @returns
     */
    constructor() {

        this.opened = false;

        this.#loadLayer();
        this.#render();
        this.#listeners();

        return this;
    }

    /**
     * chargement de la couche
     */
    #loadLayer() {}

    /**
     * creation de l'interface
     */
    #render() {}

    /**
     * ajout d'ecouteurs
     */
    #listeners() {}

    /**
     * ouvre l'interface
     * @public
     */
    show() {
        this.opened = true;
        console.debug("show")
    }

    /**
     * ferme l'interface
     * @public
     */
    hide() {
        this.opened = false;
        console.debug("hide");
    }

    /**
     * toggle d'affichage du contrôle
     * @public
     */
    toggle() {
        if (this.opened) {
            this.hide();
        } else {
            this.show();
        }
    }
}

export default POI;