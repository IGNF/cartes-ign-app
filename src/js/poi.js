import maplibregl from "maplibre-gl";

import LayersConfig from './layer-config';
import LayersGroup from './layer-group';

import PoiConfig from './data-layer/poi-osm-layer-config.json';

/**
 * Contrôle sur le filtrage attributaire des POI osm
 * @description
 * La couche est active par defaut, les filtres de selections sont ajoutés et la visibilité est
 * désactivée par defaut.
 * @todo les POI "remonter le temps"
 * @todo interactions avec les autres composants (ex. isochrone)
 * @todo classe utilitaire pour le vectorTile !
 */
class POI {
    /**
     * constructeur
     * @param {*} options
     * @returns
     */
    constructor(map, options) {
        this.options = options || {
            target: document.getElementById("poiWindow"),
            id: "OSM.POI$GEOPORTAIL:GPP:TMS"
        };

        this.opened = false;

        /**
         * Couche POI active
         */
        this.actived = true;

        this.map = map;

        this.target = this.options.target || document.getElementById("poiWindow");
        this.id = this.options.id || "OSM.POI$GEOPORTAIL:GPP:TMS";

        this.#render();
        this.#listeners();
        this.#loadLayer();

        return this;
    }

    /**
     * chargement de la couche
     */
    async #loadLayer() {
        var props = LayersConfig.getLayerProps(this.id);
        var style = props.style; // url !

        return fetch(style)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          // INFO
          // on ajoute les sources !
          // les sources des couches tuiles vectorielles ne sont pas pré chargées 
          // car on les connait que maintenant en lisant le fichier de style.
          // l'id des source est different du nom de la couche pour le vecteur !
          for (const key in data.sources) {
            if (Object.hasOwnProperty.call(data.sources, key)) {
              const source = data.sources[key];
              // on ne peut pas ajouter la même source !
              if (! this.map.getStyle().sources[key]) {
                this.map.addSource(key, source);
              }
            }
          }
          return data;
        })
        .then((data) => {
          // les sprites et les glyphs sont uniques sinon exceptions !
          // mais, normalement, on ajoute que des couches IGN, on mutualise sur ces informations.
          if (!data.sprite.startsWith("http")) {
            data.sprite = document.URL + data.sprite;
          }
          this.map.setSprite(data.sprite);
          this.map.setGlyphs(data.glyphs);
          return data;
        })
        .then((data) => {
          var layers = this.#createFilters(data.layers);
          LayersGroup.addGroup(this.id, layers);
        })
        .catch((e) => {
          throw new Error(e);
        });
    }

    /**
     * creation des filtres de sélections dans les styles
     * @param {*} layers 
     * @returns
     */
    #createFilters(layers) {
        var layersDisplay = layers;
        var layersSelection = [];
        for (let i = 0; i < layersDisplay.length; i++) {
            const l = layersDisplay[i];
            for (let j = 0; j < PoiConfig.length; j++) {
                const poi = PoiConfig[j];
                var layer = Object.assign({}, l); // clone
                layer.id = poi.id + " - " + layer.id;
                layer.filter = [
                    "in", 
                    poi.filters[0].field, 
                    poi.filters[0].attributs
                ].flat();
                layer.layout.visibility = (poi.visible) ? "visible" : "none";
                layer.metadata = {
                    thematic: poi.id
                };
                layersSelection.push(layer);
            }   
        }
        return layersSelection;
    }

    /**
     * creation de l'interface
     */
    #render() {
        if (! this.target) {
            console.warn();
            return;
        }

        // on évite les ID sur le DOM  afin de pouvoir multiplier ce code dans d'autres composants
        const tplPOIThematics = (values) => {
            var checked = null;
            if (values.visible) {
                checked = "checked";
            }
            return `
            <label class="lblPOIFilterItem chkContainer" /* for="${values.id}-POIFilterItem" */ title="${values.name}">
                ${values.name}
                <input /* id="${values.id}-POIFilterItem" */ 
                    class="inputPOIFilterItem checkbox" 
                    type="checkbox" 
                    name="${values.id}" 
                    value="${values.id}"
                    ${checked}
                    >
                <span class="checkmark"></span>
            </label>
            `;
        };

        var strPOIThematics = "";
        for(let i = 0; i < PoiConfig.length; i++) {
            var item = PoiConfig[i];
            strPOIThematics += tplPOIThematics({
                id : item.id,
                name : item.name,
                visible : item.visible // TODO
            });
        }

        var tpltContainer = `
            <div class="divPOIContainer">
                <span class="spanPOITitle">Point d'interêt</span>
                <div class="divPOIDisplay">
                  <span>Afficher les POI</span>
                  <label class="toggleSwitch">
                    <input id="displayPOI" class="toggleInput" type="checkbox" checked>
                    <span class="toggleSlider"></span>
                  </label>
                </div>
                <hr/>
                <div class="divPOIFilterItems">
                    ${strPOIThematics}
                </div>
                <hr/>
                <div class="divPOIDisplayGoBackTime">
                  <span>POI remonter le temps</span>
                  <label class="toggleSwitch">
                    <input id="displayPOIGoBackTime" class="toggleInput" type="checkbox">
                    <span class="toggleSlider"></span>
                  </label>
                </div>
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
        this.target.appendChild(shadowContainer);
    }

    /**
     * ajout d'ecouteurs
     */
    #listeners() {
        // rendre la couche POI active en affichant ou non tous les filtres sélectionnés
        document.getElementById("displayPOI").addEventListener("change", (e) => {
            this.actived = e.target.checked;
            document.querySelectorAll(".inputPOIFilterItem").forEach((el) => {
                if (el.checked) {
                    var layers = LayersGroup.getGroupLayers(this.id).filter((layer) => { return layer.metadata.thematic === el.name });
                    for (let i = 0; i < layers.length; i++) {
                        const element = layers[i];
                        LayersGroup.addVisibilityByID(this.id, element.id, this.actived);
                    }
                }
            });
        });
        // TODO rendre visible ou non tous les filtres
        document.getElementById("displayPOIGoBackTime").addEventListener("change", (e) => {
            console.debug(e);
        });
        // rendre visible ou non le filtre si la couche POI est active sinon rien à faire
        document.querySelectorAll(".inputPOIFilterItem").forEach((el) => {
            el.addEventListener("change", (e) => {
                if (!this.actived) {
                    return;
                }
                var layers = LayersGroup.getGroupLayers(this.id).filter((layer) => { return layer.metadata.thematic === e.target.name });
                for (let i = 0; i < layers.length; i++) {
                    const element = layers[i];
                    LayersGroup.addVisibilityByID(this.id, element.id, e.target.checked);
                }
            });
        });
    }

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