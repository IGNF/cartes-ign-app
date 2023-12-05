import Globals from './globals';
import DOM from './dom';

/**
 * Indicateur d'activité du Plan IGN interactif sur la carte
 */
class Interactivity {

    /**
     * constructeur
     * @param {*} map 
     * @param {*} options 
     */
    constructor(map, options) {
      this.options = options || {
        id: "PLAN.IGN.INTERACTIF$GEOPORTAIL:GPP:TMS"
      };
      
      this.map = map;
      this.id = this.options.id || "PLAN.IGN.INTERACTIF$GEOPORTAIL:GPP:TMS";
      
      this.#listen();
      
      this.actived = false; // actif ?
      this.layer = false; // couche chargée ?
      this.position = false; // en position max ?

      return this;
    }

    /**
     * Ecouteurs sur :
     * - ajout / suppression / position de la couche Plan IGN
     * - zooms > 14
     * - couche au dessus
     */
    #listen() {
      this.onAddLayer = this.onAddLayer.bind(this);
      this.onRemoveLayer = this.onRemoveLayer.bind(this);
      this.onMoveLayer = this.onMoveLayer.bind(this);

      Globals.manager.addEventListener("addlayer", this.onAddLayer);
      Globals.manager.addEventListener("removelayer", this.onRemoveLayer);
      Globals.manager.addEventListener("movelayer", this.onMoveLayer);
      
      this.map.on("zoom", (e) => {
        (this.layer && this.position && Math.round(e.target.getZoom())>14) ? this.active() : this.disable();
      });
    }

    /**
     * callback
     * @param {*} e 
     * @private
     */
    onAddLayer(e) {
      console.debug(e);
      if (e.detail.id === this.id) {
        this.position = true;
        this.layer = true;
        var zoom = Math.round(this.map.getZoom());
        if (zoom > 14) {
          this.active();
        }
      } else {
        // forcement, ce n'est plus la couche au dessus !
        if (this.layer) {
          this.position = false;
          this.disable();
        }
      }
    }
    /**
     * callback
     * @param {*} e 
     * @private
     */
    onRemoveLayer(e) {
      console.debug(e);
      if (e.detail.id === this.id) {
        this.layer = false;
        this.position = false;
        this.disable();
      } else {
        // on a supprimé une couche qqc, est on encore sur la couche au dessus ?
        if (this.layer) {}
      }
    }
    /**
     * callback
     * @param {*} e 
     * @private
     */
    onMoveLayer(e) {
      console.debug(e);
      if (e.detail.id === this.id) {
        this.position = false;
        if (e.detail.positions.new === e.detail.positions.max) {
          this.position = true;
          var zoom = Math.round(this.map.getZoom());
          if (zoom > 14) {
            this.active();
          }
        } else {
          // on n'est plus sur la couche au dessus
          this.disable();
        }
      } else {
        // on a deplacé une couche qqc, est on encore sur la couche au dessus ?
        if (this.layer) {
          if (e.detail.positions.new === e.detail.positions.max) {
            this.position = false;
            this.disable();
          }
        }
      }
    }

    /**
     * Active l'indicateur d'activité
     */
    active () {
      this.actived = true;
      DOM.$interactivityBtn.style["background-color"] = "white";
    }

    /**
     * Desactive l'indicateur d'activité
     */
    disable () {
        this.actived = false;
        DOM.$interactivityBtn.style["background-color"] = "lightgray";
    }

}

export default Interactivity;