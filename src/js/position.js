import maplibregl from "maplibre-gl";

// TODO utiliser l'ecouteur sur l'event "target"
import Reverse from "./services/reverse";
import Elevation from "./services/elevation";
import Location from './services/location';
import Globals from './globals';
import DomUtils from "./dom-utils"
import { Share } from "@capacitor/share";

/**
 * Permet d'afficher ma position sur la carte
 * avec quelques informations utiles (adresse, lat/lon, elevation, ...)
 *
 * Fonctionnalité utilisée par "Où suis-je ?"
 *
 * @todo impl. la redirection vers sms
 */
class Position {
  /**
   * constructeur
   * @param {*} map
   * @param {*} options
   * @returns
   */
  constructor(map, options) {
    this.options = options || {
      target: null,
      tracking : false, // suivi de la position
      // callback
      openPositionCbk: null,
      closePositionCbk: null,
      openIsochroneCbk: null,
      openDirectionsCbk: null,
    };

    // carte
    this.map = map;

    // tracking
    this.tracking = this.options.tracking;

    // target
    this.target = this.options.target;

    // share
    this.shareContent = null;

    // les données utiles du service
    this.coordinates = null;
    this.address = null;
    this.elevation = null;

    // Titre de l'onglet (ex. "Ma Position", "Repère Placé"...)
    this.header = "";

    // HTML additionnel (pour le GFI)
    this.additionalHtml = "";

    // dom de l'interface
    this.container = null;

    // open/close interface
    this.opened = false;

    return this;
  }

  /**
   * rendu du menu
   * @private
   */
  #render() {
    var target = this.target || document.getElementById("positionWindow");
    if (!target) {
      console.warn();
      return;
    }

    var id = {
      main: "positionContainer",
    };
    var address = this.address;
    var latitude = this.coordinates.lat;
    var longitude = this.coordinates.lon;
    var altitude = this.elevation;
    var templateAddress;

    // adresse disponible
    if (address.city && address.street) {
      templateAddress = `
        <span class="lblPositionAddress">${address.number} ${address.street}</span><br />
        <span class="lblPositionCity">${address.postcode} ${address.city}</span>
        `
    } else if (address.city && !address.street) {
      templateAddress = `
        <span class="lblPositionAddress">${address.city}</span>
        <span class="lblPositionCity">${address.postcode}</span>
        `
    } else {
      templateAddress = `
        <span class="lblPositionAddress">${latitude}, ${longitude}</span>
        `
    }

    // template litteral
    this.shareContent = `${this.header}
${templateAddress}
Latitude : ${latitude} </span>
Longitude : ${longitude}</span><br />
Altitude : ${altitude}m</span>
        `;

    // template litteral
    var strContainer = `
        <div id="${id.main}">
            <div class="divPositionTitle">${this.header}</div>
            <div class="divPositionAddress">
                <label class="lblPositionImgAddress"></label>
                <div class="divPositionSectionAddress fontLight">
                  ${templateAddress}
                </div>
            </div>
            <div class="divPositionButtons">
                <button id="positionShare" class="btnPositionButtons"><label class="lblPositionImg lblPositionShareImg"></label>Partager</button>
                <button id="positionNear" class="btnPositionButtons"><label class="lblPositionImg lblPositionNearImg"></label>À proximité</button>
                <button id="positionRoute" class="btnPositionButtons"><label class="lblPositionImg lblPositionRouteImg"></label>S'y rendre</button>
            </div>
            <div class="divPositionCoord fontLight">
                <p class="lblPositionCoord">Latitude : ${latitude}</p>
                <p class="lblPositionCoord">Longitude : ${longitude}</p>
                <p class="lblPositionCoord">Altitude : ${altitude}m</p>
            </div>
            ${this.additionalHtml}
        </div>
        `;

    // transformation du container : String -> DOM
    var container = DomUtils.stringToHTML(strContainer.trim());

    if (!container) {
      console.warn();
      return;
    }

    // ajout du shadow DOM
    const shadowContainer = container.attachShadow({ mode: "open" });
    shadowContainer.innerHTML = strContainer.trim();

    if (!shadowContainer) {
      console.warn();
      return;
    }

    // ajout des listeners principaux :
    shadowContainer.getElementById("positionShare").addEventListener("click", () => {
      Share.share({
        title: `Partager ${this.header}`,
        text: this.shareContent,
        dialogTitle: 'Partager la position',
      });
    });
    shadowContainer.getElementById("positionNear").addEventListener("click", () => {
      // fermeture du panneau actuel
      if (this.options.closePositionCbk) {
        this.options.closePositionCbk();
        this.opened = false;
      }
      // ouverture du panneau Isochrone
      if (this.options.openIsochroneCbk) {
        this.options.openIsochroneCbk();
        let target = Globals.isochrone.dom.location;
        target.dataset.coordinates = "[" + this.coordinates.lon + "," + this.coordinates.lat + "]";
        target.value = `${this.address.number} ${this.address.street}`;
      }

    });
    shadowContainer.getElementById("positionRoute").addEventListener("click", () => {
      // fermeture du panneau actuel
      if (this.options.closePositionCbk) {
        this.options.closePositionCbk();
        this.opened = false;
      }
      // ouverture du panneau Itinéraire
      if (this.options.openDirectionsCbk) {
        this.options.openDirectionsCbk();
        let target = Globals.directions.dom.inputArrival;
        target.dataset.coordinates = "[" + this.coordinates.lon + "," + this.coordinates.lat + "]";
        target.value = `${this.address.number} ${this.address.street}`;
      }

    });

    // ajout du container shadow
    target.appendChild(shadowContainer);

    // enregistrement du dom
    this.container = document.getElementById(id.main);

    // mise à jour du statut de la fenêtre
    this.opened = true;
  }

  /**
   * calcul la position avec les méta informations
   * @param {maplibregl.LngLat} lngLat position en paramètre, false si "Ma Position"
   * @public
   */
  async compute(lngLat = false, text = "Repère placé", html = "") {
    this.clear();
    let position;
    if (lngLat === false) {
      position = await Location.getLocation(this.tracking);
    } else {
      position = {
        coordinates: {
          lat: lngLat.lat,
          lon: lngLat.lng
        },
        text: text
      };
    }

    this.header = position.text;
    this.additionalHtml = html;

    const responseReverse = await Reverse.compute({
      lat: position.coordinates.lat,
      lon: position.coordinates.lon
    });

    if (!responseReverse) {
      throw new Error("Reverse response is empty !");
    }

    this.coordinates = Reverse.getCoordinates() ? Reverse.getCoordinates() : position.coordinates;
    this.address = Reverse.getAddress();

    if (!Reverse.getAddress()) {
      this.address = {
        number: "",
        street: "",
        postcode: "",
        city: ""
      };
    }

    try {
      await Elevation.compute({
        lat: position.coordinates.lat,
        lon: position.coordinates.lon
      });
    } catch(err) {
      console.warn(`Error when fetching elevation: ${err}`);
    }

    this.elevation = Elevation.getElevation();

    this.#render();
    this.#addMarkerEvent();
    if (lngLat === false) {
      this.#moveTo();
    }

  }

  /**
   * deplacement sur la carte
   * @private
   */
  #moveTo() {
    this.map.setCenter([this.coordinates.lon, this.coordinates.lat]);
  }

  /**
   * ajout de l'évènement d'ouverture sur le marker de positionnement sur la carte
   * @private
   */
  #addMarkerEvent() {
    // contexte
    var self = this;

    // addEvent listerner to my location
    Globals.myPositionIcon.addEventListener("click", (e) => {
      // FIXME ...
      var container = document.getElementById("positionWindow");
      if (container.className === "d-none") {
        self.opened = false;
      }
      (self.opened) ? self.hide() : self.show();
    });
  }

  /**
   * detecte l'environnement : mobile ou desktop
   * @returns {Boolean}
   */
  isDesktop() {
    var isDesktop = true;
    var userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('iphone') !== -1 || userAgent.indexOf('ipod') !== -1 || userAgent.indexOf('ipad') !== -1 || userAgent.indexOf('android') !== -1 || userAgent.indexOf('mobile') !== -1 || userAgent.indexOf('blackberry') !== -1 || userAgent.indexOf('tablet') !== -1 || userAgent.indexOf('phone') !== -1 || userAgent.indexOf('touch') !== -1) {
      isDesktop = false;
    }
    if (userAgent.indexOf('msie') !== -1 || userAgent.indexOf('trident') !== -1) {
      isDesktop = true;
    }
    return isDesktop;
  }

  /**
   * affiche le menu
   * @public
   */
  show() {
    if (this.options.openPositionCbk) {
      this.options.openPositionCbk();
      this.opened = true;
    }
  }

  /**
   * ferme le menu
   * @public
   */
  hide() {
    if (this.options.closePositionCbk) {
      this.options.closePositionCbk();
      this.opened = false;
    }
  }

  /**
   * clean des resultats
   * @public
   */
  clear() {
    this.coordinates = null;
    this.address = null;
    this.elevation = null;
    this.opened = false;
    this.shareContent = null;
    // nettoyage du DOM
    if (this.container) {
      this.container.remove();
    }
  }

}

export default Position;
