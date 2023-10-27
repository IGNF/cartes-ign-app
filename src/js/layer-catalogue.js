import Globals from './globals';
import DOM from './dom';
import LayersConfig from './layer-config';
import LayersAdditional from './layer-additional';

import ImageNotFound from '../html/img/image-not-found.png';

/**
 * Gestion des couches thématiques et fonds de carte
 * @fires addlayer
 * @fires removelayer 
 * @todo ajouter les couches thématiques
 */
class LayerCatalogue {

  /**
   * constructeur
   * @param {*} options 
   * @param {*} options.target  
   */
  constructor(options) {
    this.options = options || {
      target : null
    };

    // options ?
    this.map = Globals.map
    this.mapRLT = Globals.mapRLT;

    /**
     * Interface pour les evenements
     * @example
     * event.dispatchEvent(new CustomEvent("myEvent", { detail : {} }));
     * event.addEventListener("myEvent", handler);
     */
    this.event = new EventTarget();

    this.#render();
    this.#listeners();
  }

  /**
   * Rendu
   */
  #render() {
    var target = this.options.target || document.getElementById("layer-thematics");
    if (!target) {
      console.warn();
      return;
    }

    const tplLayer = (opts) => {
      return `
      <div class="layer ${opts.type}" id="${opts.layerID}">
        <div class="layerImg">
          <img src="${opts.layerQuickLook}" alt="${opts.layerName}" onerror="this.onerror=null;this.src='${ImageNotFound}'" />
          <div class="layer-info" layername="${opts.layerID}"></div>
          <div class="layer-legend" layername="${opts.layerID}"></div>
        </div>
        <div id="${opts.layerName}" class="textCouche">${opts.layerTitle}</div>
      </div>
      `;
    }

    var strBaseLayers = "";
    var baseLayers = LayersConfig.getBaseLayers();
    for(let i = 0; i < baseLayers.length; i++) {
      var props = LayersConfig.getLayerProps(baseLayers[i]);
      strBaseLayers += tplLayer({
        type : "baseLayer",
        layerID : baseLayers[i],
        layerName : props.layer,
        layerQuickLook : LayersAdditional.getQuickLookUrl(props.layer),
        layerTitle : props.title
      });
    }

    var strDataLayers = "";
    var dataLayers = LayersConfig.getDataLayers();
    for(let j = 0; j < dataLayers.length; j++) {
      var props = LayersConfig.getLayerProps(dataLayers[j]);
      strDataLayers += tplLayer({
        type : "dataLayer",
        layerID : dataLayers[j],
        layerName : props.layer,
        layerQuickLook : LayersAdditional.getQuickLookUrl(props.layer),
        layerTitle : props.title
      });
    }
    
    var template = `
    <div class="layer-thematics">
      <h4 id="baseLayersLabel">Fonds de carte</h4>
      <div class="subCatMenu" id="baseLayers">
        ${strBaseLayers}
      </div>
      <h4 id="dataLayersLabel">Autres données</h4>
      <div class="subCatMenu" id="dataLayers">
        ${strDataLayers}
      </div>
      <h4 id="thematicLayersLabel">Données thématiques</h4>
      <div class="subCatMenu" id="thematicLayers">
        <!-- TODO -->
      </div>
    </div>`;

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
    var container = stringToHTML(template.trim());

    if (!container) {
      console.warn();
      return;
    }

    target.appendChild(container);
  }

  /**
   * Ecouteurs
   */
  #listeners() {
    // clic sur une couche de fonds
    document.querySelectorAll(".baseLayer").forEach((el) => {
      el.addEventListener('click', (e) => {
        if (el.classList.contains("selectedLayer") || el.classList.contains("comparedLayer")) {
          this.removeLayer(el.id);
          Globals.baseLayerDisplayed = ""; // FIXME ajouter une liste !
        } else {
          this.addLayer(el.id);
          Globals.baseLayerDisplayed = el.id;
        }
      });
    });
    // clic sur une couche de données
    document.querySelectorAll(".dataLayer").forEach((el) => {
      el.addEventListener('click', (e) => {
        if (el.classList.contains("selectedLayer") || el.classList.contains("comparedLayer")) {
          this.removeLayer(el.id);
          Globals.dataLayerDisplayed = ""; // FIXME ajouter une liste !
        } else {
          this.addLayer(el.id);
          Globals.dataLayerDisplayed = el.id;
        }
      });
    });
    // clic sur la puce d'information
    document.querySelectorAll(".layer-info").forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        var p = LayersConfig.getLayerProps(el.getAttribute("layername"));
        DOM.$infoText.innerHTML = p.desc;
        Globals.menu.open("info");
      });
    });
    // clic sur la puce de legende
    document.querySelectorAll(".layer-legend").forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        DOM.$legendImg.src = LayersAdditional.getLegend(el.getAttribute("layername").split("$")[0]);
        Globals.menu.open("legend");
      });
    });
  }

  /**
   * Ajout de la couche de fonds ou de données sur la carte
   * @param {*} layerName 
   * @fires addlayer
   * @public
   */
  addLayer(layerName) {
    if (!layerName) {
      return;
    }
    if (Globals.mapState === "compare") {
      this.#addCompareLayer(layerName);
    } else {
      var element = document.getElementById(layerName);
      element.classList.add("selectedLayer");
      this.#setLayerSource(layerName);

      /**
       * Evenement "addlayer"
       * @event addlayer
       * @type {*}
       * @property {*} id - 
       */
      this.event.dispatchEvent(
        new CustomEvent("addlayer", {
          bubbles: true,
          detail: {
            id : layerName
          }
        })
      );
    }
  }

  /**
   * Suppression d'une couche
   * @param {*} layerName 
   * @fires removelayer
   * @public
   */
  removeLayer(layerName) {
    if (!layerName) {
      return;
    }
    if (Globals.mapState === "compare") {
      this.#removeCompareLayer(layerName);
    } else {
      var element = document.getElementById(layerName);
      element.classList.remove('selectedLayer');
      this.#setLayerSource(layerName);

      /**
       * Evenement "removelayer"
       * @event removelayer
       * @type {*}
       * @property {*} id - 
       */
      this.event.dispatchEvent(
        new CustomEvent("removelayer", {
          bubbles: true,
          detail: {
            id : layerName
          }
        })
      );
    }
  }

  /**
   * Ajout d'une couche pour comparaison
   * @param {*} layerName 
   */
  #addCompareLayer(layerName) {
    // on supprime la couche précédemment ajoutée car sur l'outil de comparaison
    // on est l'affichage d'une seule couche à la fois !
    document.querySelectorAll(".baseLayer").forEach(elem => {
      if (elem.classList.contains('comparedLayer')) {
        elem.classList.remove('comparedLayer');
        this.#removeCompareLayer(elem.id);
      }
    });
    document.getElementById(layerName).classList.add("comparedLayer");
    this.#setLayerSource(layerName, "mapRLT");
  }

  /**
   * Supprime la couche de comparaison
   * @param {*} layerName 
   */
  #removeCompareLayer(layerName) {
    document.querySelectorAll(".baseLayer").forEach(elem => {
      elem.classList.remove('comparedLayer');
    });
    this.#setLayerSource(layerName, "mapRLT");
  }

  /**
   * ...
   * @param {*} source - nom de la source === nom de la couche
   * @param {*} glMap - map | mapRLT
   */
  #setLayerSource (source, glMap="map") {
    var map = (glMap === "map") ? this.map : (glMap === "mapRLT") ? this.mapRLT : null;

    let allLayersStyle = map.getStyle().layers;
    var layerIndex = allLayersStyle.findIndex((l) => l.id === source);
    var layerStyle = allLayersStyle[layerIndex] || null;
    
    if (source) {
      if (layerIndex === -1) {
        // le style n'existe pas, on ajoute donc le nouveau style de type raster
        layerStyle = {
          id : source,
          source : source,
          type : "raster"
        };
        // HACK 
        // on positionne toujours le style avant ceux du calcul d'itineraires (directions)
        // afin que le calcul soit toujours la couche visible du dessus !
        var layerIndexBefore = allLayersStyle.findIndex((l) => l.source === "maplibre-gl-directions");
        var layerIdBefore = (layerIndexBefore !== -1) ? allLayersStyle[layerIndexBefore].id : null;
        map.addLayer(layerStyle, layerIdBefore);
      } else {
        // le style existe, on le supprime
        map.removeLayer(source);
      }
    }
  }
}

export default LayerCatalogue;