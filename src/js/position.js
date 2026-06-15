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
import ImageCarousel from "./utils/image-carousel";
import { Share } from "@capacitor/share";
import { Toast } from "@capacitor/toast";
import { Clipboard } from "@capacitor/clipboard";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
import maplibregl from "maplibre-gl";
import NearestPointOnLine from "@turf/nearest-point-on-line";

import ActionSheet from "./action-sheet";
import PopupUtils from "./utils/popup-utils";

import LoadingDark from "../css/assets/loading-darkgrey.svg";
import ImmersivePosion from "./immersive-position";
import domUtils from "./utils/dom-utils";
import jsUtils from "./utils/js-utils";
import ElevationLineControl from "./elevation-line-control/elevation-line-control";

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

    // Pour le cas Geotrek : informations sur un itinéraire
    this.geotrekRoute = null;
    this.elevationProfile = null;

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

    if (type === "geotrek" && this.geotrekRoute) {
      htmlButtons = `
        <button id="positionSave" class="btnPositionButtons"><label class="lblPositionImg lblPositionSaveImg"></label>Enregistrer</button>
        <button id="positionShare" class="btnPositionButtons secondary"><label class="lblPositionImg lblPositionShareImg"></label>Partager</button>
        <button id="positionExport" class="btnPositionButtons secondary"><label class="lblPositionImg lblPositionExportImg"></label>Exporter</button>
      `;
    }
    if (type === "sentiers-balises") {
      htmlButtons = `
        <button id="positionRoute" class="btnPositionButtons${eventClass}"><label class="lblPositionImg lblPositionRouteImg"></label>S'y rendre</button>
        <button id="positionNear" class="btnPositionButtons secondary${eventClass}"><label class="lblPositionImg lblPositionNearImg"></label>À proximité</button>
        <button id="positionSignal" class="btnPositionButtons secondary${eventClass}"><label class="lblPositionImg lblPositionSignalImg"></label>Signaler</button>
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
          ${this.additionalHtml.eventHtml}
          ${this.additionalHtml.beforeAddress}
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
    if (shadowContainer.getElementById("positionShare")) {
      shadowContainer.getElementById("positionShare").addEventListener("click", () => {
        Share.share({
          title: `Partager ${this.#getTrueHeader()}}`,
          text: this.shareContent,
          dialogTitle: "Partager la position",
        });
      });
    }
    if (shadowContainer.getElementById("positionNear")) {
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
    }
    if (shadowContainer.getElementById("positionRoute")) {
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
    }
    if (type === "geotrek" && this.geotrekRoute) {
      shadowContainer.getElementById("positionSave").addEventListener("click", async () => {
        const accountRoute = Globals.myaccount.geojsonToRoute({
          type: "Feature",
          geometry: JSON.parse(this.geotrekRoute.geometry),
          data: {
            name: this.geotrekRoute.nom_itineraire,
            distance: this.geotrekRoute.longueur,
            duration: parseFloat(this.geotrekRoute.duree) * 3600,
            elevationData: this.elevationProfile.getData(),
          }
        });
        Globals.myaccount.addRoute(accountRoute);
        Toast.show({
          text: "Itinéraire ajouté aux enregistrements",
          duration: "long",
          position: "bottom"
        });
      });
      shadowContainer.getElementById("positionExport").addEventListener("click", async () => {
        Toast.show({
          text: "Exportation de l'itinéraire...",
          duration: "short",
          position: "bottom"
        });
        fetch(this.geotrekRoute.gpx).then( (resp) => resp.text()).then( (gpxString) => {
          Filesystem.writeFile({
            path: this.geotrekRoute.gpx.split("/").splice(-1),
            data: gpxString,
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
          });
          // For testing purposes
          if (!Capacitor.isNativePlatform()) {
            jsUtils.download(this.geotrekRoute.gpx.split("/").splice(-1), gpxString);
          }
        });
      });
    }
    if (shadowContainer.getElementById("positionLandmark")) {
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
    if (shadowContainer.getElementById("positionSignal")) {
      shadowContainer.getElementById("positionSignal").addEventListener("click", () => {
        const coordinates = this.coordinates;
        Globals.isochrone.clear();
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
        if (cl.startsWith("landmarkPosition-")) {
          landmarkId = cl.replace("landmarkPosition-", "");
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
    if (type === "geotrek" && this.geotrekRoute) {
      const list_urls = [];
      const list_credits = [];
      if (this.geotrekRoute.medias && this.geotrekRoute.medias !== "[]" && document.getElementById("geotrek-carousel")) {
        JSON.parse(this.geotrekRoute.medias).forEach( (media) => {
          if (media.type_media === "image") {
            list_urls.push(media.url);
            list_credits.push(media.auteur);
          }
        });
        new ImageCarousel(document.getElementById("geotrek-carousel"), list_urls, {
          imageTitle: this.geotrekRoute.nom_itineraire,
          imageCredits: list_credits,
          fixedHeight: 220,
          squareWidth: 196,
          backButtonState: "position",
          shareActivated: false,
          noMargins: true,
        });
      }
      if (document.getElementById("geotrek-profile")) {
        this.elevationProfile = new ElevationLineControl({target: document.getElementById("geotrek-profile")});
        this.elevationProfile.setCoordinates(JSON.parse(this.geotrekRoute.geometry).coordinates);
        this.elevationProfile.compute(this.geotrekRoute.longueur).then(() => {
          Array.from(document.getElementsByClassName("geotrek-elevation-positive")).forEach((el) => {
            el.innerText = this.elevationProfile.dplus.toLocaleString("fr-FR");
          });
          Array.from(document.getElementsByClassName("geotrek-elevation-negative")).forEach((el) => {
            el.innerText = this.elevationProfile.dminus.toLocaleString("fr-FR");
          });
        });
      }
    }

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
   * @param {string} options.htmlBeforeAddress html situé avant l'adresse
   * @param {string} options.htmlEvent html spécifique pour les événements (ex. icône de l'événement à côté du titre)
   * @param {Function} options.hideCallback fonction de callback pour la fermeture de la position (pour les animations)
   * @param {string} options.type type de position : default, context, myposition ou landmark
   * @param {Object} options.feature
   * @public
   */
  async compute(options = {}) {
    const lngLat = options.lngLat || false;
    const text = options.text || "Repère placé";
    let html = options.html || "";
    const html2 = options.html2 || "";
    const htmlEvent = options.htmlEvent || "";
    const htmlBeforeAddress = options.htmlBeforeAddress || "";
    const hideCallback = options.hideCallback || null;
    const type = options.type || "default";
    const isEvent = options.isEvent || false;
    const feature = options.feature || null;
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
    this.additionalHtml.eventHtml = htmlEvent;
    this.additionalHtml.beforeAddress = htmlBeforeAddress;

    this.address = Reverse.getAddress() || {
      number: "",
      street: "",
      postcode: "",
      city: ""
    };

    if (type === "geotrek") {
      if (!this.map.getSource("geotrek-geom")) {
        this.map.addSource("geotrek-geom", {
          "type": "geojson",
          "data": {
            "type": "FeatureCollection",
            "features": []
          },
        });
        this.map.addSource("geotrek-start", {
          "type": "geojson",
          "data": {
            "type": "FeatureCollection",
            "features": []
          },
        });
        this.map.addSource("geotrek-end", {
          "type": "geojson",
          "data": {
            "type": "FeatureCollection",
            "features": []
          },
        });
        this.map.addLayer({
          id: "geotrek-geom-casing",
          type: "line",
          source: "geotrek-geom",
          paint: {
            "line-width": 8,
            "line-color": "white",
          },
          layout: {
            "line-cap": "round",
            "line-join": "round"
          },
        });
        this.map.addLayer({
          id: "geotrek-geom",
          type: "line",
          source: "geotrek-geom",
          paint: {
            "line-width": 5,
            "line-color": "#3993F3",
          },
          layout: {
            "line-cap": "round",
            "line-join": "round"
          },
        });
        this.map.addLayer({
          "id": "geotrek-start",
          "type": "symbol",
          "source": "geotrek-start",
          "layout": {
            "icon-image": "pill-black",
            "icon-text-fit": "width",
            "text-field": [
              "format",
              ["image", [
                "match",
                ["get", "pratique"],
                "Pédestre", "pedestre-white",
                "VTT", "vtt-white",
                "Équestre", "equestre-white",
                "pedestre-white"
              ]],

              "   ",
              ["get", "kilometers"],
              "   ",

              ["image", [
                "concat",
                "dot-",
                [
                  "match",
                  ["get", "difficulte"],
                  "Tresfacile", "Tresfacile",
                  "Facile", "Facile",
                  "Difficile", "Difficile",
                  "Tresdifficile", "Tresdifficile",
                  "default"
                ]
              ]]
            ],
            "text-size": 14,
            "text-font": ["Source Sans Pro Semibold"],
          },
          "paint": {
            "text-color": "white",
            "icon-translate": [0, -20],
            "text-translate": [0, -24],
          }
        });
        this.map.addLayer({
          "id": "geotrek-end",
          "type": "symbol",
          "source": "geotrek-end",
          "layout": {
            "icon-image": "pill-black",
            "icon-text-fit": "width",
            "text-field": "Arrivée",
            "text-size": 14,
            "text-font": ["Source Sans Pro Semibold"],
          },
          "paint": {
            "text-color": "white",
            "icon-translate": [0, -20],
            "text-translate": [0, -24],
          }
        });
      }
      this.map.getSource("geotrek-start").setData(feature);
      if (!["boucle", "aller-retour"].includes(feature.properties.type_itineraire.toLowerCase())) {
        this.map.getSource("geotrek-end").setData({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: JSON.parse(feature.properties.geometry).coordinates.splice(-1)[0]
          }
        });
      }
      const geojsonRoute = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: JSON.parse(feature.properties.geometry),
          }
        ]
      };
      this.map.getSource("geotrek-geom").setData(geojsonRoute);
      this.map.setLayoutProperty("geotrek-composite-pill$$$HIKING.GEOTREK$TMS", "visibility", "none");

      let padding;
      // gestion du mode paysage / écran large
      if (window.matchMedia("screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
        var paddingLeft = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-left").slice(0, -2)) +
                    Math.min(window.innerHeight, window.innerWidth/2) + 42;
        padding = {top: 20, right: 20, bottom: 20, left: paddingLeft};
      } else {
        padding = {top: 80, right: 20, bottom: this.map.getContainer().offsetHeight / 2 - 85, left: 20};
      }
      const coords = JSON.parse(feature.properties.geometry).coordinates;
      const bounds = coords.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new maplibregl.LngLatBounds(coords[0], coords[0]));
      if (Location.isTrackingActive()) {
        Location.disableTracking();
      }
      this.map.fitBounds(bounds, {
        padding: padding,
      });
      // Ajouts des points d'étape
      if (feature.properties.points_reference) {
        if (!this.map.getSource("geotrek-steps")) {
          this.map.addSource("geotrek-steps", {
            "type": "geojson",
            "data": {
              "type": "FeatureCollection",
              "features": []
            },
          });
          this.map.addLayer({
            id: "geotrek-steps-circles",
            type: "circle",
            source: "geotrek-steps",
            minzoom: 11,
            paint: {
              "circle-radius": 15,
              "circle-color": "white",
              "circle-stroke-width": 2,
              "circle-stroke-color": "#B8BCC1",
            },
            layout: {
              "circle-sort-key": ["-", ["get", "index"]]
            }
          }, "geotrek-start");

          this.map.addLayer({
            id: "geotrek-steps-labels",
            type: "symbol",
            source: "geotrek-steps",
            minzoom: 11,
            layout: {
              "symbol-sort-key": ["get", "index"],
              "text-field": ["get", "index"],
              "text-size": 12,
              "text-font": ["Source Sans Pro Semibold"]
            },
            paint: {
              "text-color": "black"
            }
          }, "geotrek-start");
        }

        const multipoint = JSON.parse(feature.properties.points_reference);
        const features = multipoint.coordinates.map((coords, i) => {
          const point = NearestPointOnLine(JSON.parse(feature.properties.geometry), {type: "Point", coordinates: coords});
          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: point.geometry.coordinates
            },
            properties: {
              index: (i + 1)
            }
          };
        });
        const geojson = {
          type: "FeatureCollection",
          features
        };
        this.map.getSource("geotrek-steps").setData(geojson);
      }
      this.geotrekRoute = feature.properties;
    }
    if (type === "sentiers-balises") {
      if (!this.map.getSource("sentiers-balises-highlight")) {
        this.map.addSource("sentiers-balises-highlight", {
          "type": "geojson",
          "data": {
            "type": "FeatureCollection",
            "features": []
          },
        });
        this.map.addLayer({
          id: "sentiers-balises-highlight",
          type: "line",
          source: "sentiers-balises-highlight",
          paint: {
            "line-width": {
              "stops": [
                [
                  5,
                  1.5
                ],
                [
                  18,
                  1.9
                ]
              ]
            },
            "line-color": "#00FFB6",
          },
          layout: {
            "line-cap": "round",
            "line-join": "round"
          },
        });
      }
      const geojsonRoute = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: feature.geometry,
          }
        ]
      };
      this.map.getSource("sentiers-balises-highlight").setData(geojsonRoute);
    }

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
    } else if (this.header.includes("positionTitle")) {
      const headerDiv = DomUtils.stringToHTML("<div>" + this.header + "</div>");
      trueHeader = "";
      for (const paragraph of headerDiv.querySelectorAll("p")) {
        trueHeader += paragraph.innerText + "\n";
      }
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
