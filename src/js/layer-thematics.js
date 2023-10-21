import Globals from './globals';
import LayersConfig from './layer-config';
import LayersAdditional from './layer-additional';

import ImageNotFound from '../html/img/image-not-found.png';

/**
 * Gestion des couches thématiques et fonds de carte
 * @todo ajouter les couches thématiques
 */
class LayerThematics {

  constructor(options) {
    this.options = options || {
      target : null
    };

    // options ?
    this.map = Globals.map
    this.mapRLT = Globals.mapRLT;

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
          <div class="layer-info" layername="${opts.layerName}"></div>
          <div class="layer-legend" layername="${opts.layerName}"></div>
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
        if (el.classList.contains("selectedLayer")) {
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
        if (el.classList.contains("selectedLayer")) {
          this.removeLayer(el.id);
          Globals.dataLayerDisplayed = ""; // FIXME ajouter une liste !
        } else {
          this.addLayer(el.id);
          Globals.dataLayerDisplayed = el.id;
        }
      });
    });
  }

  /**
   * Ajout de la couche de fonds ou de données sur la carte
   * @param {*} layerName 
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
    }
  }

  /**
   * Suppression d'une couche
   * @param {*} layerName 
   */
  removeLayer(layerName) {
    if (!layerName) {
      return;
    }
    var element = document.getElementById(layerName);
    element.classList.remove('selectedLayer');
    this.#setLayerSource(layerName);
  }

  /**
   * Ajout d'une couche pour comparaison
   * @param {*} layerName 
   */
  #addCompareLayer(layerName) {
    // Affiche la couche de fond correspondant à l'id de l'objet baseLayers, 
    // en comparaison si le contrôle de comparaison est activé
    document.querySelectorAll(".baseLayer").forEach(elem => {
      elem.classList.remove('comparedLayer');
    });
    document.getElementById(layerName).classList.add("comparedLayer");
  
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
        map.addLayer(layerStyle);
      } else {
        // le style existe, on le supprime
        map.removeLayer(source);
      }
    }
  }
}

export default LayerThematics;
