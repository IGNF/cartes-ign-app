/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

// TODO utiliser l'ecouteur sur l'event "target"
import Reverse from "./services/reverse";
import Elevation from "./services/elevation";
import Location from "./services/location";
import Globals from "./globals";
import DomUtils from "./utils/dom-utils";
import { Share } from "@capacitor/share";
import { Toast } from "@capacitor/toast";

import LoadingDark from "../css/assets/loading-darkgrey.svg";

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
      openSignalOSMCbk: null,
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
    this.additionalHtml = {
      beforeButtons: "",
      afterButtons: ""
    };

    // dom de l'interface
    this.container = null;

    // open/close interface
    this.opened = false;

    // fonction à exécuter à la fermeture du volet
    this.hideCallback = null;

    return this;
  }

  /**
   * rendu du menu
   * @param {string} type type de position default, myposition ou landmark
   * @private
   */
  #render(type) {
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
    var altitudeHtml = `<img src="${LoadingDark}" height="8px">`;
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

    this.#setShareContent(latitude, longitude);
    // template litteral
    var htmlButtons = `
      <button id="positionRoute" class="btnPositionButtons"><label class="lblPositionImg lblPositionRouteImg"></label>S'y rendre</button>
      <button id="positionNear" class="btnPositionButtons"><label class="lblPositionImg lblPositionNearImg"></label>À proximité</button>
      <button id="positionShare" class="btnPositionButtons"><label class="lblPositionImg lblPositionShareImg"></label>Partager</button>
      <button id="positionLandmark" class="btnPositionButtons"><label class="lblPositionImg lblPositionLandmarkImg"></label>Enregistrer</button>
      <button id="positionSignal" class="btnPositionButtons"><label class="lblPositionImg lblPositionSignalImg"></label>Signaler</button>
      `;

    if (type === "myposition") {
      htmlButtons = `
        <button id="positionShare" class="btnPositionButtons"><label class="lblPositionImg lblPositionShareImg"></label>Partager</button>
        <button id="positionNear" class="btnPositionButtons"><label class="lblPositionImg lblPositionNearImg"></label>À proximité</button>
        <button id="positionRoute" class="btnPositionButtons"><label class="lblPositionImg lblPositionRouteImg"></label>S'y rendre</button>
        <button id="positionLandmark" class="btnPositionButtons"><label class="lblPositionImg lblPositionLandmarkImg"></label>Point de repère</button>
      `;
    }

    var htmlAdvanced = "";
    // Si c'est un landmark
    if (type === "landmark") {
      htmlButtons = `
        <button id="positionRoute" class="btnPositionButtons"><label class="lblPositionImg lblPositionRouteImg"></label>S'y rendre</button>
        <button id="positionNear" class="btnPositionButtons"><label class="lblPositionImg lblPositionNearImg"></label>À proximité</button>
        <button id="positionShare" class="btnPositionButtons"><label class="lblPositionImg lblPositionShareImg"></label>Partager</button>
        <button id="positionSignal" class="btnPositionButtons"><label class="lblPositionImg lblPositionSignalImg"></label>Signaler</button>
      `;
      htmlAdvanced = `
        <label id="position-landmark-show-advanced-tools" title="Plus d'outils" class="tools-layer-advanced"></label>
        <div id="position-landmark-advanced-tools" class="tools-layer-advanced-menu">
          <div id="position-landmark-share" class="tools-layer-share" title="Partager le point de repère">Partager</div>
          <div id="position-landmark-edit" class="tools-layer-edit" title="Modifier le point de repère">Modifier</div>
          <div id="position-landmark-export" class="tools-layer-export" title="Exporter le point de repère">Exporter</div>
          <div id="position-landmark-remove" class="tools-layer-remove" title="Supprimer le point de repère'">Supprimer</div>
        </div>
      `;
    }

    // template litteral
    var strContainer = `
      <div id="${id.main}">
          <div class="divPositionTitleWrapper"><div class="divPositionTitle">${this.header}</div>${htmlAdvanced}</div>
          <div class="divPositionAddress">
              <label class="lblPositionImgAddress"></label>
              <div class="divPositionSectionAddress fontLight">
                ${templateAddress}
                <div class="divPositionCoord fontLight">
                  (${latitude}, ${longitude}) - Alt : <span id="positionAltitudeSpan">${altitudeHtml}</span> m
                </div>
              </div>
          </div>
          ${this.additionalHtml.beforeButtons}
          <div class="divPositionButtons">
            ${htmlButtons}
            <div id="divPositionButtonsAfter" title="Faire défiler le menu" tabindex="0"><div></div></div>
          </div>
          ${this.additionalHtml.afterButtons}
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
        title: `Partager ${this.#getTrueHeader()}}`,
        text: this.shareContent,
        dialogTitle: "Partager la position",
      });
    });
    shadowContainer.getElementById("positionNear").addEventListener("click", async () => {
      let coordinates = this.coordinates;
      if (type === "myposition") {
        let position = await Location.getLocation();
        coordinates = position.coordinates;
      }
      // fermeture du panneau actuel
      if (this.options.closePositionCbk) {
        if (this.hideCallback) {
          this.hideCallback();
          this.hideCallback = null;
        }
        Globals.isochrone.clear();
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
      if (type === "myposition") {
        let position = await Location.getLocation();
        coordinates = position.coordinates;
      }
      // fermeture du panneau actuel
      if (this.options.closePositionCbk) {
        if (this.hideCallback) {
          this.hideCallback();
          this.hideCallback = null;
        }
        Globals.isochrone.clear();
        this.options.closePositionCbk();
        this.opened = false;
      }
      // ouverture du panneau Itinéraire
      if (this.options.openDirectionsCbk) {
        this.options.openDirectionsCbk();
        let target = Globals.directions.dom.inputArrival;
        if (type === "myposition") {
          target = Globals.directions.dom.inputDeparture;
        }
        target.dataset.coordinates = "[" + coordinates.lon + "," + coordinates.lat + "]";
        target.value = this.name;
      }
    });
    if (type !== "landmark") {
      shadowContainer.getElementById("positionLandmark").addEventListener("click", async () => {
        let coordinates = this.coordinates;
        if (type === "myposition") {
          let position = await Location.getLocation();
          coordinates = position.coordinates;
        }
        // fermeture du panneau actuel
        if (this.options.closePositionCbk) {
          if (this.hideCallback) {
            this.hideCallback();
            this.hideCallback = null;
          }
          Globals.isochrone.clear();
          this.options.closePositionCbk();
          this.opened = false;
        }
        // ouverture du panneau Point de repère
        if (this.options.openLandmarkCbk) {
          this.options.openLandmarkCbk();
          let target = document.getElementById("landmarkLocation");
          target.dataset.coordinates = "[" + coordinates.lon + "," + coordinates.lat + "]";
          target.value = this.name;
        }
      });
    }

    if (type !== "myposition") {
      shadowContainer.getElementById("positionSignal").addEventListener("click", () => {
        const coordinates = this.coordinates;
        // ouverture du panneau Signalement
        if (this.options.openSignalCbk) {
          if (type === "osm") {
            Globals.signalementOSM.data.poiName = this.#getTrueHeader().split("\n")[0];
            Globals.signalementOSM.data.location = coordinates;
            this.options.openSignalOSMCbk();
          } else {
            this.options.openSignalCbk();
            Globals.signalement.data.location = coordinates;
          }
        }
      });
    }

    if (type === "landmark") {
      // fermeture du panneau actuel
      const closeSelf = () => {
        if (this.options.closePositionCbk) {
          if (this.hideCallback) {
            this.hideCallback();
            this.hideCallback = null;
          }
          Globals.isochrone.clear();
          this.options.closePositionCbk();
          this.opened = false;
        }
      };
      // Récupération de l'id du landmark
      let landmarkId = -1;
      [...shadowContainer.getElementById("landmarkPositionTitle").classList].forEach((cl) => {
        if (cl.split("-")[0] === "landmarkPosition") {
          landmarkId = parseInt(cl.split("-")[1]);
        }
      });
      shadowContainer.getElementById("position-landmark-share").addEventListener("click", () => {
        // ouverture du panneau Point de repère
        document.getElementById(`landmark-share_ID_${landmarkId}`).click();
      });
      shadowContainer.getElementById("position-landmark-edit").addEventListener("click", () => {
        closeSelf();
        // ouverture du panneau Point de repère
        document.getElementById(`landmark-edit_ID_${landmarkId}`).click();
      });
      shadowContainer.getElementById("position-landmark-export").addEventListener("click", () => {
        // ouverture du panneau Point de repère
        document.getElementById(`landmark-export_ID_${landmarkId}`).click();
      });
      let hasBeenClicked = false;
      shadowContainer.getElementById("position-landmark-remove").addEventListener("click", () => {
        if (!hasBeenClicked) {
          Toast.show({
            text: "Confirmez la suppression du point de repère",
            duration: "short",
            position: "bottom"
          });
          hasBeenClicked = true;
        } else {
          closeSelf();
          Globals.myaccount.deleteLandmark(landmarkId);
          hasBeenClicked = false;
        }
      });
    }

    shadowContainer.getElementById("divPositionButtonsAfter").addEventListener("click", DomUtils.horizontalParentScroll);
    shadowContainer.getElementById("divPositionButtonsAfter").parentElement.addEventListener("scroll", DomUtils.horizontalParentScrollend);

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
   * @param {Object} options options de la position
   * @param {Object} options.lngLat position en paramètre (propriétés lng et lat), false si "Ma Position"
   * @param {string} options.text texte d'en-tête de la position
   * @param {string} options.html html situé avant les boutons d'action
   * @param {string} options.html2 html situé après les boutons d'action
   * @param {Function} options.hideCallback fonction de callback pour la fermeture de la position (pour les animations)
   * @param {string} options.type type de position : default, myposition ou landmark
   * @public
   */
  async compute(options = {}) {
    const lngLat = options.lngLat || false;
    const text = options.text ||  "Repère placé";
    const html = options.html || "";
    const html2 = options.html2 || "";
    const hideCallback = options.hideCallback || null;
    const type = options.type || "default";
    this.clear();
    if (this.hideCallback) {
      this.hideCallback();
      this.hideCallback = null;
    }
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
    this.additionalHtml.beforeButtons = html;
    this.additionalHtml.afterButtons = html2;

    this.coordinates = position.coordinates;
    this.address = Reverse.getAddress() || {
      number: "",
      street: "",
      postcode: "",
      city: ""
    };

    this.#render(type);
    if (hideCallback) {
      this.hideCallback = hideCallback;
    }
    if (type === "myposition") {
      this.map.flyTo({ center: [this.coordinates.lon, this.coordinates.lat] });
    }
    Elevation.compute(position.coordinates).then( () => {
      this.elevation = Elevation.getElevation();
      this.#setShareContent(this.coordinates.lat, this.coordinates.lon, this.elevation.toLocaleString());
      document.getElementById("positionAltitudeSpan").innerText = this.elevation.toLocaleString();
    }).catch( (err) => {
      if (err.name === "AbortError") {
        return;
      }
      if (!this.coordinates) {
        return;
      }
      console.warn(`Error when fetching elevation: ${err}`);
      this.elevation = "?";
      this.#setShareContent(this.coordinates.lat, this.coordinates.lon, this.elevation);
      document.getElementById("positionAltitudeSpan").innerText = this.elevation;
    });
  }

  #setShareContent(latitude, longitude, altitude = "") {
    const trueHeader = this.#getTrueHeader();
    var altitudeText = "";
    if (altitude !== "") {
      altitudeText = `
Altitude : ${altitude} m`;
    }

    const zoom = Math.round(this.map.getZoom() * 100) / 100;
    this.shareContent = `${trueHeader ? trueHeader : this.header}
${this.name}
Latitude : ${latitude}
Longitude : ${longitude}${altitudeText}
https://cartes-ign.ign.fr?lng=${longitude}&lng=${latitude}&z=${zoom}`;
  }

  /* Transforme le HTML du header de la position en texte pour le partage */
  #getTrueHeader() {
    let trueHeader = this.header;
    if (this.header.includes("landmarkSummaryIcon")) {
      trueHeader = DomUtils.stringToHTML(this.header.trim()).innerText.trim();
    } else if (this.header.includes("divLegendDescription")) {
      trueHeader = DomUtils.stringToHTML(this.header.trim()).querySelector(".divLegendDescription").innerHTML.trim().replace("<br>", "\n");
    }
    if (trueHeader.includes("positionSubTitle")) {
      trueHeader = trueHeader.trim().replace("<p class=\"positionSubTitle\">", "\n").replace("</p>", "\n");
    }
    return trueHeader;
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
    if (this.hideCallback) {
      this.hideCallback();
      this.hideCallback = null;
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
    this.additionalHtml = {
      beforeButtons: "",
      afterButtons: ""
    };
  }
}

export default Position;
