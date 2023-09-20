import maplibregl from "maplibre-gl";
import { Geolocation } from "@capacitor/geolocation";

// TODO utiliser l'ecouteur sur l'event "target"
import Reverse from "./reverse";

// TODO mettre en place un icone de positionnement
import MyPositionImg from "../css/assets/map-center.svg";

/**
 * Permet d'afficher ma position sur la carte
 * avec quelques informations utiles (adresse, lat/lon,"./ elevation, ...)
 * 
 * Fonctionnalité utilisée par "Où suis-je ?"
 * @todo creation du DOM
 * @todo service d'altimetrie
 * @todo appel aux fonctionnalités "partagé ma position" et "à proximité"
 */
class Position {
    /**
     * constructeur
     * @public
     */
    constructor(map, options) {
        this.options = options || {
            target : null,
            // callback
            openMyPositionCbk : null,
            closeMyPositionCbk : null
        };

        /*****************************************************************
         * 
         * Workflow "Où suis-je ?":
         * 
         * 0. creer une instance de la classe
         * 1. activer une geolocalisation à la demande (position.compute())
         * 2. recuperer les informations du reverse geocoding / alti :
         *  - adresse
         *  - lon / lat
         *  - alti
         * 3. proceder au rendu des resultats
         * 4. afficher le marker de position et deplacement sur la zone
         * 5. cliquer sur le marker de position pour l' affichage du menu
         * 
         ******************************************************************/

        // carte
        this.map = map;

        // target
        this.target = this.options.target;

        // marker de position
        this.marker = null;

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
     * rendu
     * @param {*} settings
     * @private
     */
    #render() {
        var target = this.target || document.getElementById("mypositionWindow");
        if (!target) {
            console.warn();
            return;
        }
 
        // template litteral number  street  citycode  city
        var id = "positionContainer";
        var address = this.address;
        var latitude = this.coordinates.lat;
        var longitude = this.coordinates.lon;
        var altitude = this.elevation;

        var strContainer = `
        <div id="${id}">
            <div id="positionTitle">Ma position</div>
            <div id="positionAddress">
                <label id="positionImgAddress"></label>
                <div id="positionSectionAddress" class="fontLight">
                    <span class="lblPositionAddress">${address.number} ${address.street},</span>
                    <span class="lblPositionAddress">${address.citycode} ${address.city}</span>
                </div>
            </div>
            <div id="positionButtons">
                <button id="positionShare" class="btnPositionButtons"><label id="positionShareImg"></label>Partager ma position</button>
                <button id="positionNear" class="btnPositionButtons"><label id="positionNearImg"></label>A proximité</button>
            </div>
            <hr>
            <div id="positionCoord" class="fontLight">
                <span class="lblPositionCoord">Latitude : ${latitude}</span>
                <span class="lblPositionCoord">Longitude : ${longitude}</span>
                <span class="lblPositionCoord">Altitude : ${altitude}</span>
            </div>
        </div>
        `;

        const stringToHTML = (str) => {

            var support = function () {
                if (!window.DOMParser) return false;
                var parser = new DOMParser();
                try {
                    parser.parseFromString('x', 'text/html');
                } catch(err) {
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
            // TODO
            // ouverture d'une popup
        });
        shadowContainer.getElementById("positionNear").addEventListener("click", () => {
            // TODO
            // ouverture du panneau Isochrone
        });

        // ajout du container shadow
        target.appendChild(shadowContainer);

        // enregistrement du dom
        this.container = document.getElementById(id);
    }

    /**
     * calcul la position avec les méta informations
     * @public
     */
    async compute () {
        this.clear();

        const position = await Geolocation.getCurrentPosition({
            maximumAge: 0,
            timeout: 10000,
            enableHighAccuracy: true
        });

        const response = await Reverse.compute({
            lat: position.coords.latitude,
            lon: position.coords.longitude
        });

        if (!response) {
            throw new Error("Reverse response is empty !");
        }

        this.coordinates = Reverse.getCoordinates();
        this.address = Reverse.getAddress();
        this.elevation = Reverse.getElevation();

        this.#render();
        this.#addMarker();
        this.#moveTo();

    }

    /**
     * deplacement sur la carte
     * @private
     */
    #moveTo () {
        this.map.setCenter([this.coordinates.lon, this.coordinates.lat]);
    }

    /**
     * ajout un marker de positionnement sur la carte
     * @private
     */
    #addMarker () {
        // contexte
        var self = this;

        // style
        var div = document.createElement("div");
        div.class = "myPositiontIcon";
        div.style.width = "23px";
        div.style.height = "23px";
        div.style.opacity = "0.8";
        div.style.backgroundSize = "contain";
        div.style.backgroundImage = "url(" + MyPositionImg + ")";
        div.addEventListener("click", (e) => {
            (self.opened) ? self.hide() : self.show();
        });

        this.marker = new maplibregl.Marker({ element : div })
            .setLngLat([this.coordinates.lon, this.coordinates.lat])
            .addTo(this.map);
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
    clear () {
        // nettoyage du DOM
        if (this.container) {
            this.container.remove();
        }
        this.coordinates = null;
        this.address = null;
        this.elevation = null;
        this.opened = false;
        // on supprime le marker de position
        if (this.marker) {
            this.marker.remove();
            this.marker = null;
        }
    }

}

export default Position;