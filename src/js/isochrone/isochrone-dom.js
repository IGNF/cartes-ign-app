import DomUtils from "../dom-utils";

/**
 * DOM du contrôle du calcul d'isochrone
 * @mixin IsochroneDOM
 * @todo filtrage des POI
 * @todo gestion de l'option d'affichages
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
      }
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
        <label class="filterTitle">Lieux à afficher</label>
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
              <p class="pIsochroneTitleTitle pIsochroneTitle">Lancer une recherche à proximité</p>
              <!-- location -->
              <input id="isochroneLocation" class="inputIsochroneLocation" type="text" placeholder="Saisir une adresse..." name="location" data-coordinates="">
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
                    <input id="isochroneValueDurationInputHours" min="0" step="1" type="number">
                    <label class="unit">h</label>
                    <input id="isochroneValueDurationInputMinutes" min="0" max="59" step="1" type="number">
                    <label class="unit">min</label>
                  </div>
                </div>
                <div id="isochroneModeValueDistance" class="isochroneValueHidden">
                  <p class="pIsochroneTitle">Définir une distance</p>
                  <div id="isochroneValueDistance" class="divIsochroneValue">
                    <input id="isochroneValueDistanceInput" min="0" step="any" type="number">
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
              ${strPoi}
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

      // type de POI à afficher
      var poisToDisplay = {}
      document.querySelectorAll(".inputIsochroneFilterItem").forEach( (el) => {
        poisToDisplay[el.value] = el.checked;
      });

      // passer les valeurs au service
      self.compute({
        transport: transport,
        mode: mode,
        location: value,
        showOutline: showOutline,
        poisToDisplay: poisToDisplay,
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
  }
};

export default IsochroneDOM;
