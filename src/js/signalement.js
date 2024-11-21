/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Globals from "./globals";

import { Toast } from "@capacitor/toast";
/**
 * Permet d'effectuer un signalement d'anomalie sur les données
 */
class Signalement {
  /**
   * constructeur
   * @param {*} map
   * @param {*} options
   * @returns
   */
  constructor(map, options) {
    this.options = options || {
    };

    this.target = this.options.target || document.getElementById("signalementWindow");

    // carte
    this.map = map;
    this.dom = {
      title: null,
      description: null,
      theme: null,
      email: null,
      submitButton: null,
    };
    this.data = {
      title: null,
      description: null,
      theme: null,
      email: null,
      location: null,
    };

    this.url = this.options.url || `${process.env.signalement_url}`;
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
      title: this.target.querySelector("#signalement-title"),
      description: this.target.querySelector("#signalement-description"),
      theme: this.target.querySelector("#signalement-theme"),
      email: this.target.querySelector("#signalement-email"),
      submitButton: this.target.querySelector(".signalement-submit"),
    };
    // TODO: remplir automatiquement email si connecté via Globals.myaccount
  }

  /**
   * Ajout des listeners
   */
  #listeners() {
    const checkFormValidity = () => {
      if (this.dom.title.value && this.dom.description.value && this.dom.theme.value && this.dom.email.value) {
        this.dom.submitButton.classList.remove("disabled");
      } else {
        this.dom.submitButton.classList.add("disabled");
      }
    };

    this.dom.title.addEventListener("input", checkFormValidity);
    this.dom.description.addEventListener("input", checkFormValidity);
    this.dom.theme.addEventListener("input", checkFormValidity);
    this.dom.email.addEventListener("input", checkFormValidity);

    this.dom.submitButton.addEventListener("click", () => {
      this.data = {
        title: this.dom.title.value,
        description: this.dom.description.value,
        theme: this.dom.theme.value,
        email: this.dom.email.value,
        location: this.data.location,
      };
      if (!this.data.title || !this.data.description || !this.data.theme || !this.data.email) {
        Toast.show({
          text: "Merci de remplir tous les champs du formulaire",
          duration: "long",
          position: "bottom"
        });
        return;
      }
      if (!this.data.location) {
        Toast.show({
          text: "Le signalement ne peut se faire qu'à partir d'un lieu",
          duration: "long",
          position: "bottom"
        });
        console.warn("Signalement sans lieu !");
        return;
      }
      this.#send();
      Toast.show({
        text: "Votre signalement a été transmis aux équipes concernées.",
        duration: "long",
        position: "top"
      });
      this.hide();
    });
  }

  /**
   * envoi du signalement
   * @private
   */
  async #send() {
    const permalink = `https://www.geoportail.gouv.fr/carte?c=${this.data.location.lon},${this.data.location.lat}&z=${Math.floor(this.map.getZoom()) - 1}&l0=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2::GEOPORTAIL:OGC:WMTS(1)&permalink=yes`;
    const anomaly = {
      name: this.data.title + " (Anomalie) (Appli mobile IGN)",
      description: this.data.description,
      theme: this.data.theme,
      permalink: permalink,
      id_drawing: "",
      mail: this.data.email,
    };

    const kml = `<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/kml/2.2 https://developers.google.com/kml/schema/kml22gx.xsd"><Placemark><name>location of an anomaly (${anomaly.name})</name><Point><coordinates>${this.data.location.lon},${this.data.location.lat}</coordinates></Point></Placemark></kml>`;
    const drawing = {
      is_anomaly: 1,
      kml: kml,
      layername: anomaly.name,
      name: anomaly.name,
    };

    const drawingRequestBody = {drawing: drawing};
    const drawingResponse = await fetch(this.url + "drawing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer undefined",
      },
      mode: "cors",
      credentials: "same-origin",
      body: JSON.stringify(drawingRequestBody),
    });
    const drawingResults = await drawingResponse.json();

    anomaly.id_drawing = drawingResults.drawing[0].id;

    const requestBody = {anomaly: anomaly};
    await fetch(this.url + "anomaly", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer undefined",
      },
      mode: "cors",
      credentials: "same-origin",
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * affiche le menu
   * @public
   */
  show() {
    Globals.menu.open("signalement");
  }

  /**
   * ferme le menu
   * @public
   */
  hide() {
    Globals.menu.close("signalement");
  }

  /**
   * clean du formulaire
   * @public
   */
  clear() {
    if (this.dom.title) {
      this.dom.title.value = "";
      this.dom.description.value = "";
      this.dom.theme.value = "";
    }
    this.data = {
      title: null,
      description: null,
      theme: null,
      email: null,
      location: null,
    };
    this.dom.submitButton.classList.add("disabled");
  }

}

export default Signalement;
