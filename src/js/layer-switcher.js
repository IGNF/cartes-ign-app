import Globals from './globals';

/**
 * Gestionnaire de couches
 * @todo ...
 */
class LayerSwitcher {

    constructor(options) {
      this.options = options || {
        target : null
      };
  
      this.target = this.options.target || document.getElementById("layer-switcher");
      this.map = Globals.map
  
      this.#render();
      this.#listeners();
    }
  
    /**
     * Rendu
     */
    #render() {
  
    }
  
    /**
     * Ecouteurs
     */
    #listeners() {
    
    }

    #addLayerContainer(id, options) {
      // Template d'une couche
      var template = `
      <div id="container_ID_${options.index}">
        <div id="cross-picto_ID_${options.index}"></div>
        <div id="basic-tools_ID_${options.index}">
          <div id="thumbnail_ID_${options.index}">
            <img class="" src="${options.thumbnail}"/>
          </div>
          <div class="wrap-tools-layers">
            <span id="title_ID_${options.index}"></span>
            <div id="opacity-range-div_ID_${options.index}" class="tools-layer-opacity">
              <!-- before:: & after:: 0% / 100% -->
              <input id="opacity-value-range_ID_${options.index}" type="range">
            </div>
            <div id="opacity-middle-div_ID_${options.index}" class="tools-layer-opacity">
              <span id="opacity-value-middle_ID_${options.index}">${options.opacity}%</span>
            </div>
          </div>
        </div>
        <input type="checkbox" id="show-advanced-tools_ID_${options.index}" />
        <label id="show-advanced-tools-picto_ID_${options.index}" for="show-advanced-tools_ID_${options.index}" title="Plus d'outils" class="tools-layer-advanced"></label>
        <div id="advanced-tools_ID_${options.index}">
          <!-- N&B, visibility, info, remove -->
          <input type="checkbox" id="color_ID_${options.index}" checked=${options.color}/>
          <label id="color-picto_ID_${index}" for="color_ID_${options.index}" title="Couleur/NB" class="tools-layer-color"></label>
          <input type="checkbox" id="visibility_ID_${options.index}" checked=${options.visibility}/>
          <label id="visibility-picto_ID_${options.index}" for="visibility_ID_${options.index}" title="Afficher/masquer la couche" class="tools-layer-visibility"></label>
          <div id="info_ID_${options.index}" class="tools-layer-info" title="Informations de la couche"></div>
          <div id="remove_ID_${options.index}" class="tools-layer-remove" title="Supprimer la couche"></div>
        </div>
      </div>
      `;
    }

    #removeLayerContainer(id) {}

    /**
     * Ajout d'une couche dans le gestionnaire
     * @param {*} id 
     * @param {*} options 
     */
    addLayer(id, options) {
      this.#addLayerContainer(id);
    }

    /**
     * Supprime une couche du gestionnaire
     * @param {*} id 
     */
    removeLayer(id) {
      this.#removeLayerContainer(id);
    }

}

export default LayerSwitcher;