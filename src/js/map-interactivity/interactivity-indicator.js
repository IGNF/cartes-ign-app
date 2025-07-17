/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Globals from "../globals";
import DOM from "../dom";

import PopupUtils from "../utils/popup-utils";

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
      id: "PLAN.IGN.INTERACTIF$TMS"
    };

    this.shown = null;
    this.hardDisabled = false;

    this.map = map;
    this.id = this.options.id || "PLAN.IGN.INTERACTIF$TMS"; // PII

    this.#listen();

    // Do not clear highlighted feature this time
    this.dontClear = false;

    this.pii = false; // couche PII chargée ?
    this.thematic = false; // couche thematic chargée ?
    this.position = false; // couche en position max ?

    this.piiMinZoom = 15; // zoom mini pour l'interactivité

    this.popup = {
      popup: null
    };

    // Timeouts pour l'animation
    this.timeoutID1 = null;
    this.timeoutID2 = null;
    this.timeoutID3 = null;

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
    Globals.manager.addEventListener("layervisibility", this.onGetLastLayer);

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
    if (!Globals.online) {
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
    if (layer[0] === this.id && layer[1].visibility) {
      this.pii = true;
      this.position = true;
      if (this.hardDisabled) {
        return;
      }
      if (!Globals.online) {
        return;
      }
      if (Math.floor(this.map.getZoom()) >= this.piiMinZoom) {
        this.active();
      } else {
        this.disable();
      }
    } else {
      if (layer[1].base && layer[1].visibility) {
        this.disable();
      } else {
        e.detail.entries.push(layer);
        e.detail.entries.forEach((layer) => {
          if (layer[1].base && layer[1].visibility) {
            this.pii = false;
            if (layer[0] === this.id) {
              this.pii = true;
            }
            this.thematic = false;
            return;
          }
          if (layer[1].interactive && layer[1].visibility && Globals.online) {
            this.thematic = true;
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
    DOM.$interactivityBtn.classList.remove("d-none");
    DOM.$interactivityBtn.classList.remove("noOpacity");
    DOM.$interactivityBtn.classList.remove("textColor");
    DOM.$interactivityBtn.classList.remove("widthOff");
    DOM.$interactivityBtn.classList.remove("backgroundWhite");
    document.getElementById("interactivityBtnText").innerText = "La carte est interactive";
    if (!this.shown) {
      clearTimeout(this.timeoutID1);
      clearTimeout(this.timeoutID2);
      clearTimeout(this.timeoutID3);
      this.timeoutID1 = setTimeout(() => {
        DOM.$interactivityBtn.classList.add("backgroundGreen");
        DOM.$interactivityBtn.classList.add("widthOn");
        this.timeoutID2 = setTimeout(() => {
          DOM.$interactivityBtn.classList.remove("widthOn");
          this.timeoutID3 = setTimeout(() => {
            DOM.$interactivityBtn.classList.remove("backgroundGreen");
          }, 450);
        }, 2000);
      }, 50);
    }
    this.shown = true;
  }

  /**
   * Desactive l'indicateur d'activité
   */
  disable () {
    document.getElementById("interactivityBtnText").innerText = "La carte n'est plus interactive";
    if (!Globals.mapInteractivity) {
      return;
    }
    if (!this.dontClear) {
      Globals.mapInteractivity.clear();
    }
    this.dontClear = false;
    if (this.shown) {
      clearTimeout(this.timeoutID1);
      clearTimeout(this.timeoutID2);
      clearTimeout(this.timeoutID3);
      this.timeoutID1 = setTimeout(() => {
        DOM.$interactivityBtn.classList.add("textColor");
        DOM.$interactivityBtn.classList.add("backgroundWhite");
        DOM.$interactivityBtn.classList.remove("backgroundGreen");
        DOM.$interactivityBtn.classList.add("widthOff");
        DOM.$interactivityBtn.classList.remove("widthOn");
        this.timeoutID2 = setTimeout(() => {
          DOM.$interactivityBtn.classList.remove("widthOff");
          this.timeoutID3 = setTimeout(() => {
            DOM.$interactivityBtn.classList.remove("backgroundWhite");
            DOM.$interactivityBtn.classList.add("noOpacity");
          }, 450);
        }, 2400);
      }, 50);
    }
    this.shown = false;
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
    if (!this.shown) {
      return;
    }
    // on supprime la popup
    PopupUtils.showPopup(
      `
      <div id="interactivityPopup">
          <div class="divPositionTitle">La carte est interactive</div>
          <div class="divPopupClose" onclick="onCloseinteractivityPopup(event)"></div>
          <div class="divPopupContent">
          Cliquez sur le plan IGN ou sur une donnée thématique pour afficher la légende ou des informations détaillées (ex : les caractéristiques d’un bâtiment, la culture d’un champ).
          </div>
      </div>
      `,
      this.map,
      "interactivityPopup",
      "onCloseinteractivityPopup",
      this.popup
    );
  }

}

export default InteractivityIndicator;
