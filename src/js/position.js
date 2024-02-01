// TODO utiliser l'ecouteur sur l'event "target"
import Reverse from "./services/reverse";
import Elevation from "./services/elevation";
import Location from "./services/location";
import Globals from "./globals";
import DomUtils from "./dom-utils";
import { Share } from "@capacitor/share";

/**
 * Permet d'afficher ma position sur la carte
 * avec quelques informations utiles (adresse, lat/lon, elevation, ...)
 *
 * Fonctionnalité utilisée par "Où suis-je ?"
 *
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
      openSignalCbk: null,
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
    this.name = null; // nom résumé

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
        `;
      this.name = `${address.number} ${address.street}, ${address.postcode} ${address.city}`;
    } else if (address.city && !address.street) {
      templateAddress = `
        <span class="lblPositionAddress">${address.city}</span>
        <span class="lblPositionCity">${address.postcode}</span>
        `;
      this.name = `${address.city} ${address.postcode}`;
    } else {
      templateAddress = `
        <span class="lblPositionAddress">${latitude}, ${longitude}</span>
        `;
      this.name = `${latitude}, ${longitude}`;
    }

    // template litteral
    this.shareContent = `${this.header}
${this.name}
Latitude : ${latitude}
Longitude : ${longitude}
Altitude : ${altitude} m
        `;

    var htmlButtons = `
      <button id="positionRoute" class="btnPositionButtons"><label class="lblPositionImg lblPositionRouteImg"></label>S'y rendre</button>
      <button id="positionNear" class="btnPositionButtons"><label class="lblPositionImg lblPositionNearImg"></label>À proximité</button>
      <button id="positionShare" class="btnPositionButtons"><label class="lblPositionImg lblPositionShareImg"></label>Partager</button>
      <button id="positionSignal" class="btnPositionButtons"><label class="lblPositionImg lblPositionSignalImg"></label>Signaler</button>
      `;

    if (this.header === "Ma position") {
      htmlButtons = `
        <button id="positionShare" class="btnPositionButtons"><label class="lblPositionImg lblPositionShareImg"></label>Partager</button>
        <button id="positionNear" class="btnPositionButtons"><label class="lblPositionImg lblPositionNearImg"></label>À proximité</button>
        <button id="positionRoute" class="btnPositionButtons"><label class="lblPositionImg lblPositionRouteImg"></label>S'y rendre</button>
        `;
    }

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
                ${htmlButtons}
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
        dialogTitle: "Partager la position",
      });
    });
    shadowContainer.getElementById("positionNear").addEventListener("click", () => {
      const coordinates = this.coordinates;
      // fermeture du panneau actuel
      if (this.options.closePositionCbk) {
        this.options.closePositionCbk();
        this.opened = false;
      }
      // ouverture du panneau Isochrone
      if (this.options.openIsochroneCbk) {
        this.options.openIsochroneCbk();
        let target = Globals.isochrone.dom.location;
        target.dataset.coordinates = "[" + coordinates.lon + "," + coordinates.lat + "]";
        target.value = this.name;
      }
    });
    shadowContainer.getElementById("positionRoute").addEventListener("click", () => {
      const coordinates = this.coordinates;
      // fermeture du panneau actuel
      if (this.options.closePositionCbk) {
        this.options.closePositionCbk();
        this.opened = false;
      }
      // ouverture du panneau Itinéraire
      if (this.options.openDirectionsCbk) {
        this.options.openDirectionsCbk();
        let target = Globals.directions.dom.inputArrival;
        if (this.header === "Ma position") {
          target = Globals.directions.dom.inputDeparture;
        }
        target.dataset.coordinates = "[" + coordinates.lon + "," + coordinates.lat + "]";
        target.value = this.name;
      }
    });
    // ajout des listeners principaux :
    if (this.header !== "Ma position") {
      shadowContainer.getElementById("positionSignal").addEventListener("click", () => {
        const coordinates = this.coordinates;
        // ouverture du panneau Signalement
        if (this.options.openSignalCbk) {
          this.options.openSignalCbk();
          Globals.signalement.data.location = coordinates;
        }
      });
    }

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
          lat: Math.round(lngLat.lat * 1e6) / 1e6,
          lon: Math.round(lngLat.lng * 1e6) / 1e6,
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

    this.coordinates = position.coordinates;
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
      await Elevation.compute(this.coordinates);
    } catch(err) {
      console.warn(`Error when fetching elevation: ${err}`);
    }

    this.elevation = Elevation.getElevation();

    this.#render();
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
      if (Globals.searchResultMarker != null) {
        Globals.searchResultMarker.remove();
        Globals.searchResultMarker = null;
      }
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
    if (!Globals.backButtonState.includes("isochrone") && Globals.searchResultMarker != null) {
      Globals.searchResultMarker.remove();
      Globals.searchResultMarker = null;
    }
  }

}

export default Position;
