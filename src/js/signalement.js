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
    this.#loadScript("https://geocaptcha.ign.fr/api/v1/lib.js");
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

  #loadScript (url) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = url;
      script.async = true;

      script.onload = resolve;
      script.onerror = () => reject(new Error(`Impossible de charger ${url}`));

      document.head.appendChild(script);
    });
  }

  #getCaptchaToken () {
    return new Promise((resolve, reject) => {
      if (!window.geoCaptcha) {
        reject(new Error("GéoCaptcha non chargé"));
      }
      window.geoCaptcha.launch({
        submit: resolve,
        cancel: () => reject(new Error("GéoCaptcha non résolu")),
      });
    });
  }

  /**
   * envoi du signalement
   * @private
   */
  async #send() {
    const token = await this.#getCaptchaToken(); // resolved uniquement si captcha ok
    const layername = this.data.title + " (Anomalie) (application Cartes IGN)";
    const mapZoom = Math.floor(this.map.getZoom());
    const kml = `<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/kml/2.2 https://developers.google.com/kml/schema/kml22gx.xsd"><Placemark><name>location of an anomaly (${layername})</name><Point><coordinates>${this.data.location.lon},${this.data.location.lat}</coordinates></Point></Placemark></kml>`;
    const anomaly = {
      anomaly: {
        name: layername,
        description: this.data.description,
        theme: this.data.theme,
        mail: this.data.email,
        center: this.data.location,
        zoom: mapZoom,
      },
      drawing: {
        kml: kml,
        layername: layername,
        name: layername,
      },
      geocaptchaToken: token,
    };

    await fetch(this.url + "anomaly", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer undefined",
      },
      mode: "cors",
      credentials: "same-origin",
      body: JSON.stringify(anomaly),
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
