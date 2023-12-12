import Globals from './globals';
import DOM from './dom';

import MapLibreGL from "maplibre-gl";

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

      this.popup = null;

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
        if (this.pii && this.position && Math.round(e.target.getZoom()) > 10) {
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
      if (!layer) {
        return;
      }
      this.thematic = this.pii = this.position = false;
      if (layer[0] === this.id) {
        this.pii = true;
        this.position = true;
        if (Math.round(this.map.getZoom())>14) {
          this.active();
        } else {
          this.disable();
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
      DOM.$interactivityBtn.style.removeProperty("display");
    }

    /**
     * Desactive l'indicateur d'activité
     */
    disable () {
        this.actived = false;
        DOM.$interactivityBtn.style.display = "none";
    }

    /**
     * affiche la popup explicative
     * @public
     */
    showPopup() {
      // on supprime la popup
      if (this.popup) {
          this.popup.remove();
          this.popup = null;
      }

      // template litteral
      const popupContent = `
      <div id="interactivityPopup">
          <div class="divPositionTitle">La carte est interactive</div>
          <div class="divPopupClose" onclick="onCloseinteractivityPopup(event)"></div>
          <div class="divPopupContent">
              La carte est actuellement interactive<br/>
              • Le clic sur le Plan IGN fournit des informations sur la légende et les propriétés des objets.<br/>
              • Le clic sur une donnée thématique fournit des informations sur la légende.
          </div>
      </div>
      `;
      var self = this;
      window.onCloseinteractivityPopup = (e) => {
          self.popup.remove();
      }

      // centre de la carte
      var center = this.map.getCenter();
      // position de la popup
      let markerHeight = 0, markerRadius = 10, linearOffset = 25;
      var popupOffsets = {
          'top': [0, 0],
          'top-left': [0, 0],
          'top-right': [0, 0],
          'bottom': [0, -markerHeight],
          'bottom-left': [linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
          'bottom-right': [-linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
          'left': [markerRadius, (markerHeight - markerRadius) * -1],
          'right': [-markerRadius, (markerHeight - markerRadius) * -1]
      };
      // ouverture d'une popup
      this.popup = new MapLibreGL.Popup({
          offset: popupOffsets,
          className: "interactivityPopup",
          closeOnClick: true,
          closeOnMove: true,
          closeButton: false
      })
      .setLngLat(center)
      .setHTML(popupContent)
      .setMaxWidth("300px")
      .addTo(this.map);
  }

}

export default Interactivity;