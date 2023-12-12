import maplibregl from "maplibre-gl";

// TODO utiliser l'ecouteur sur l'event "target"
import Reverse from "./services/reverse";
import Elevation from "./services/elevation";
import Location from './services/location';
import Globals from './globals';

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
      openMyPositionCbk: null,
      closeMyPositionCbk: null,
      openIsochroneCbk: null,
      openDirectionsCbk: null,
    };

    // carte
    this.map = map;

    // tracking
    this.tracking = this.options.tracking;

    // target
    this.target = this.options.target;

    // popup
    this.popup = null;
    this.contentPopup = null;

    // les données utiles du service
    this.coordinates = null;
    this.address = null;
    this.elevation = null;

    // dom de l'interface
    this.container = null;

    // open/close interface
    this.opened = false;

    return this;
  }

  /**
   * rendu du menu
   * (ainsi que la popup "partager ma position")
   * @private
   */
  #render() {
    var target = this.target || document.getElementById("mypositionWindow");
    if (!target) {
      console.warn();
      return;
    }

    var id = {
      main: "positionContainer",
      popup: "positionPopup"
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
        <span class="lblPositionAddress">${address.city} ${address.postcode}</span>
        `
    } else {
      templateAddress = `
        <span class="lblPositionAddress">${latitude}, ${longitude}</span>
        `
    }

    // template litteral
    this.contentPopup = `
        <div id="${id.popup}">
            <div class="divPositionTitle">Partager ma position</div>
            <div class="divPopupClose" onclick="onCloseSharePopup(event)"></div>
            <div class="divPositionAddress">
                <label class="lblPositionImgAddress"></label>
                <div class="divPositionSectionAddress fontLight">
                    ${templateAddress}
                </div>
            </div>
            <div class="divPositionCoord fontLight">
                <span class="lblPositionCoord">Latitude : ${latitude} </span>
                <span class="lblPositionCoord"> Longitude : ${longitude}</span><br />
                <span class="lblPositionCoord">Altitude : ${altitude}m</span>
            </div>
            <div class="divPositionShareButtons">
                <label id="positionWhatsAppImg" onclick="onClickSocialWhatsapp(event)"></label>
                <label id="positionSmsImg" onclick="onClickSocialSms(event)"></label>
            </div>
        </div>
        `;
    // ajout des listeners
    var self = this;
    window.onCloseSharePopup = (e) => {
      self.popup.remove();
    }
    window.onClickSocialWhatsapp = (e) => {
      // message
      var message = `${self.address.number} ${self.address.street}, ${self.address.postcode} ${self.address.city}
            (latitiude: ${self.coordinates.lat} / longitude: ${self.coordinates.lon} / altitude: ${self.elevation} m)`;
      if (!address.street) {
        message = `${self.address.city} ${self.address.postcode}
          (latitiude: ${self.coordinates.lat} / longitude: ${self.coordinates.lon} / altitude: ${self.elevation} m)`;
      }
      if (!address.city) {
        message = `latitiude: ${self.coordinates.lat} / longitude: ${self.coordinates.lon} / altitude: ${self.elevation} m`;
      }
      // redirection vers...
      if (self.isDesktop()) {
        window.open(`https://api.whatsapp.com:/send?text= ${message}`);
      } else {
        window.open(`whatsapp://send?text= ${message}`);
      }
    };
    window.onClickSocialSms = (e) => {
      console.log(self);
    };

    // template litteral
    var strContainer = `
        <div id="${id.main}">
            <div class="divPositionTitle">Ma position</div>
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
        </div>
        `;

    const stringToHTML = (str) => {

      var support = function () {
        if (!window.DOMParser) return false;
        var parser = new DOMParser();
        try {
          parser.parseFromString('x', 'text/html');
        } catch (err) {
          return false;
        }
        return true;
      };

      // If DOMParser is supported, use it
      if (support()) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(str, 'text/html');
        return doc.body.firstChild;
      }

      // Otherwise, fallback to old-school method
      var dom = document.createElement('div');
      dom.innerHTML = str;
      return dom;

    };

    // transformation du container : String -> DOM
    var container = stringToHTML(strContainer.trim());

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
      // on supprime la popup
      if (this.popup) {
        this.popup.remove();
        this.popup = null;
      }
      // centre de la carte
      var center = this.map.getCenter();
      // position de la popup
      let markerHeight = 50, markerRadius = 10, linearOffset = 25;
      var popupOffsets = {
        'top': [0, 0],
        'top-left': [0, 0],
        'top-right': [0, 0],
        'bottom': [0, -markerHeight],
        'bottom-left': [linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
        'bottom-right': [-linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
        'left': [markerRadius, (markerHeight - markerRadius) * -1],
        'right': [-markerRadius, (markerHeight - markerRadius) * -1]
      };
      // ouverture d'une popup
      this.popup = new maplibregl.Popup({
        offset: popupOffsets,
        className: "positionPopup",
        closeOnClick: true,
        closeOnMove: true,
        closeButton: false
      })
        .setLngLat(center)
        .setHTML(this.contentPopup)
        .setMaxWidth("300px")
        .addTo(this.map);
    });
    shadowContainer.getElementById("positionNear").addEventListener("click", () => {
      // fermeture du panneau actuel
      if (this.options.closeMyPositionCbk) {
        this.options.closeMyPositionCbk();
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
      if (this.options.closeMyPositionCbk) {
        this.options.closeMyPositionCbk();
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
   * @public
   */
  async compute() {
    this.clear();

    const position = await Location.getLocation(this.tracking);

    const responseReverse = await Reverse.compute({
      lat: position.coordinates.lat,
      lon: position.coordinates.lon
    });

    if (!responseReverse) {
      throw new Error("Reverse response is empty !");
    }

    this.coordinates = Reverse.getCoordinates();
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
    this.#moveTo();

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
      var container = document.getElementById("mypositionWindow");
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
    if (this.options.openMyPositionCbk) {
      this.options.openMyPositionCbk();
      this.opened = true;
    }
  }

  /**
   * ferme le menu
   * @public
   */
  hide() {
    if (this.options.closeMyPositionCbk) {
      this.options.closeMyPositionCbk();
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
    this.contentPopup = null;
    // nettoyage du DOM
    if (this.container) {
      this.container.remove();
    }
    // on supprime la popup
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }
  }

}

export default Position;
