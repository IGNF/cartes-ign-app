/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import RouteDrawSaveDOM from "./route-draw-save-dom";
import Globals from "../globals";
import { Toast } from "@capacitor/toast";

/**
 * Interface d'enregistrement d'itinéraire tracé
 * @module RouteDrawSave
 */
class RouteDrawSave {
  /**
     * constructeur
     * @constructs
     * @param {*} map
     * @param {*} options
     */
  constructor (target, options) {
    this.options = options || {
      data: {},
      transport: null,
      name: null,
      id: null,
    };

    // target
    this.target = target;

    this.id = this.options.id || -1;
    this.showedFrom = null;

    // rendu graphique
    this.render();

    this.bindedOnRouteSave = this.#onRouteSave.bind(this);

    return this;
  }

  /**
   * ajout d'ecouteurs pour la saisie interactive
   */
  #listeners() {
    document.getElementById("routeDrawSaveNameInputSubmit").addEventListener("click", this.bindedOnRouteSave);
  }

  #removeListeners() {
    document.getElementById("routeDrawSaveNameInputSubmit").removeEventListener("click", this.bindedOnRouteSave);
  }

  /**
   * gestion du clic sur le bouton d'enregistrement
   */
  #onRouteSave() {
    this.saveToAccount();
    this.hide();
    if (this.showedFrom === "routeDraw") {
      Globals.routeDraw.hide();
    } else if (this.showedFrom === "directions") {
      Globals.directions.results.hide();
      Globals.menu.close("directions");
    }
    Toast.show({
      text: "Itinéraire enregistré dans 'Enregistrés'",
      duration: "long",
      position: "top"
    });
  }

  /**
   * sauvegarde l'itinéraire dans le compte
   */
  saveToAccount() {
    let name = document.getElementById("routeDrawSaveNameInput").value;
    if (name === "") {
      name = `De ${this.options.data.points[0].properties.name} à ${this.options.data.points.slice(-1)[0].properties.name}`;
    }
    this.options.name = name;
    this.options.visible = true;
    Globals.myaccount.addRoute(JSON.parse(JSON.stringify(this.options)));
  }

  /**
     * creation de l'interface
     * @public
     */
  render () {
    var target = this.target || document.getElementById("routeDrawSaveWindow");
    if (!target) {
      console.warn();
      return;
    }
    var container = this.getContainer(this.options.data, this.options.transport, this.options.name);
    if (!container) {
      console.warn();
      return;
    }

    // ajout du container
    target.appendChild(container);
  }

  /**
     * affiche le menu des résultats du calcul
     * @public
     */
  show (showedFrom = "routeDraw") {
    this.showedFrom = showedFrom;
    Globals.menu.open(`${showedFrom}Save`, -1, Globals.backButtonState, "routeDrawSave");
    this.#listeners();
  }

  /**
     * ferme le menu des résultats du calcul
     * @public
     */
  hide () {
    Globals.menu.close(`${this.showedFrom}Save`);
    this.#removeListeners();
  }
}

// mixins
Object.assign(RouteDrawSave.prototype, RouteDrawSaveDOM);

export default RouteDrawSave;
