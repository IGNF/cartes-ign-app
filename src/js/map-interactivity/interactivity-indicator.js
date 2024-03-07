import Globals from "../globals";
import DOM from "../dom";

import MapLibreGL from "maplibre-gl";

const thematicLayerNotInteractive = [
  "GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN",
  "TRANSPORTNETWORKS.RAILWAYS",
  "TRANSPORTNETWORKS.ROADS",
  "ELEVATION.LEVEL0",
  "Aire-Parcellaire",
];

/**
 * Indicateur d'activité du Plan IGN interactif et des couches thématiques sur la carte
 */
class InteractivityIndicator {

  /**
     * constructeur
     * @param {*} map
     * @param {*} options
     */
  constructor(map, options) {
    this.options = options || {
      id: "PLAN.IGN.INTERACTIF$GEOPORTAIL:GPP:TMS"
    };

    this.shown = null;
    this.hardDisabled = false;

    this.map = map;
    this.id = this.options.id || "PLAN.IGN.INTERACTIF$GEOPORTAIL:GPP:TMS"; // PII

    this.#listen();

    // Do not clear highlighted feature this time
    this.dontClear = false;

    this.pii = false; // couche PII chargée ?
    this.thematic = false; // couche thematic chargée ?
    this.position = false; // couche en position max ?

    this.piiMinZoom = 15; // zoom mini pour l'interactivité

    this.popup = null;

    return this;
  }

  /**
     * Ecouteurs sur :
     * - gestion des ajout / suppression / position des couches
     * - si zooms > piiMinZoom actif pour la couche PII
     * - la couche au dessus est elle un baseLayer ?
     */
  #listen() {
    this.onGetLastLayer = this.onGetLastLayer.bind(this);
    Globals.manager.addEventListener("addlayer", this.onGetLastLayer);
    Globals.manager.addEventListener("removelayer", this.onGetLastLayer);
    Globals.manager.addEventListener("movelayer", this.onGetLastLayer);

    this.onZoom = this.onZoom.bind(this);
    this.map.on("zoom", this.onZoom);
  }

  /**
   * callback on map zoom
   * @param {Object} e event
   */
  onZoom(e) {
    if (this.hardDisabled) {
      return;
    }
    if (this.pii && this.position && Math.floor(e.target.getZoom()) >= this.piiMinZoom) {
      this.active();
    } else {
      this.dontClear = true;
      (this.thematic && this.position) ? this.active() : this.disable();
    }
  }

  /**
     * callback
     * @param {*} e
     * @private
     */
  onGetLastLayer(e) {
    if (this.hardDisabled) {
      return;
    }
    var layer = e.detail.entries.pop();
    if (!layer) {
      return;
    }
    this.thematic = this.pii = this.position = false;
    if (layer[0] === this.id) {
      this.pii = true;
      this.position = true;
      if (Math.floor(this.map.getZoom()) >= this.piiMinZoom) {
        this.active();
      } else {
        this.disable();
      }
    } else {
      if (layer[1].base) {
        this.disable();
      } else {
        e.detail.entries.push(layer);
        e.detail.entries.forEach((layer) => {
          if (layer[1].base) {
            if (layer[0] === this.id) {
              this.pii = true;
            }
            this.thematic = false;
            return;
          }
          if (!thematicLayerNotInteractive.includes(layer[0].split("$")[0])) {
            this.thematic = true;
            this.pii = false;
          }
        });
        this.position = true;
        if (this.thematic || this.pii && Math.floor(this.map.getZoom()) >= this.piiMinZoom) {
          this.active();
        } else {
          this.disable();
        }
      }
    }
  }

  /**
     * Active l'indicateur d'activité
     */
  active () {
    this.hardDisabled = false;
    this.shown = true;
    DOM.$interactivityBtn.classList.remove("d-none");
  }

  /**
     * Desactive l'indicateur d'activité
     * @param {boolean} hard l'interactivité reste désactivée tant qu'active() n'est pas appelée
     */
  disable () {
    if (!Globals.mapInteractivity) {
      return;
    }
    if (!this.dontClear) {
      Globals.mapInteractivity.clear();
    }
    this.dontClear = false;
    this.shown = false;
    DOM.$interactivityBtn.classList.add("d-none");
  }

  /**
     * Desactive l'indicateur d'activité jusqu'à nouvel ordre
     */
  hardDisable() {
    this.hardDisabled = true;
    this.disable();
  }

  /**
     * Réactive l'indicateur après désactivation forcée
     */
  enable() {
    this.hardDisabled = false;
    this.map.fire("zoom");
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
    window.onCloseinteractivityPopup = () => {
      self.popup.remove();
    };

    // centre de la carte
    var center = this.map.getCenter();
    // position de la popup
    var popupOffsets = {
      "bottom": [0, 100],
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

export default InteractivityIndicator;
