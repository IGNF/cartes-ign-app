import maplibregl from "maplibre-gl";
import { Geolocation } from "@capacitor/geolocation";

import Reverse from "./reverse";

// TODO mettre en place un icone de positionnement
import MyPositionImg from "../css/assets/map-center.svg";

/**
 * Permet d'afficher ma position sur la carte
 * avec quelques informations utiles (adresse, lat/lon,"./ elevation, ...)
 * 
 * Module utilisé par "Ma Position" ou "Où suis-je ?"
 * @todo ...
 */
class Position {
    /**
     * constructeur
     * @public
     */
    constructor(map, options) {
        this.options = options || {
            target : null
        };

        /**
         * Workflow "Où suis-je ?":
         * 
         * 1. activer une geolocalisation
         * 2. recuperer les informations du reverse geocoding / alti :
         *  - adresse
         *  - lon / lat
         *  - alti
         * 3. rendu des resultats
         * 4. afficher le marker de position
         * 5. evenement sur le marker de position pour l' affichage du menu
         */

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

        return this;
    }

    /**
     * rendu
     * @param {*} settings
     * @public
     */
    render() {
        var target = this.target || document.getElementById("mypositionWindow");
        if (!target) {
            console.warn();
            return;
        }
 
        // template litteral
        var strContainer = ``;

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

        // ajout du shadow DOM
        const shadowContainer = container.attachShadow({ mode: "open" });
        shadowContainer.innerHTML = strContainer.trim();

        if (!shadowContainer) {
            console.warn();
            return;
        }
        
        // ajout des listeners principaux :
        // ...

        // ajout du container shadow
        target.appendChild(shadowContainer);
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

    }

    /**
     * deplacement sur la carte
     * @public
     */
    moveTo () {
        this.map.setCenter([this.coordinates.lon, this.coordinates.lat]);
    }

    /**
     * ajout un marker de positionnement sur la carte
     * @public
     */
    addMarker () {
        // style
        var div = document.createElement("div");
        div.class = "myPositiontIcon";
        div.style.width = "23px";
        div.style.height = "23px";
        div.style.opacity = "0.8";
        div.style.backgroundSize = "contain";
        div.style.backgroundImage = "url(" + MyPositionImg + ")";

        this.marker = new maplibregl.Marker({ element : div })
            .setLngLat([this.coordinates.lon, this.coordinates.lat])
            .addTo(this.map);
    }

    /**
     * affiche le menu
     * @public
     */
    show() {

    }

    /**
     * ferme le menu
     * @public
     */
    hide() {

    }

    /** 
     * clean des resultats
     * @public
     */
    clear () {
        this.coordinates = null;
        this.address = null;
        this.elevation = null;
        // on supprime le marker de position
        if (this.marker) {
            this.marker.remove();
            this.marker = null;
        }
    }

    ////////////////////////////////////////////
    // autres méthodes...
    ////////////////////////////////////////////

    /**
     * 
     * @param {*} e 
     * @private
     */
    onClickPositionMarker (e) {

    }

}

export default Position;