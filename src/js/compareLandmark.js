/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Globals from "./globals";

import { Toast } from "@capacitor/toast";

/**
 * Interface sur le contrôle point de repère RLT
 * @module compareLandmark
 */
class compareLandmark {
  /**
   * constructeur
   * @constructs
   * @param {*} map
   * @param {*} options
   */
  constructor(map, options) {
    this.options = options || {
      target: null,
    };
    this.target = this.options.target || document.getElementById("compareLandmarkWindow");

    this.map = map;

    this.data = {
      title: null,
      description: null,
      location: null,
      color: null,
    };

    // ID du point de repère s'il s'agit d'une modification d'un point de repère existant
    this.compareLandmarkId = null;

    this.#render();
    this.#listeners();
    return this;
  }

  /**
   * Récupération du dom
   */
  #render() {
    if (!this.target) {
      console.warn();
      return;
    }
    this.dom = {
      title: this.target.querySelector("#compareLandmark-title"),
      description: this.target.querySelector("#compareLandmark-description"),
      radioColors: this.target.querySelectorAll("[name='compareLandmark-color']"),
      submitButton: this.target.querySelector(".compareLandmark-submit"),
    };
  }

  /**
   * Ajout des listeners
   */
  #listeners() {
    this.dom.submitButton.addEventListener("click", () => {
      const color = Array.from(this.dom.radioColors).filter((el) => el.checked)[0].value;
      this.data = {
        title: this.dom.title.value,
        description: this.dom.description.value,
        location: [this.map.getCenter().lng, this.map.getCenter().lat],
        zoom: this.map.getZoom(),
        color: color,
      };
      if (!this.data.location || !this.data.title) {
        Toast.show({
          text: "Donnez un titre à votre point de repère",
          duration: "long",
          position: "bottom"
        });
        return;
      }
      const compareLandmarkJson = this.#generateGeoJson();
      console.log(compareLandmarkJson);
      // Globals.myaccount.addCompareLandmark(JSON.parse(JSON.stringify(compareLandmarkJson)));
      Toast.show({
        text: "Point de repère enregistré dans 'Enregistrés'",
        duration: "long",
        position: "top"
      });
      this.hide();
    });
  }

  /**
   * génère le geojson correspondant aux données
   * @returns geojson
   */
  #generateGeoJson() {
    let id = -1;
    if (this.compareLandmarkId !== null && this.compareLandmarkId >= 0) {
      id = this.compareLandmarkId;
    }
    return {
      type: "Feature",
      id: id,
      geometry: {
        type: "Point",
        coordinates: this.data.location,
      },
      properties: {
        title: this.data.title,
        description: this.data.description,
        zoom: this.data.zoom,
        color: this.data.color,
        visible: true,
      }
    };
  }

  setData(data) {
    this.data = data;
    this.dom.title.value = this.data.title;
    this.dom.description.value = this.data.description;
    Array.from(this.dom.radioColors).filter((el) => el.value == data.color)[0].checked = true;
  }

  /**
   * Paramétrage de l'id
   * @param {number} id
   * @public
   */
  setId(id) {
    this.compareLandmarkId = id;
    document.getElementById("compareLandmarkWindowTitle").innerText = "Modifier un point de repère";
  }

  /**
   * Ferme la fenêtre
   * @public
   */
  hide() {
    Globals.menu.close("compareLandmark");
  }

  /**
   * Ferme la fenêtre
   * @public
   */
  show() {
    Globals.menu.open("compareLandmark");
  }

  /**
   * clean du formulaire
   * @public
   */
  clear() {
    this.dom.title.value = "";
    this.dom.description.value = "";
    this.data = {
      title: null,
      description: null,
      location: null,
      color: null,
    };
    this.landmarkId = null;
    document.getElementById("compareLandmarkWindowTitle").innerText = "Créer un point de repère Comparer";
  }
}

export default compareLandmark;
