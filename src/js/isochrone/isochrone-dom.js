/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import DomUtils from "../utils/dom-utils";
import LoadingWhite from "../../css/assets/loading-white.svg";

import { Toast } from "@capacitor/toast";

/**
 * DOM du contrôle du calcul d'isochrone
 * @mixin IsochroneDOM
 * @todo filtrage des POI
 */
let IsochroneDOM = {

  /**
   * DOM utile pour la classe métier
   */
  dom: {
    form: null,
    location: null,
    modeDistance: null,
    distanceValue: null,
    modeDuration: null,
    durationValueMinutes: null,
    transportCar: null,
    transportPedestrian: null
  },

  /**
   * obtenir le container principal
   * @param {*} opts - options
   * @returns {DOMElement}
   * @public
   */
  getContainer(opts) {
    // contexte
    var self = this;

    // presences des POI
    var strPoi = "";
    if (opts && opts.thematics) {
      var tplPoiItem = (values) => {
        var checked = null;
        if (values.visible) {
          checked = "checked";
        }
        return `
        <label class="lblIsochroneFilter chkContainer" title="${values.id}">
          ${values.name}
          <input
            class="inputIsochroneFilterItem checkbox"
            type="checkbox"
            name="${values.id}"
            value="${values.id}"
            ${checked}>
          <span class="checkmark"></span>
        </label>
        `;
      };
      var strPoiItems = "";
      var cfg = opts.thematics;
      for(let i = 0; i < cfg.length; i++) {
        var item = cfg[i];
        strPoiItems += tplPoiItem({
          id : item.id,
          name : item.name,
          visible : item.visible
        });
      }

      strPoi = `
      <div class="section">
        <div class="divPOIDisplay">
          <span class="filterTitle">Afficher les centres d'intérêt</span>
          <label class="toggleSwitch">
            <input id="displayPOI-isochrone" class="toggleInput" type="checkbox" checked>
            <span class="toggleSlider"></span>
          </label>
        </div>

        <div class="divIsochronePOIFilter">
          ${strPoiItems}
        </div>
      </div>
      `;
    }

    // container
    var strContainer = `
        <div id="isochroneContainer">
          <form id="isochroneForm" onkeypress="return event.keyCode != 13;">
            <!-- titre -->
              <p class="pIsochroneTitleTitle pIsochroneTitle">Découvrir à proximité de :</p>
              <!-- location -->
              <div id="isochroneLocationContainer">
                <input id="isochroneLocation" class="inputIsochroneLocation" type="text" placeholder="Ma position, un lieu ou une adresse..." name="location" data-coordinates="">
                <div id="clearIsochroneLocation" class="d-none"></div>
              </div>
              <!-- type de calcul : distance / temps -->
              <div class="section">
                <div class="divIsochroneMode">
                  <input id="isochroneModeDuration" type="radio" name="Mode" value="Temps" checked="true">
                  <label id="isochroneModeDurationLabel" class="lblIsochroneMode" for="isochroneModeDuration" title="Durée">Durée</label>
                  <input id="isochroneModeDistance" type="radio" name="Mode" value="Distance">
                  <label id="isochroneModeDistanceLabel" class="lblIsochroneMode" for="isochroneModeDistance" title="Distance">Distance</label>
                  <span class="sliderIsochrone"></span>
                </div>
                <div id="isochroneModeValueDuration">
                  <p class="pIsochroneTitle">Définir un temps de trajet - 60 min max</p>
                  <div id="isochroneValueDuration" class="divIsochroneValue">
                    <input id="isochroneValueDurationInputMinutes" type="text" inputmode="numeric" placeholder="0">
                    <label class="unit">min</label>
                  </div>
                </div>
                <div id="isochroneModeValueDistance" class="isochroneValueHidden">
                  <p class="pIsochroneTitle">Définir une distance - 50 km max</p>
                  <div id="isochroneValueDistance" class="divIsochroneValue">
                    <input id="isochroneValueDistanceInput" type="text" inputmode="numeric"" placeholder="0">
                    <label class="unit">km</label>
                  </div>
                </div>
              </div>
              <!-- transport -->
              <div class="section">
                <p class="pIsochroneTitle">Choisir un moyen de transport</label>
                <div class="divIsochroneTransport">
                  <input id="isochroneTransportPieton" type="radio" name="Transport" value="Pieton" checked="true">
                  <label class="lblIsochroneTransport" for="isochroneTransportPieton" title="À pied">À pied</label>
                  <input id="isochroneTransportVoiture" type="radio" name="Transport" value="Voiture">
                  <label class="lblIsochroneTransport" for="isochroneTransportVoiture" title="Véhicule">Véhicule</label>
                  <span class="sliderIsochrone"></span>
                </div>
              </div>
              ${strPoi}
              <div class="divIsochroneDisplayOptions">
                <div class="divIsochroneDisplayOption">
                  <span>Afficher le contour de ma zone de recherche</span><label class="toggleSwitch"><input id="showLimitsChk" class="toggleInput" type="checkbox" checked><span class="toggleSlider"></span></label>
                </div>
                <div class="divIsochroneDisplayOption">
                  <span>Afficher les centres d’intérêt en dehors de ma zone de recherche</span><label class="toggleSwitch"><input id="showOutPoisChk" class="toggleInput" type="checkbox" ><span class="toggleSlider"></span></label>
                </div>

              </div>
              <!-- bouton de calcul -->
              <input id="isochroneCompute" class="btnIsochroneCompute" type="submit" value="Valider">
          </form>
        </div>
    `;

    // transformation du container : String -> DOM
    var container = DomUtils.stringToHTML(strContainer.trim());

    // ajout du shadow DOM
    const shadow = container.attachShadow({ mode: "open" });
    shadow.innerHTML = strContainer.trim();

    // defini les objets du dom utiles
    this.dom.form = shadow.getElementById("isochroneForm");
    this.dom.location = shadow.getElementById("isochroneLocation");
    this.dom.modeDistance = shadow.getElementById("isochroneModeDistance");
    this.dom.distanceValue = shadow.getElementById("isochroneValueDistanceInput");
    this.dom.modeDuration = shadow.getElementById("isochroneModeDuration");
    this.dom.durationValueMinutes = shadow.getElementById("isochroneValueDurationInputMinutes");
    this.dom.transportCar = shadow.getElementById("isochroneTransportVoiture");
    this.dom.transportPedestrian = shadow.getElementById("isochroneTransportPieton");
    this.dom.showLimitsChk = shadow.getElementById("showLimitsChk");
    this.dom.showOutPoisChk = shadow.getElementById("showOutPoisChk");
    this.dom.isochroneCompute = shadow.getElementById("isochroneCompute");
    this.dom.poiToggle = shadow.getElementById("displayPOI-isochrone");
    this.dom.clearLocation = shadow.getElementById("clearIsochroneLocation");

    const limitInputValue = (limit) => {
      return function(e) {
        if (e.target.value < 0) {
          Toast.show({
            text: "La valeur saisie doit être supérieure à 0",
            duration: "short",
            position: "bottom"
          });
        }
        if (e.target.value > limit) {
          Toast.show({
            text: "La valeur saisie doit être inférieure ou égale à " + limit,
            duration: "short",
            position: "bottom"
          });
        }
        e.target.value = !!e.target.value && parseFloat(e.target.value) < 0 ? 0 : parseFloat(e.target.value) > limit ? limit : e.target.value;
      };
    };

    this.dom.durationValueMinutes.addEventListener("input", limitInputValue(60));
    this.dom.distanceValue.addEventListener("input", limitInputValue(50));

    this.dom.showOutPoisChk.addEventListener("change", (e) => {
      if (e.target.checked) {
        this.dom.showLimitsChk.checked = true;
        this.dom.showLimitsChk.disabled = true;
      } else {
        this.dom.showLimitsChk.disabled = false;
      }
    });

    // ajout des listeners principaux :
    // - le calcul
    // - l'ouverture du menu de recherche
    // - l'affichage du mode
    this.dom.form.addEventListener("submit", (e) => {
      e.preventDefault();
      // recuperer les valeurs des composants HTML:
      // - transport
      // - mode
      // - location

      var transport = null;
      // voiture ?
      if (self.dom.transportCar && self.dom.transportCar.checked) {
        transport = self.dom.transportCar.value;
      }
      // pieton ?
      if (self.dom.transportPedestrian && self.dom.transportPedestrian.checked) {
        transport = self.dom.transportPedestrian.value;
      }

      var mode = {
        type: null, // Temps ou Distance
        value: null // km ou secondes
      };
      // temps ?
      if (self.dom.modeDuration && self.dom.modeDuration.checked) {
        mode.type = self.dom.modeDuration.value;
        var minutes = parseInt(self.dom.durationValueMinutes.value, 10);
        if (isNaN(minutes)) {
          minutes = 0;
        }
        // durée exprimée en secondes
        mode.value = minutes * 60;
      }
      // distance ?
      if (self.dom.modeDistance && self.dom.modeDistance.checked) {
        mode.type = self.dom.modeDistance.value;
        // distance exprimée en kilomètres
        mode.value = parseFloat(self.dom.distanceValue.value);
      }
      // location
      var value = self.dom.location.dataset.coordinates;

      // affichage du contour
      var showOutline = self.dom.showLimitsChk.checked;
      // affichage des POI en dehors de la zone
      var showPoisOutside = self.dom.showOutPoisChk.checked;

      // type de POI à afficher
      var poisToDisplay = {};
      document.querySelectorAll(".inputIsochroneFilterItem").forEach( (el) => {
        poisToDisplay[el.value] = el.checked;
      });

      if (!mode.value) {
        Toast.show({
          text: "Ajoutez un temps ou une durée pour le calcul de la zone",
          duration: "long",
          position: "bottom"
        });
        return;
      }
      if (!value) {
        Toast.show({
          text: "Ajoutez un point de départ pour le calcul de la zone",
          duration: "long",
          position: "bottom"
        });
        return;
      }

      // passer les valeurs au service
      self.compute({
        transport: transport,
        mode: mode,
        location: value,
        showOutline: showOutline,
        showPoisOutside: showPoisOutside,
        poisToDisplay: poisToDisplay,
      });

      return false;
    });
    this.dom.location.addEventListener("click", (e) => {
      // ouverture du menu de recherche
      self.onOpenSearchLocation(e);
    });
    this.dom.modeDistance.addEventListener("click", () => {
      document.getElementById("isochroneModeValueDistance").className = "";
      document.getElementById("isochroneModeValueDuration").className = "isochroneValueHidden";
    });
    this.dom.modeDuration.addEventListener("click", () => {
      document.getElementById("isochroneModeValueDuration").className = "";
      document.getElementById("isochroneModeValueDistance").className = "isochroneValueHidden";
    });

    this.dom.poiToggle.addEventListener("change", (e) => {
      const toggleChecked = e.target.checked;
      if (toggleChecked) {
        this.dom.showLimitsChk.disabled = false;
      } else {
        this.dom.showLimitsChk.checked = true;
        this.dom.showLimitsChk.disabled = true;
        Toast.show({
          text: "Aucun centre d’intérêt n'est sélectionné. La zone de contour est obligatoire.",
          duration: "long",
          position: "bottom"
        });
      }
      document.querySelectorAll(".inputIsochroneFilterItem").forEach((el) => {
        if (toggleChecked) {
          el.checked = true;
        } else {
          el.checked = false;
        }
      });
    });
    this.dom.form.querySelectorAll(".inputIsochroneFilterItem").forEach((el) => {
      el.addEventListener("change", () => {
        let allUnchecked = true;
        let allChecked = true;
        document.querySelectorAll(".inputIsochroneFilterItem").forEach((el) => {
          if (el.checked) {
            allUnchecked = false;
            this.dom.showLimitsChk.disabled = false;
          } else {
            allChecked = false;
          }
        });
        if (allChecked) {
          this.dom.poiToggle.checked = true;
        }
        if (allUnchecked) {
          this.dom.poiToggle.checked = false;
          this.dom.showLimitsChk.checked = true;
          this.dom.showLimitsChk.disabled = true;
          Toast.show({
            text: "Aucun centre d’intérêt n'est sélectionné. La zone de contour est obligatoire.",
            duration: "long",
            position: "bottom"
          });
        }
      });
    });
    this.dom.clearLocation.addEventListener("click", () => {
      this.dom.location.value = "";
      this.dom.location.dataset.coordinates = "";
      this.dom.clearLocation.classList.add("d-none");
    });

    return shadow;
  },

  /**
   * bouton de calcul en mode chargement
   * @private
   */
  __setComputeButtonLoading () {
    this.dom.isochroneCompute.value = "";
    this.dom.isochroneCompute.disabled = true;
    this.dom.isochroneCompute.style.backgroundImage = "url(" + LoadingWhite + ")";
    document.querySelectorAll("#isochroneLocationContainer").forEach((el) => {
      el.classList.add("disabled");
    });
  },

  /**
   * bouton de calcul: fin du chargement
   * @private
   */
  __unsetComputeButtonLoading () {
    this.dom.isochroneCompute.value = "Calculer";
    this.dom.isochroneCompute.disabled = false;
    this.dom.isochroneCompute.style.removeProperty("background-image");
    document.querySelectorAll("#isochroneLocationContainer").forEach((el) => {
      el.classList.remove("disabled");
    });
  },
};

export default IsochroneDOM;
