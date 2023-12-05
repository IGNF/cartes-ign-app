import Globals from './globals';
import DOM from './dom';

/**
 * Indicateur d'activité du Plan IGN interactif et des couches thématiques sur la carte
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
      this.id = this.options.id || "PLAN.IGN.INTERACTIF$GEOPORTAIL:GPP:TMS"; // PII
      
      this.#listen();
      
      this.pii = false; // couche PII chargée ?
      this.thematic = false; // couche thematic chargée ?
      this.position = false; // couche en position max ?

      return this;
    }

    /**
     * Ecouteurs sur :
     * - gestion des ajout / suppression / position des couches
     * - si zooms > 14 actif pour la couche PII
     * - la couche au dessus est elle un baseLayer ?
     */
    #listen() {
      this.onGetLastLayer = this.onGetLastLayer.bind(this);
      Globals.manager.addEventListener("addlayer", this.onGetLastLayer);
      Globals.manager.addEventListener("removelayer", this.onGetLastLayer);
      Globals.manager.addEventListener("movelayer", this.onGetLastLayer);
      
      this.map.on("zoom", (e) => {
        if (this.pii && this.position && Math.round(e.target.getZoom())>14) {
          this.active();
        } else {
          (this.thematic && this.position) ? this.active() : this.disable();
        }
      });
    }

    /**
     * callback
     * @param {*} e 
     * @private
     */
    onGetLastLayer(e) {
      var layer = e.detail.entries.pop();
      this.thematic = this.pii = this.position = false;
      if (layer[0] === this.id) {
        this.pii = true;
        this.position = true;
        if (Math.round(this.map.getZoom())>14) {
          this.active();
        }
      } else {
        if (layer[1].base) {
          this.disable();
        } else {
          this.thematic = true;
          this.position = true;
          this.active();
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