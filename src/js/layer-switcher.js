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
}

export default LayerSwitcher;