/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Globals from "./globals";

import { Toast } from "@capacitor/toast";

/**
 * Permet de créer une Note OpenStreetMap depuis un POI OSM
 */
class SignalementOSM {
  /**
   * constructeur
   * @param {*} map
   * @param {*} options
   * @returns
   */
  constructor(map, options) {
    this.options = options || {
    };

    this.target = this.options.target || document.getElementById("signalementOSMWindow");

    // carte
    this.map = map;
    this.dom = {
      title: null,
      description: null,
      submitButton: null,
    };
    this.data = {
      title: null,
      description: null,
      location: null,
      poiName: null,
    };

    this.url = this.options.url || "https://api.openstreetmap.org/api/0.6/notes.json";
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
      title: this.target.querySelector("#signalement-osm-title"),
      description: this.target.querySelector("#signalement-osm-description"),
      submitButton: this.target.querySelector(".signalement-submit"),
    };
  }

  /**
   * Ajout des listeners
   */
  #listeners() {
    const checkFormValidity = () => {
      if (this.dom.title.value && this.dom.description.value) {
        this.dom.submitButton.classList.remove("disabled");
      } else {
        this.dom.submitButton.classList.add("disabled");
      }
    };

    this.dom.title.addEventListener("input", checkFormValidity);
    this.dom.description.addEventListener("input", checkFormValidity);

    this.dom.submitButton.addEventListener("click", () => {
      this.data = {
        title: this.dom.title.value,
        description: this.dom.description.value,
        location: this.data.location,
        poiName: this.data.poiName,
      };
      if (!this.data.title || !this.data.description) {
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
      this.dom.submitButton.classList.add("inactive");
      this.#send().then( (response) => {
        this.target.querySelector("#osmNoteUrl").href = `https://www.openstreetmap.org/note/${response.properties.id}`;
        this.target.querySelector("#signalementOsmMain").classList.add("d-none");
        this.target.querySelector("#signalementOsmDone").classList.remove("d-none");
        this.dom.submitButton.classList.remove("inactive");
      }).catch( () => {
        this.target.querySelector("#signalementOsmMain").classList.add("d-none");
        this.target.querySelector("#signalementOsmDone").classList.remove("d-none");
        this.dom.submitButton.classList.remove("inactive");
        this.hide();
        Toast.show({
          text: "Une erreur s'est produite lors de la création de la note",
          duration: "short",
          position: "bottom"
        });
      });

    });
  }

  /**
   * envoi du signalement
   * @private
   */
  async #send() {
    const noteText = `Un signalement a été effectué par un utilisateur de l'application Cartes IGN :\n
Titre : ${this.data.title}\n\n

Nom ou type de POI concerné : ${this.data.poiName}\n\n

Description :\n ${this.data.description}
    `;

    const requestBody = {
      "lat": this.data.location.lat,
      "lon": this.data.location.lon,
      "text": noteText
    };
    const bearerToken = process.env.osm_bearer_token || "undefined";
    const resp = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(requestBody),
    });
    const json = await resp.json();
    return json;
  }

  /**
   * affiche le menu
   * @public
   */
  show() {
    Globals.menu.open("signalementOSM");
  }

  /**
   * ferme le menu
   * @public
   */
  hide() {
    Globals.menu.close("signalementOSM");
  }

  /**
   * clean du formulaire
   * @public
   */
  clear() {
    if (this.dom.title) {
      this.dom.title.value = "";
      this.dom.description.value = "";
    }
    this.data = {
      title: null,
      description: null,
      location: null,
      poiName: null,
    };
    this.target.querySelector("#signalementOsmMain").classList.remove("d-none");
    this.target.querySelector("#signalementOsmDone").classList.add("d-none");
    this.dom.submitButton.classList.add("disabled");
  }

}

export default SignalementOSM;
