import maplibregl from "maplibre-gl";

import Globals from './globals';

import LayersConfig from './layer-config';
import PoiConfig from './data-layer/poi-osm-layer-config.json';

/**
 * Contrôle sur le filtrage attributaire des POI osm
 * @description
 * La couche est active par defaut, les filtres de selections sont ajoutés et la visibilité est
 * désactivée par defaut.
 */
class POI {
    /**
     * constructeur
     * @param {*} options
     * @returns
     */
    constructor(map, options) {
        this.options = options || {
            target: null,
            id: "OSM.POI$GEOPORTAIL:GPP:TMS"
        };

        this.opened = false;

        this.map = map;

        this.#loadLayer();
        this.#render();
        this.#listeners();

        return this;
    }

    /**
     * chargement de la couche
     */
    #loadLayer() {
        // creer la source
        // lire les filtres d'affichage
        // creer les filtres de selection
        // ajouter les filtres à la fin de la liste
    }

    /**
     * creation des filtres de sélections dans les styles
     */
    #createFilters() {}

    /**
     * creation de l'interface
     */
    #render() {
        var target = this.options.target || document.getElementById("poiWindow");
        if (! target) {
            console.warn();
            return;
        }

        var strThematics = "";
        const tplThematics = (values) => {
            return `
            <input type="checkbox" id="${values.key}" name="${values.key}" value="${values.key}">
            <label for="${values.key}">${values.name}</label>
            `;
        };

        var tpltContainer = `
            <div id="" class="">
                <div>
                    <span>Point d'interêt</span>
                </div>
                <div>
                    <span>Afficher les POI</span>
                    <div class="slider"></div>
                </div>
                <hr/>
                ${strThematics}
                <hr/>
            </div>
        `;

        const stringToHTML = (str) => {

            var support = function () {
                if (!window.DOMParser) return false;
                var parser = new DOMParser();
                try {
                    parser.parseFromString('x', 'text/html');
                } catch (err) {
                    return false;
                }
                return true;
            };

            // If DOMParser is supported, use it
            if (support()) {
                var parser = new DOMParser();
                var doc = parser.parseFromString(str, 'text/html');
                return doc.body.firstChild;
            }

            // Otherwise, fallback to old-school method
            var dom = document.createElement('div');
            dom.innerHTML = str;
            return dom;

        };

        // transformation du container : String -> DOM
        var container = stringToHTML(tpltContainer.trim());

        if (! container) {
            console.warn();
            return;
        }

        // ajout du shadow DOM
        const shadowContainer = container.attachShadow({ mode: "open" });
        shadowContainer.innerHTML = tpltContainer.trim();

        if (! shadowContainer) {
            console.warn();
            return;
        }

        // ajout du container shadow
        target.appendChild(shadowContainer);
    }

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
}

export default POI;