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
  constructor(map1, map2, options) {
    this.options = options || {
      target: null,
    };
    this.target = this.options.target || document.getElementById("compareLandmarkWindow");

    this.map1 = map1;
    this.map2 = map2;
    this.location = null;

    this.data = {
      title: null,
      description: null,
      location: null,
      zoom: null,
      color: null,
      icon: null,
      layer1: null,
      layer2: null,
      mode: null,
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
      changePosition: this.target.querySelector("#move-compare-landmark-btn"),
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
    const checkFormValidity = () => {
      if (this.dom.title.value) {
        this.dom.submitButton.classList.remove("disabled");
      } else {
        this.dom.submitButton.classList.add("disabled");
      }
    };
    this.dom.title.addEventListener("input", checkFormValidity);

    this.dom.changePosition.addEventListener("click", () => {
      Globals.menu.open("selectOnMapCompareLandmark");
    });

    this.dom.submitButton.addEventListener("click", () => {
      const color = Array.from(this.dom.radioColors).filter((el) => el.checked)[0].value;
      let compareMode = "vSlider";
      if (document.getElementById("compareUpDown").classList.contains("selected")) {
        compareMode = "hSlider";
      } else if (document.getElementById("compareFade").classList.contains("selected")) {
        compareMode = "fade";
      }
      this.data = {
        title: this.dom.title.value,
        description: this.dom.description.value,
        location: this.location,
        zoom: this.map1.getZoom(),
        color: color,
        icon: `compare-landmark-${color}`,
        layer1: this.map1.getLayer("maplayer").source.split("$")[0],
        layer2: this.map2.getLayer("maplayer").source.split("$")[0],
        mode: compareMode,
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
      Globals.myaccount.addCompareLandmark(JSON.parse(JSON.stringify(compareLandmarkJson)));
      Toast.show({
        text: "Point de repère enregistré dans 'Enregistrés'",
        duration: "long",
        position: "top"
      });
      this.hide();
      if (this.compareLandmarkId === null || this.compareLandmarkId < 0) {
        compareLandmarkJson.id = Globals.myaccount.lastCompareLandmarkId - 1;
      }
      Globals.comparePoi.setData(compareLandmarkJson);
      Globals.comparePoi.showWindow();
      Globals.comparePoi.handleCompareButton();
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
        accroche: this.data.title,
        theme: this.data.title,
        text: this.data.description,
        // Zoom +1 pour compatibilité avec POI RLT classiques
        zoom: this.data.zoom + 1,
        color: this.data.color,
        icon: this.data.icon,
        layer1: this.data.layer1,
        layer2: this.data.layer2,
        mode: this.data.mode,
        visible: true,
      }
    };
  }

  setData(data) {
    this.data = data;
    this.location = data.location;
    this.dom.title.value = this.data.title;
    this.dom.description.value = this.data.description;
    Array.from(this.dom.radioColors).filter((el) => el.value == data.color)[0].checked = true;
    this.dom.submitButton.classList.remove("disabled");
  }

  /**
   * Paramétrage de l'id
   * @param {number} id
   * @public
   */
  setId(id) {
    this.compareLandmarkId = id;
    document.getElementById("compareLandmarkWindowTitle").innerText = "Modifier un point de repère Comparer";
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
    this.location = null;
    this.data = {
      title: null,
      description: null,
      location: null,
      zoom: null,
      color: null,
      icon: null,
      layer1: null,
      layer2: null,
      mode: null,
    };
    this.compareLandmarkId = null;
    document.getElementById("compareLandmarkWindowTitle").innerText = "Créer un point de repère Comparer";
  }
}

export default compareLandmark;
