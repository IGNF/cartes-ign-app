import DomUtils from "../dom-utils";
import LoadingWhite from "../../css/assets/loading-white.svg";

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
    durationValueHours: null,
    durationValueMinutes: null,
    transportCar: null,
    transportPedestrian: null
  },

  /**
   * obtenir le container principal
   * @returns {DOMElement}
   * @public
   */
  getContainer() {
    // contexte
    var self = this;

    // container
    var strContainer = `
        <div id="isochroneContainer">
            <form id="isochroneForm" onkeypress="return event.keyCode != 13;">
                <!-- titre -->
                <p class="pIsochroneTitleTitle pIsochroneTitle">Lancer une recherche à proximité</p>
                <!-- location -->
                <div id="isochroneLocationContainer">
                  <input id="isochroneLocation" class="inputIsochroneLocation" type="text" placeholder="Saisir une adresse..." name="location" data-coordinates="">
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
                        <p class="pIsochroneTitle">Définir un temps de trajet</p>
                        <div id="isochroneValueDuration" class="divIsochroneValue">
                            <input id="isochroneValueDurationInputHours" min="0" step="1" type="number" placeholder="0">
                            <label class="unit">h</label>
                            <input id="isochroneValueDurationInputMinutes" min="0" max="59" step="1" type="number" placeholder="0">
                            <label class="unit">min</label>
                        </div>
                    </div>
                    <div id="isochroneModeValueDistance" class="isochroneValueHidden">
                        <p class="pIsochroneTitle">Définir une distance</p>
                        <div id="isochroneValueDistance" class="divIsochroneValue">
                            <input id="isochroneValueDistanceInput" min="0" step="any" type="number" placeholder="0">
                            <label class="unit">km</label>
                        </div>
                    </div>
                </div>
                <!-- transport -->
                <div class="section">
                    <p class="pIsochroneTitle">Comment vous déplacez-vous ?</label>
                    <div class="divIsochroneTransport">
                        <input id="isochroneTransportPieton" type="radio" name="Transport" value="Pieton" checked="true">
                        <label class="lblIsochroneTransport" for="isochroneTransportPieton" title="À pied">À pied</label>
                        <input id="isochroneTransportVoiture" type="radio" name="Transport" value="Voiture">
                        <label class="lblIsochroneTransport" for="isochroneTransportVoiture" title="Véhicule">Véhicule</label>
                        <span class="sliderIsochrone"></span>
                    </div>
                </div>
                <!-- TODO filtres POI -->
                <div class="section">
                    <p class="filterTitle">Lieux à afficher</label>
                    <div class="divIsochronePOIFilter">
                      <label class="lblIsochroneFilter chkContainer" for="isochroneFilterTest" title="Test">Test<input class="checkbox" type="checkbox" id="isochroneFilterTest" value="Test"><span class="checkmark"></span></label>
                      <label class="lblIsochroneFilter chkContainer" for="isochroneFilterTest" title="Test">Test<input class="checkbox" type="checkbox"><span class="checkmark"></span></label>
                      <label class="lblIsochroneFilter chkContainer" for="isochroneFilterTest" title="Test">Test<input class="checkbox" type="checkbox"><span class="checkmark"></span></label>
                      <label class="lblIsochroneFilter chkContainer" for="isochroneFilterTest" title="Test">Test<input class="checkbox" type="checkbox"><span class="checkmark"></span></label>
                      <label class="lblIsochroneFilter chkContainer" for="isochroneFilterTest" title="Test">Test<input class="checkbox" type="checkbox"><span class="checkmark"></span></label>
                      <label class="lblIsochroneFilter chkContainer" for="isochroneFilterTest" title="Test">Test<input class="checkbox" type="checkbox"><span class="checkmark"></span></label>
                    </div>
                </div>
                <!-- TODO option d'affichage -->
                <div class="divIsochroneDisplayOptions">
                  <span>Afficher le contour de ma zone de recherche</span><label class="toggleSwitch"><input id="showLimitsChk" class="toggleInput" type="checkbox" checked><span class="toggleSlider"></span></label>
                </div>
                <!-- bouton de calcul -->
                <input id="isochroneCompute" class="btnIsochroneCompute" type="submit" value="Calculer">
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
    this.dom.durationValueHours = shadow.getElementById("isochroneValueDurationInputHours");
    this.dom.durationValueMinutes = shadow.getElementById("isochroneValueDurationInputMinutes");
    this.dom.transportCar = shadow.getElementById("isochroneTransportVoiture");
    this.dom.transportPedestrian = shadow.getElementById("isochroneTransportPieton");
    this.dom.showLimitsChk = shadow.getElementById("showLimitsChk");
    this.dom.isochroneCompute = shadow.getElementById("isochroneCompute");

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
        var hours = parseInt(self.dom.durationValueHours.value, 10);
        if (isNaN && isNaN(hours)) {
          hours = 0;
        }
        var minutes = parseInt(self.dom.durationValueMinutes.value, 10);
        if (isNaN && isNaN(minutes)) {
          minutes = 0;
        }
        // durée exprimée en secondes
        mode.value = hours * 3600 + minutes * 60;
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

      // passer les valeurs au service
      self.compute({
        transport: transport,
        mode: mode,
        location: value,
        showOutline: showOutline,
      });

      return false;
    });
    this.dom.location.addEventListener("click", (e) => {
      // ouverture du menu de recherche
      self.onOpenSearchLocation(e);
    });
    this.dom.modeDistance.addEventListener("click", (e) => {
      document.getElementById("isochroneModeValueDistance").className = "";
      document.getElementById("isochroneModeValueDuration").className = "isochroneValueHidden";
    });
    this.dom.modeDuration.addEventListener("click", (e) => {
      document.getElementById("isochroneModeValueDuration").className = "";
      document.getElementById("isochroneModeValueDistance").className = "isochroneValueHidden";
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
