// TODO utiliser l'ecouteur sur l'event "target"
import Reverse from "./services/reverse";
import Elevation from "./services/elevation";
import Location from "./services/location";
import Globals from "./globals";
import DomUtils from "./utils/dom-utils";
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
      // callback
      openPositionCbk: null,
      closePositionCbk: null,
      openIsochroneCbk: null,
      openDirectionsCbk: null,
      openSignalCbk: null,
      openLandmarkCbk: null,
    };

    // carte
    this.map = map;

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
    var altitude = this.elevation.toLocaleString();
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
    let trueHeader = "";
    if (this.header.includes("landmarkSummaryIcon")) {
      console.log(DomUtils.stringToHTML(this.header.trim()));
      trueHeader = DomUtils.stringToHTML(this.header.trim()).innerText.trim();
    } else if (this.header.includes("divLegendDescription")) {
      trueHeader = DomUtils.stringToHTML(this.header.trim()).querySelector(".divLegendDescription").innerHTML.trim().replace("<br>", "\n");
    }
    this.shareContent = `${trueHeader ? trueHeader : this.header}
${this.name}
Latitude : ${latitude}
Longitude : ${longitude}
Altitude : ${altitude} m
        `;

    var htmlButtons = `
      <button id="positionRoute" class="btnPositionButtons"><label class="lblPositionImg lblPositionRouteImg"></label>S'y rendre</button>
      <button id="positionNear" class="btnPositionButtons"><label class="lblPositionImg lblPositionNearImg"></label>À proximité</button>
      <button id="positionShare" class="btnPositionButtons"><label class="lblPositionImg lblPositionShareImg"></label>Partager</button>
      <button id="positionLandmark" class="btnPositionButtons"><label class="lblPositionImg lblPositionLandmarkImg"></label>Enregistrer</button>
      <button id="positionSignal" class="btnPositionButtons"><label class="lblPositionImg lblPositionSignalImg"></label>Signaler</button>
      `;

    if (this.header === "Ma position") {
      htmlButtons = `
        <button id="positionShare" class="btnPositionButtons"><label class="lblPositionImg lblPositionShareImg"></label>Partager</button>
        <button id="positionNear" class="btnPositionButtons"><label class="lblPositionImg lblPositionNearImg"></label>À proximité</button>
        <button id="positionRoute" class="btnPositionButtons"><label class="lblPositionImg lblPositionRouteImg"></label>S'y rendre</button>
        <button id="positionLandmark" class="btnPositionButtons"><label class="lblPositionImg lblPositionLandmarkImg"></label>Point de repère</button>
        `;
    }

    // Si c'est un landmark
    if (this.header.includes("landmarkSummaryIcon")) {
      htmlButtons = `
      <button id="positionRoute" class="btnPositionButtons"><label class="lblPositionImg lblPositionRouteImg"></label>S'y rendre</button>
      <button id="positionNear" class="btnPositionButtons"><label class="lblPositionImg lblPositionNearImg"></label>À proximité</button>
      <button id="positionShare" class="btnPositionButtons"><label class="lblPositionImg lblPositionShareImg"></label>Partager</button>
      <button id="positionLandmark" class="btnPositionButtons positionLandmarkEdit"><label class="lblPositionImg lblPositionLandmarkEditImg"></label>Modifier</button>
      <button id="positionSignal" class="btnPositionButtons"><label class="lblPositionImg lblPositionSignalImg"></label>Signaler</button>
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
    shadowContainer.getElementById("positionNear").addEventListener("click", async () => {
      let coordinates = this.coordinates;
      if (this.header === "Ma position") {
        let position = await Location.getLocation();
        coordinates = position.coordinates;
      }
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
    shadowContainer.getElementById("positionRoute").addEventListener("click", async () => {
      let coordinates = this.coordinates;
      if (this.header === "Ma position") {
        let position = await Location.getLocation();
        coordinates = position.coordinates;
      }
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
    shadowContainer.getElementById("positionLandmark").addEventListener("click", async (e) => {
      let coordinates = this.coordinates;
      if (this.header === "Ma position") {
        let position = await Location.getLocation();
        coordinates = position.coordinates;
      }
      // Récupération de l'id du landmark
      let landmarkId = -1;
      if ([...e.target.classList].includes("positionLandmarkEdit")) {
        [...document.getElementById("landmarkPositionTitle").classList].forEach((cl) => {
          if (cl.split("-")[0] === "landmarkPosition") {
            landmarkId = parseInt(cl.split("-")[1]);
          }
        });
      }
      // fermeture du panneau actuel
      if (this.options.closePositionCbk) {
        this.options.closePositionCbk();
        this.opened = false;
      }
      // ouverture du panneau Point de repère
      if (this.options.openLandmarkCbk) {
        if (landmarkId >= 0) {
          document.getElementById(`landmark-edit_ID_${landmarkId}`).click();
        } else {
          this.options.openLandmarkCbk();
          let target = document.getElementById("landmarkLocation");
          target.dataset.coordinates = "[" + coordinates.lon + "," + coordinates.lat + "]";
          target.value = this.name;
        }
      }
    });
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
    if (this.container) {
      this.container.remove();
    }
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
      position = await Location.getLocation();
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
    try {
      await Reverse.compute({
        lat: position.coordinates.lat,
        lon: position.coordinates.lon
      });
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }
      console.warn(`Error when fetching reverse: ${err}`);
    }

    try {
      await Elevation.compute(position.coordinates);
    } catch(err) {
      if (err.name === "AbortError") {
        return;
      }
      console.warn(`Error when fetching elevation: ${err}`);
    }

    this.coordinates = position.coordinates;
    this.address = Reverse.getAddress() || {
      number: "",
      street: "",
      postcode: "",
      city: ""
    };
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
