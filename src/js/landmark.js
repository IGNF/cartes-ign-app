import Globals from "./globals";

import { Toast } from "@capacitor/toast";

// dependance : abonnement au event du module
import Geocode from "./services/geocode";
import Location from "./services/location";
import Reverse from "./services/reverse";

/**
 * Interface sur le contrôle point de repère
 * @module Landmark
 */
class Landmark {
  /**
   * constructeur
   * @constructs
   * @param {*} map
   * @param {*} options
   */
  constructor(map, options) {
    this.options = options || {
      target: null,
      // callback
      openSearchControlCbk: null,
      closeSearchControlCbk: null
    };
    this.target = this.options.target || document.getElementById("landmarkWindow");

    this.map = map;

    this.data = {
      title: null,
      description: null,
      location: null,
      locationName: null,
      color: null,
      icon: null,
    };

    // ID du point de repère s'il s'agit d'une modification d'un point de repère existant
    this.landmarkId = null;

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
      location: this.target.querySelector("#landmarkLocation"),
      title: this.target.querySelector("#landmark-title"),
      description: this.target.querySelector("#landmark-description"),
      radioColors: this.target.querySelectorAll("[name='landmark-color']"),
      radioIcons: this.target.querySelectorAll("[name='landmark-icon']"),
      submitButton: this.target.querySelector(".landmark-submit"),
    };
  }

  /**
   * Ajout des listeners
   */
  #listeners() {
    this.dom.location.addEventListener("click", (e) => {
      // ouverture du menu de recherche
      this.onOpenSearchLocation(e);
    });
    this.dom.submitButton.addEventListener("click", () => {
      const color = Array.from(this.dom.radioColors).filter((el) => el.checked)[0].value;
      const icon = Array.from(this.dom.radioIcons).filter((el) => el.checked)[0].value;
      this.data = {
        title: this.dom.title.value,
        description: this.dom.description.value,
        location: this.dom.location.dataset.coordinates,
        locationName: this.dom.location.value,
        color: color,
        icon: icon,
      };
      if (!this.data.location || !this.data.title) {
        Toast.show({
          text: "Donnez un titre et un lieu à votre point de repère",
          duration: "long",
          position: "bottom"
        });
        return;
      }
      const landmarkJson = this.#generateGeoJson();
      Globals.myaccount.addLandmark(JSON.parse(JSON.stringify(landmarkJson)));
      Toast.show({
        text: "Point de repère enregistré dans 'Compte'",
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
    if (this.landmarkId !== null && this.landmarkId >= 0) {
      id = this.landmarkId;
    }
    return {
      type: "Feature",
      id: id,
      geometry: {
        type: "Point",
        coordinates: JSON.parse(this.data.location),
      },
      properties: {
        title: this.data.title,
        color: this.data.color,
        icon: this.data.icon,
        locationName: this.data.locationName,
        description: this.data.description,
        visible: true,
      }
    };
  }

  setData(data) {
    this.data = data;
    this.dom.title.value = this.data.title
    this.dom.description.value = this.data.description
    this.dom.location.dataset.coordinates = JSON.stringify(this.data.location);
    this.dom.location.value = this.data.locationName;
    Array.from(this.dom.radioColors).filter((el) => el.value == data.color)[0].checked = true;
    Array.from(this.dom.radioIcons).filter((el) => el.value == data.icon)[0].checked = true;
  }

  /**
   * Paramétrage de l'id
   * @param {number} id
   * @public
   */
  setId(id) {
    this.landmarkId = id;
    document.getElementById("landmarkWindowTitle").innerText = "Modifier un point de repère";
  }

  /**
   * Ferme la fenêtre
   * @public
   */
  hide() {
    Globals.menu.close("landmark");
  }

  /**
   * Ferme la fenêtre
   * @public
   */
  show() {
    Globals.menu.open("landmark");
  }

  /**
   * clean du formulaire
   * @public
   */
  clear() {
    this.dom.title.value = "";
    this.dom.description.value = "";
    this.dom.location.value = "";
    this.dom.location.dataset.coordinates = "";
    this.data = {
      title: null,
      description: null,
      location: null,
      locationName: null,
      color: null,
      icon: null,
    };
    this.landmarkId = null;
    document.getElementById("landmarkWindowTitle").innerText = "Créer un point de repère";
  }

  /**
   * listener sur la carte pour recuperer les coordonnées du point
   * @param {*} e
   */
  onAddWayPoint(e) {
    console.debug(e);
    var coordinates = e.lngLat;
    Reverse.compute({
      lon : coordinates.lng,
      lat : coordinates.lat
    })
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        var coords = Reverse.getCoordinates() || {lon : coordinates.lng, lat : coordinates.lat};
        var address = Reverse.getAddress() || coords.lon.toFixed(6) + ", " + coords.lat.toFixed(6);
        var strAddress = address;
        if (typeof address !== "string") {
          strAddress = "";
          strAddress += (address.number !== "") ? address.number + " " : "";
          strAddress += (address.street !== "") ? address.street + ", " : "";
          strAddress += address.city + ", " + address.postcode;
        }
        this.dom.location.dataset.coordinates = "[" + coords.lon + "," + coords.lat + "]";
        this.dom.location.value = strAddress;
      });
  }

  /**
   * listener issu du dom sur l'interface du menu 'search'
   * @param {*} e
   * @see MenuDisplay.openSearchLandmark()
   * @see MenuDisplay.closeSearchLandmark()
   * @see Geocode
   */
  onOpenSearchLocation(e) {
    // contexte
    var self = this;

    // on ouvre le menu
    if (this.options.openSearchControlCbk) {
      this.options.openSearchControlCbk();
    }

    // on transmet d'où vient la demande de location
    var target = e.target;

    // les handler sur
    // - le geocodage
    // - la fermeture du menu
    // - le nettoyage des ecouteurs
    function setLocation(e) {
      // on ferme le menu
      if (e.type !== "geolocation" && self.options.closeSearchControlCbk) {
        self.options.closeSearchControlCbk();
      }
      // on enregistre dans le DOM :
      // - les coordonnées en WGS84G soit lon / lat !
      // - la reponse du geocodage
      target.dataset.coordinates = "[" + e.detail.coordinates.lon + "," + e.detail.coordinates.lat + "]";
      target.value = e.detail.text;
      // on supprime les écouteurs
      cleanListeners();
    }
    function cleanLocation() {
      target.dataset.coordinates = "";
      target.value = "";
      cleanListeners();
    }
    function cleanListeners() {
      var close = document.getElementById("closeSearch");
      if (close) {
        close.removeEventListener("click", cleanLocation);
      }
      Geocode.target.removeEventListener("search", setLocation);
      Location.target.removeEventListener("geolocation", setLocation);
    }

    // abonnement au geocodage
    Geocode.target.addEventListener("search", setLocation);

    // abonnement à la geolocalisation
    Location.target.addEventListener("geolocation", setLocation);

    // abonnement au bouton de fermeture du menu
    var close = document.getElementById("closeSearch");
    if (close) {
      close.removeEventListener("click", cleanLocation);
    }
  }
}

export default Landmark;
