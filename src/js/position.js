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
import { Clipboard } from "@capacitor/clipboard";

import ActionSheet from "./action-sheet";
import PopupUtils from "./utils/popup-utils";

import LoadingDark from "../css/assets/loading-darkgrey.svg";
import ImmersivePosion from "./immersive-position";
import domUtils from "./utils/dom-utils";

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

    this.addressInfoPopup = {
      popup: null
    };

    this.immersivePosition = null;

    return this;
  }

  /**
   * rendu du menu
   * @param {string} type type de position default, myposition ou landmark
   * @param {boolean} isEvent si c'est un événement (pour le style)
   * @private
   */
  #render(type, isEvent = false) {
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
    var altitudeHtml = `<img src="${LoadingDark}" height="8px" title="Chargement de l'altitude en cours...">`;
    var templateAddress;
    var eventClass = "";
    if (isEvent) {
      eventClass = " event";
    }

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

    this.#setShareContent(latitude, longitude, "", type);
    // template litteral
    var htmlButtons = `
      <button id="positionRoute" class="btnPositionButtons${eventClass}"><label class="lblPositionImg lblPositionRouteImg"></label>S'y rendre</button>
      <button id="positionNear" class="btnPositionButtons secondary${eventClass}"><label class="lblPositionImg lblPositionNearImg"></label>À proximité</button>
      <button id="positionShare" class="btnPositionButtons secondary${eventClass}"><label class="lblPositionImg lblPositionShareImg"></label>Partager</button>
      <button id="positionLandmark" class="btnPositionButtons secondary${eventClass}"><label class="lblPositionImg lblPositionLandmarkImg"></label>Enregistrer</button>
      <button id="positionSignal" class="btnPositionButtons secondary${eventClass}"><label class="lblPositionImg lblPositionSignalImg"></label>Signaler</button>
      `;

    if (type === "myposition") {
      htmlButtons = `
        <button id="positionShare" class="btnPositionButtons"><label class="lblPositionImg lblPositionShareImg"></label>Partager</button>
        <button id="positionNear" class="btnPositionButtons secondary"><label class="lblPositionImg lblPositionNearImg"></label>À proximité</button>
        <button id="positionRoute" class="btnPositionButtons secondary"><label class="lblPositionImg lblPositionRouteImg"></label>S'y rendre</button>
        <button id="positionLandmark" class="btnPositionButtons secondary"><label class="lblPositionImg lblPositionLandmarkImg"></label>Point de repère</button>
      `;
    }

    var htmlAdvanced = "";
    // Si c'est un landmark
    if (type === "landmark") {
      htmlButtons = `
        <button id="positionRoute" class="btnPositionButtons"><label class="lblPositionImg lblPositionRouteImg"></label>S'y rendre</button>
        <button id="positionNear" class="btnPositionButtons secondary"><label class="lblPositionImg lblPositionNearImg"></label>À proximité</button>
        <button id="positionShare" class="btnPositionButtons secondary"><label class="lblPositionImg lblPositionShareImg"></label>Partager</button>
        <button id="positionSignal" class="btnPositionButtons secondary"><label class="lblPositionImg lblPositionSignalImg"></label>Signaler</button>
      `;
      htmlAdvanced = `
        <label id="position-landmark-show-advanced-tools" title="Plus d'outils" class="tools-layer-advanced" role="button" tabindex="0"></label>
      `;
    }

    // template litteral
    var strContainer = `
      <div id="${id.main}">
          <div class="divPositionTitleWrapper"><div class="divPositionTitle">${this.header}</div>${htmlAdvanced}</div>
          <div class="divPositionAdressOriginInfo${eventClass}">Adresse la plus proche du point sélectionné</div>
          <div class="divPositionAddress">
              <label class="lblPositionImgAddress${eventClass}"></label>
              <div class="divPositionSectionAddress fontLight">
                ${templateAddress}
                <div class="divPositionCoord fontLight">
                  <span id="positionCoordsSpan">(${latitude}, ${longitude})</span><span> - Alt : <span id="positionAltitudeSpan">${altitudeHtml}</span> m</span>
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
        if (Globals.directions.dom.inputArrival.value && Globals.directions.dom.inputDeparture.value) {
          Globals.directions.dom.buttonCompute.classList.remove("disabled");
        }
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
          if (type !== "myposition" && this.#getTrueHeader() !== "Repère placé") {
            let landmarkTitle = document.getElementById("landmark-title");
            landmarkTitle.value = this.#getTrueHeader().split("\n")[0];
            if (this.additionalHtml.beforeButtons) {
              let landmarkDesc = document.getElementById("landmark-description");
              let tempDomElem = domUtils.stringToHTML(this.additionalHtml.beforeButtons);
              document.body.appendChild(tempDomElem);
              landmarkDesc.value = tempDomElem.innerText;
              document.body.removeChild(tempDomElem);
            }
            document.getElementById("landmarkWindow").querySelector(".landmark-submit").classList.remove("disabled");
          }
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
      shadowContainer.getElementById("position-landmark-show-advanced-tools").addEventListener("click", () => {
        ActionSheet.show({
          options: [
            {
              class: "tools-layer-share",
              text: "Partager",
              value: "share",
            },
            {
              class: "tools-layer-edit",
              text: "Modifier",
              value: "edit",
            },
            {
              class: "tools-layer-export",
              text: "Exporter",
              value: "export",
            },
            {
              class: "tools-layer-remove confirm-needed",
              text: "Supprimer",
              value: "delete",
              confirmCallback: () => {
                Toast.show({
                  text: "Confirmez la suppression du point de repère",
                  duration: "short",
                  position: "bottom"
                });
              }
            },
          ],
          timeToHide: 50,
        }).then( (value) => {
          if (value === "share") {
            Globals.myaccount.shareLandmarkFromID(landmarkId);
          }
          if (value === "edit") {
            closeSelf();
            Globals.myaccount.editLandmarkFromID(landmarkId);
          }
          if (value === "export") {
            Globals.myaccount.exportLandmarkFromID(landmarkId);
          }
          if (value === "delete") {
            closeSelf();
            Globals.myaccount.deleteLandmark(landmarkId);
          }
        });
      });
    }
    shadowContainer.querySelector(".divPositionAdressOriginInfo").addEventListener("click", this.#showAdressInfoPopup.bind(this));

    shadowContainer.getElementById("divPositionButtonsAfter").addEventListener("click", DomUtils.horizontalParentScroll);
    shadowContainer.getElementById("divPositionButtonsAfter").parentElement.addEventListener("scroll", DomUtils.horizontalParentScrollend);

    shadowContainer.getElementById("positionCoordsSpan").addEventListener("click", () => {
      let coordinates = this.coordinates;
      Clipboard.write({
        string: `${coordinates.lat}, ${coordinates.lon}`
      }).then( () => {
        Toast.show({
          text: "Coordonnées copiées dans le presse-papier",
          duration: "short",
          position: "bottom"
        });
      });
    });
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
   * @param {string} options.type type de position : default, context, myposition ou landmark
   * @public
   */
  async compute(options = {}) {
    const lngLat = options.lngLat || false;
    const text = options.text || "Repère placé";
    let html = options.html || "";
    const html2 = options.html2 || "";
    const hideCallback = options.hideCallback || null;
    const type = options.type || "default";
    const isEvent = options.isEvent || false;
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
    this.coordinates = position.coordinates;
    if (type === "myposition" || type === "context") {
      this.immersivePosition = new ImmersivePosion({lat: this.coordinates.lat, lng: this.coordinates.lon});
      html = `<div id="immersivePostionHtmlBefore">${this.immersivePosition.computeHtml()}</div>`;
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

    this.address = Reverse.getAddress() || {
      number: "",
      street: "",
      postcode: "",
      city: ""
    };

    this.#render(type, isEvent);
    if (hideCallback) {
      this.hideCallback = hideCallback;
    }
    if (type === "myposition") {
      this.map.flyTo({ center: [this.coordinates.lon, this.coordinates.lat] });
    }
    Elevation.compute(position.coordinates).then( () => {
      this.elevation = Elevation.getElevation();
      this.#setShareContent(this.coordinates.lat, this.coordinates.lon, this.elevation.toLocaleString(), type);
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
      this.#setShareContent(this.coordinates.lat, this.coordinates.lon, this.elevation, type);
      if (document.getElementById("positionAltitudeSpan")) {
        document.getElementById("positionAltitudeSpan").innerText = this.elevation;
      }
    });

    if (type === "myposition" || type === "context") {
      this.immersivePosition.addEventListener("dataLoaded", () => {
        if (document.getElementById("immersivePostionHtmlBefore")) {
          document.getElementById("immersivePostionHtmlBefore").innerHTML = this.immersivePosition.computeHtml();
        }
      });
      this.immersivePosition.computeAll();
    }
  }

  #setShareContent(latitude, longitude, altitude = "", type = "") {
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
https://cartes-ign.ign.fr?lng=${longitude}&lat=${latitude}&z=${zoom}`;
    if (type === "landmark") {
      this.shareContent = `${trueHeader ? trueHeader : this.header}
${this.name}
Latitude : ${latitude}
Longitude : ${longitude}${altitudeText}
${domUtils.stringToHTML(this.additionalHtml.beforeButtons).innerText}
https://cartes-ign.ign.fr?lng=${longitude}&lat=${latitude}&z=15&titre=${encodeURI(trueHeader ? trueHeader : this.header)}&description=${encodeURI(domUtils.stringToHTML(this.additionalHtml.beforeButtons).innerText)}`;
    }
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

  #showAdressInfoPopup() {
    PopupUtils.showPopup(
      `
      <div id="addressInfoPopup">
          <div class="divPositionTitle">Adresse la plus proche du point sélectionné</div>
          <div class="divPopupClose" onclick="onCloseaddressInfoPopup(event)"></div>
          <div class="divPopupContent">
              L'adresse affichée est obtenue grâce au service de géocodage inverse. Ce service retourne, à partir d'un point sur la carte, l'adresse de la Base Adresse Nationale (BAN) la plus proche. Selon ce principe, une adresse affichée peut différer de l'adresse connue d'un lieu.
          </div>
      </div>
      `,
      this.map,
      "addressInfoPopup",
      "onCloseaddressInfoPopup",
      this.addressInfoPopup
    );
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
    this.immersivePosition = null;

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
