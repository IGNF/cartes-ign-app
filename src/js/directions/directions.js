import Polyline from "@mapbox/polyline"
import MapLibreGlDirections from "@maplibre/maplibre-gl-directions";
import DirectionsDOM from "./directions-dom";
import DirectionsResults from "./directions-results";
import DirectionsLayers from "./directions-styles";

// dependance : abonnement au event du module
import Geocode from "../services/geocode";
import Location from "../services/location";
import Reverse from "../services/reverse";

import ElevationLineControl from "../elevation-line-control";
import Sortable from 'sortablejs';

const merge = (a, b, prop) => {
    var reduced = a.filter(aitem => !b.find(bitem => aitem[prop] === bitem[prop]))
    return reduced.concat(b);
};

/**
 * Interface du contrôle sur le calcul d'itineraire
 * @module Directions
 * @todo mise en place d'une patience
 * @todo gestion des styles
 * @todo gestion de l'état du contrôle (local storage)
 * @todo monter le service IGN
 * @todo ajouter "Ma Position" par defaut
 * @todo ajouter les fonctionnalités : cf. DOM
 */
class Directions {
    /**
     * constructeur
     * @constructs
     * @param {*} map
     * @param {*} options
     */
    constructor (map, options) {
        this.options = options || {
            target : null,
            configuration : {},
            style : {},
            // callback
            openSearchControlCbk : null,
            closeSearchControlCbk : null
        };

        // configuration du service
        //   cf. https://project-osrm.org/docs/v5.24.0/api/#
        //   ex. https://map.project-osrm.org/
        this.configuration = this.options.configuration || {
            api: "https://router.project-osrm.org/route/v1",
            profile: "driving",
            requestOptions: {
                overview: "full",
                steps: "true"
            },
            requestTimeout: null,
            makePostRequest: false,
            sourceName: "maplibre-gl-directions",
            pointsScalingFactor: 1,
            linesScalingFactor: 1,
            sensitiveWaypointLayers: [
                "maplibre-gl-directions-waypoint",
                "maplibre-gl-directions-waypoint-casing"
            ],
            sensitiveSnappointLayers: [
                "maplibre-gl-directions-snappoint",
                "maplibre-gl-directions-snappoint-casing"
            ],
            sensitiveRoutelineLayers: [
                "maplibre-gl-directions-routeline",
                "maplibre-gl-directions-routeline-casing"
            ],
            sensitiveAltRoutelineLayers: [
                "maplibre-gl-directions-alt-routeline",
                "maplibre-gl-directions-alt-routeline-casing"
            ],
            layers: DirectionsLayers,
            dragThreshold: 10,
            refreshOnMove: false,
            bearings: false
        };

        // paramètres du calcul
        this.settings = null;

        // résultats du calcul
        this.results = null;

        // carte
        this.map = map;

        // objet
        this.obj = new MapLibreGlDirections(this.map, this.configuration);

        // INFO sans interaction par défaut !
        // > choix d'activer via la méthode publique...
        this.obj.interactive = false;

        // Profil Altimétrique
        this.elevation = new ElevationLineControl({target: document.getElementById("directions-elevationline")});

        // rendu graphique
        this.render();

        // event interactif
        this.#listeners();
    }

    /**
     * creation de l'interface principale
     * @public
     */
    render () {
        var target = this.options.target || document.getElementById("directionsWindow");
        if (!target) {
            console.warn();
            return;
        }

        var container = this.getContainer();
        if (!container) {
            console.warn();
            return;
        }

        // ajout du container
        target.appendChild(container);

        // dragn'drop !
        Sortable.create(document.getElementById("divDirectionsLocationsList"), {
            handle : ".handle-draggable-layer",
            draggable : ".draggable-layer",
            animation : 200,
            forceFallback : true,
            // Call event function on drag and drop
            onEnd : (evt) => {}
        });
    }

    /**
     * requête au service
     * @param {*} settings
     * @public
     */
    compute (settings) {
        console.log(settings);
        // nettoyage de l'ancien parcours !
        this.obj.clear();
        // Les valeurs sont à retranscrire en options du service utilisé
        // - transport : ex. voiture vers l'option 'profile:driving'
        // - computation
        // - locations
        if (settings.transport) {
            // mettre en place les differents types de profile si le service le permet !
            switch (settings.transport) {
                case "Pieton":
                case "Voiture":
                    this.configuration.profile = "driving";
                    break;

                default:
                    break;
            }
        }
        if (settings.computation) {
            // mettre en place le mode calcul si le service le permet !
            var code = settings.computation;
            var message = "";
            switch (code) {
                case "Shortest":
                    message = "Itinéraire le plus court";
                    break;
                case "Fastest":
                    message = "Itinéraire le plus rapide";
                    break;

                default:
                    break;
            }
            settings.computation = {
                code : code,
                message : message
            };
        }
        this.settings = settings;
        if (settings.locations && settings.locations.length) {
            try {
                // les coordonnées sont en lon / lat en WGS84G
                var start = null;
                var end = null;
                var point = null;
                for (let index = 0; index < settings.locations.length; index++) {
                    if (settings.locations[index]) {
                        point = (point === null) ?
                            start = JSON.parse(settings.locations[index]) : JSON.parse(settings.locations[index]);
                        this.obj.addWaypoint(point);
                    }
                }

                var end = point;
                if (start && end) {
                    this.map.fitBounds([start, end], {
                        padding : 20
                    });
                }
            } catch (e) {
                // catching des exceptions JSON
                console.error(e);
                return;
            }
        }
    }

    /**
     * ajout d'ecouteurs pour la saisie interactive
     */
    #listeners() {
        this.obj.on("addwaypoint", (e) => { this.#onAddWayPoint(e); });
        // events
        this.obj.on("fetchroutesstart", (e) => {
            // TODO
            // mise en place d'une patience...
            // start !
        });
        this.obj.on("fetchroutesend", (e) => {
            console.log(e);
            // TODO
            // mise en place d'une patience...
            // finish !

            // affichage du menu du parcours :
            // - résumé
            // - détails
            // on transmet les données (en fonction du service) au composant DOM
            // pour l'affichage :
            // ex.
            // e.data.routes[0] : {
            //    distance,
            //    duration,
            //    geometry,
            //    legs[]
            //  }
            if (e.data.code === "Ok") {
                this.results = new DirectionsResults(this.map, null, {
                    duration : e.data.routes[0].duration || "",
                    distance : e.data.routes[0].distance || "",
                    transport : this.settings.transport,
                    computation : this.settings.computation.message,
                    instructions : e.data.routes[0].legs
                });
                this.results.show();
                let routeCoordinates = [];
                Polyline.decode(e.data.routes[0].geometry).forEach( (latlng) => {
                  routeCoordinates.push({lat: latlng[0], lon: latlng[1]});
                });
                // TODO REMOVE ME IMPORTANT à supprimer après passage en POST GPF
                if (routeCoordinates.length > 110) {
                    var gcd = function(a, b) {
                        if (b < 0.0000001) return a;
                        return gcd(b, Math.floor(a % b));
                    };

                    let proportionToRemove = ((routeCoordinates.length - 110) / routeCoordinates.length).toFixed(2);
                    var len = proportionToRemove.toString().length - 2;
                    var denominator = Math.pow(10, len);
                    var numerator = proportionToRemove * denominator;
                    var divisor = gcd(numerator, denominator);
                    numerator /= divisor;
                    denominator /= divisor;
                    let newrouteCoords = []
                    for (let i=0; i<routeCoordinates.length; i++) {
                        let demPort = i%denominator;
                        if (demPort >= numerator) {
                            newrouteCoords.push(routeCoordinates[i])
                        }
                    }
                    routeCoordinates = newrouteCoords;
                }
                this.elevation.setCoordinates(routeCoordinates);
                this.elevation.compute();
            }
        });
    }

    /**
     * ecouteur lors de l'ajout d'un point avec addWayPoint()
     * @see https://maplibre.org/maplibre-gl-directions/api/interfaces/MapLibreGlDirectionsWaypointEventData.html
     * @param {*} e
     * @returns
     */
    #onAddWayPoint(e) {
        var index = e.data.index;
        if (!e.originalEvent) {
            return;
        }
        var coordinates = e.originalEvent.lngLat;
        var bResponse = false;
        Reverse.compute({
            lon : coordinates.lng,
            lat : coordinates.lat
        }).then(() => {
            bResponse = true;
        }).catch(() => {
            bResponse = false;
        }).finally(() => {
            var target = null;
            var c = (bResponse) ? Reverse.getCoordinates() : {lon : coordinates.lng, lat : coordinates.lat};
            var a = (bResponse) ? Reverse.getAddress() : c.lon.toFixed(6) + ", " + c.lat.toFixed(6);
            var address = a;
            if (bResponse) {
                address = a.street + ", " + a.city + ", " + a.citycode;
            }
            // start
            if (index === 0) {
                target = document.getElementById("directionsLocation_start");
            }
            // end
            if (index === 1) {
                target = document.getElementById("directionsLocation_end");
            }
            // step
            if (index > 1) {
                target = document.getElementById("directionsLocation_step_" + (index - 1));
                target.parentNode.parentNode.classList.remove("hidden");
            }
            // on ajoute les resultats dans le contrôle
            if (target) {
                target.dataset.coordinates = "[" + c.lon + "," + c.lat + "]";
                target.value = address;
            }
        });
    }

    /**
     * activation du mode interaction
     * @param {*} status
     * @public
     */
    interactive (status) {
        this.obj.interactive = status;
    }

    /**
     * nettoyage du tracé
     * @public
     */
    clear () {
        this.obj.clear();
        this.obj.off("addwaypoint", (e) => { this.#onAddWayPoint(e); });
        var locations = document.querySelectorAll(".inputDirectionsLocations");
        for (let index = 0; index < locations.length; index++) {
            const element = locations[index];
            element.value = "";
            element.dataset.coordinates = "";
        }
    }

    ////////////////////////////////////////////
    // autres méthodes...
    ////////////////////////////////////////////
    /**
     * listener issu du dom sur l'interface du menu 'search'
     * @param {*} e
     * @see MenuDisplay.openSearchDirections()
     * @see MenuDisplay.closeSearchDirections
     * @see Geocode
     */
    onOpenSearchLocation (e) {
        // contexte
        var self = this;

        // on ouvre le menu
        if (this.options.openSearchControlCbk) {
            this.options.openSearchControlCbk();
        }

        // on transmet d'où vient la demande de location :
        // - point de départ,
        // - arrivée,
        // - étape
        var target = e.target;

        // les handler sur
        // - le geocodage
        // - la fermeture du menu
        // - le nettoyage des ecouteurs
        function setLocation (e) {
            // on ferme le menu
            if (e.type !== "geolocation" && self.options.closeSearchControlCbk) {
                self.options.closeSearchControlCbk();
            }

            // on enregistre dans le DOM :
            // - les coordonnées en WGS84G soit lon / lat !
            // - la reponse du geocodage
            target.dataset.coordinates = "[" + e.detail.coordinates.lon + "," + e.detail.coordinates.lat + "]";
            target.value = e.detail.text.split(",")[0];
            // on supprime les écouteurs
            cleanListeners();
        }
        function cleanLocation (e) {
            target.dataset.coordinates = "";
            target.value = "";
            cleanListeners();
        }
        function cleanListeners () {
            var close = document.getElementById("closeSearch");
            if (close) {
                close.removeEventListener("click", cleanLocation);
            }
            Geocode.target.removeEventListener("search", setLocation)
            Location.target.removeEventListener("geolocation", setLocation);
        }

        // abonnement au geocodage
        Geocode.target.addEventListener("search", setLocation);

        // abonnement à la geolocalisation
        Location.target.addEventListener("geolocation", setLocation);

        // abonnement au bouton de fermeture du menu
        var close = document.getElementById("closeSearch");
        if (close) {
            close.removeEventListener("click", cleanLocation);
        }
    }
}

// mixins
Object.assign(Directions.prototype, DirectionsDOM);

export default Directions;
