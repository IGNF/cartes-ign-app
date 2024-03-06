import LayersConfig from "./layer-manager/layer-config";
import LayersGroup from "./layer-manager/layer-group";

import PoiConfig from "./data-layer/poi-osm-layer-config.json";
import DomUtils from "./utils/dom-utils";
import Globals from "./globals";

/**
 * Contrôle sur le filtrage attributaire des POI osm
 * @description
 * La couche est active par defaut, les filtres de selections sont ajoutés et la visibilité est
 * désactivée par defaut.
 * @todo classe utilitaire pour le vectorTile !
 */
class POI {
  /**
   * constructeur
   * @param {*} map
   * @param {*} options
   * @returns
   */
  constructor(map, options) {
    this.options = options || {
      target: document.getElementById("poiWindow"),
      id: "OSM.POI$GEOPORTAIL:GPP:TMS"
    };

    this.opened = false;

    this.map = map;

    this.filters = null;
    this.config = PoiConfig;
    this.sources = [];

    this.target = this.options.target || document.getElementById("poiWindow");
    this.id = this.options.id || "OSM.POI$GEOPORTAIL:GPP:TMS";
    this.style = {};
    this.sprite = {
      url: null,
      size: {
        w: null,
        h: null
      },
      json: {}
    };

    this.#render();
    this.#listeners();

    return this;
  }

  /**
   * chargement de la couche
   * @public
   */
  async load() {
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
            if (!this.map.getStyle().sources[key]) {
              this.map.addSource(key, source);
              this.sources.push(source);
            }
          }
        }
        return data;
      })
      .then((data) => {
        // les sprites et les glyphs sont uniques sinon exceptions !
        // mais, normalement, on ajoute que des couches IGN, on mutualise sur ces informations.
        this.style = data;
        if (!data.sprite.startsWith("http")) {
          if (!document.URL.endsWith("/") && !data.sprite.startsWith("/")) {
            data.sprite = "/" + data.sprite;
          }
          data.sprite = document.URL + data.sprite;
        }
        this.map.setSprite(data.sprite);
        this.map.setGlyphs(data.glyphs);
        this.#loadSprite(data.sprite);
        return data;
      })
      .then((data) => {
        this.filters = this.#createFilters(data.layers);
        LayersGroup.addGroup(this.id, this.filters);
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
      for (let j = 0; j < this.config.length; j++) {
        const poi = this.config[j];
        var layer = Object.assign({}, l); // clone
        layer.id = poi.id + " - " + layer.id;
        if (layer.filter) {
          layer.filter = ["all", layer.filter, [
            "in",
            poi.filters[0].field,
            poi.filters[0].attributs
          ].flat()];
        } else {
          layer.filter = [
            "in",
            poi.filters[0].field,
            poi.filters[0].attributs
          ].flat();
        }
        if (layer.layout.visibility === "visible") {
          layer.layout.visibility = (poi.visible) ? "visible" : "none";
        }
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
    if (!this.target) {
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
            <label class="lblPOIFilterItem chkContainer" for="${values.id}-POIFilterItem" title="${values.name}">
                ${values.name}
                <input id="${values.id}-POIFilterItem"
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
    for (let i = 0; i < this.config.length; i++) {
      var item = this.config[i];
      strPOIThematics += tplPOIThematics({
        id: item.id,
        name: item.name,
        visible: item.visible // TODO
      });
    }

    let rltChecked = "";
    // Chargement de la position précédente
    if (localStorage.getItem("poirltChecked")) {
      rltChecked = localStorage.getItem("poirltChecked");
    }

    var tpltContainer = `
            <div class="divPOIContainer">
                <span class="spanPOITitle">Points d'interêts</span>
                <div class="divPOIDisplay">
                  <span>Afficher les POI</span>
                  <label class="toggleSwitch">
                    <input id="displayPOI" class="toggleInput" type="checkbox" checked>
                    <span class="toggleSlider"></span>
                  </label>
                </div>
                <div class="divPOIFilterItems">
                    ${strPOIThematics}
                </div>
                <div class="divPOIDisplayGoBackTime">
                  <span>POI remonter le temps</span>
                  <label class="toggleSwitch">
                    <input id="displayPOIGoBackTime" class="toggleInput" type="checkbox" ${rltChecked}>
                    <span class="toggleSlider"></span>
                  </label>
                </div>
            </div>
        `;

    // transformation du container : String -> DOM
    var container = DomUtils.stringToHTML(tpltContainer.trim());

    if (!container) {
      console.warn();
      return;
    }

    // ajout du shadow DOM
    const shadowContainer = container.attachShadow({ mode: "open" });
    shadowContainer.innerHTML = tpltContainer.trim();

    if (!shadowContainer) {
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
      const toggleChecked = e.target.checked;
      document.querySelectorAll(".inputPOIFilterItem").forEach((el) => {
        if (toggleChecked) {
          el.checked = true;
        } else {
          el.checked = false;
        }
        el.dispatchEvent(new Event("change"));
        if (el.checked) {
          var layers = LayersGroup.getGroupLayers(this.id).filter((layer) => { return layer.metadata.thematic === el.name; });
          for (let i = 0; i < layers.length; i++) {
            const element = layers[i];
            LayersGroup.addVisibilityByID(this.id, element.id, true);
          }
        }
      });
    });
    document.getElementById("displayPOIGoBackTime").addEventListener("change", (e) => {
      if (e.target.checked) {
        Globals.comparePoi.showPoints();
        localStorage.setItem("poirltChecked", "checked");
        this.map.flyTo({zoom: 4, center: [2.0, 47.33]})
      } else {
        Globals.comparePoi.hidePoints();
        localStorage.setItem("poirltChecked", "");
      }
    });
    // rendre visible ou non le filtre si la couche POI est active sinon rien à faire
    document.querySelectorAll(".inputPOIFilterItem").forEach((el) => {
      el.addEventListener("change", (e) => {
        var layers = LayersGroup.getGroupLayers(this.id).filter((layer) => { return layer.metadata.thematic === e.target.name; });
        for (let i = 0; i < layers.length; i++) {
          const element = layers[i];
          LayersGroup.addVisibilityByID(this.id, element.id, e.target.checked);
        }
        let allUnchecked = true;
        let allChecked = true;
        document.querySelectorAll(".inputPOIFilterItem").forEach((el) => {
          if (el.checked) {
            allUnchecked = false;
          } else {
            allChecked = false;
          }
        });
        if (allChecked) {
          document.getElementById("displayPOI").checked = true;
        }
        if (allUnchecked) {
          document.getElementById("displayPOI").checked = false;
        }
      });
    });
  }

  /**
     * Sauvegarde les informations du sprite pour la génération de légende
     */
  #loadSprite(url) {
    this.sprite.url = url;
    fetch(this.sprite.url + ".json",)
      .then(res => {return res.json();})
      .then(json => {
        this.sprite.json = json;
      })
      .catch((e) => {
        throw new Error(e);
      });

    let theImage = new Image();
    theImage.src = this.sprite.url + ".png";
    theImage.decode()
      .then(() => {
        this.sprite.size.h = theImage.height;
        this.sprite.size.w = theImage.width;
      })
      .catch((e) => {
        throw new Error(e);
      });
  }

  /**
     * Get POI sprite info
     */
  getSprite() {
    return this.sprite;
  }

  /**
     * Get POI style
     */
  getStyle() {
    return this.style;
  }

  /**
     * Get POI feature fill pattern
     */
  getFeatureFillPattern(f) {
    var symbol = f.layout["icon-image"];
    let toReplace = symbol.match(/{.*}/g);
    if (toReplace.length > 0) {
      symbol = symbol.replace(/{.*}/g, f.properties.symbo);
    }
    return symbol;
  }

  /**
   * ouvre l'interface
   * @public
   */
  show() {
    this.opened = true;
  }

  /**
   * ferme l'interface
   * @public
   */
  hide() {
    this.opened = false;
  }
}

export default POI;
