import RouteDrawDOM from "./route-draw-dom";
import Utils from "./route-draw-utils"
import Globals from "../globals";
import ElevationLineControl from "../elevation-line-control";

import Reverse from "../services/reverse";

import MapLibreGL from "maplibre-gl";

/**
 * Interface sur le tracé d'itinéraire
 * @module RouteDraw
 */
class RouteDraw {
    /**
     * constructeur
     * @constructs
     * @param {*} map
     * @param {*} options
     */
    constructor (map, options) {
        this.options = options || {
            target: null,
            style: {},
          };

        this.transport = "pedestrian"; // one of "pedestrian", "car"

        this.data = {
            duration: 0,
            distance: 0,
            dplus: 0,
            dminus: 0,
            // point: GeoJSON feature point with properties: "name"
            points: [],
            // step: GeoJSON feature linestring with properties: "start_name", "end_name", "duration", "distance", "dplus", "dminus"
            steps: [],
        }

        // mode: libre 0 ou guidé 1
        this.mode = 0;

        // target
        this.target = this.options.target;

        // carte
        this.map = map;

        // rendu graphique
        this.render();

        // Profil Altimétrique
        this.elevation = new ElevationLineControl({target: document.getElementById("routedraw-elevationline")});

        // fonction d'event avec bind
        this.boundOnAddWayPoint = this.#onAddWayPoint.bind(this);

        return this;
    }

    /**
     * activation du contrôle
     * @public
     */
    activate() {
        this.#listeners()
    }

    /**
     * creation de l'interface
     * @public
     */
    render () {
        var target = this.target || document.getElementById("routeDrawWindow");
        if (!target) {
            console.warn();
            return;
        }

        var container = this.getContainer(this.options);
        if (!container) {
            console.warn();
            return;
        }

        // ajout du container
        target.appendChild(container);
    }

    /**
     * enregistrement de l'itinéraire
     * @param {*} settings
     * @public
     */
    compute (settings) {

    }

    /**
     * ajout d'ecouteurs pour la saisie interactive
     */
    #listeners() {
        this.map.on("click", this.boundOnAddWayPoint);

        // this.obj.on("addwaypoint", (e) => { this.#onAddWayPoint(e); });
        // this.obj.on("cancellast", (e) => { this.#onCancelLast(e); });
        // this.obj.on("restorenext", (e) => { this.#onRestoreNext(e); });
        // this.obj.on("deletepoint", (e) => { this.#onDeletePoint(e); });

    }

    /**
     * ecouteur lors de l'ajout d'un point avec addWayPoint()
     * @param {*} e
     * @returns
     */
    #onAddWayPoint(e) {
        console.log(e.lngLat);
        // On empêche l'intéraction tant que les opérations ne sont pas terminées
        // TODO: Patience
        this.map.off("click", this.boundOnAddWayPoint);
        var coordinates = e.lngLat;
        var bResponse = false;
        var length = this.data.points.push({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [coordinates.lng, coordinates.lat]
            },
            properties: {
                name: ""
            }
        })
        console.log(1);
        Reverse.compute({
            lon : coordinates.lng,
            lat : coordinates.lat
        }).then(() => {
            bResponse = true;
        }).catch(() => {
            bResponse = false;
        }).finally(() => {
            var a = (bResponse) ? Reverse.getAddress() : coordinates.lng.toFixed(6) + ", " + coordinates.lat.toFixed(6);
            var address = a;
            if (bResponse) {
                if (a.street) {
                    address = a.street + ", "
                }
                address += a.city + ", " + a.postcode;
            }
            // on ajoute les resultats dans le tableau (avec la length récupérée avant la promesse pour gérer l'asynchrone)
            this.data.points[length - 1].geometry.coordinates = [coordinates.lng, coordinates.lat];
            this.data.points[length - 1].properties.name = address;

            // Pas d'autre étape s'il n'y a qu'un point
            if (this.data.points.length < 2) {
                if (Globals.backButtonState === "routeDraw") {
                    this.map.on("click", this.boundOnAddWayPoint);
                }
                return
            }

            var previousPoint = this.data.points[length - 2];
            var distance = new MapLibreGL.LngLat(coordinates.lng, coordinates.lat).distanceTo(new MapLibreGL.LngLat(...previousPoint.geometry.coordinates));
            if (this.data.steps.length > 0) {
                var allCoordinates = this.data.steps.map((step) => step.geometry.coordinates).flat();
                allCoordinates.push([coordinates.lng, coordinates.lat]);
            } else {
                allCoordinates = [previousPoint.geometry.coordinates, [coordinates.lng, coordinates.lat]];
            }

            this.elevation.setCoordinates(allCoordinates);
            var lastDPlus = this.elevation.dplus;
            var lastDMinus = this.elevation.dminus;
            this.elevation.compute().then( () => {
                var step = {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            previousPoint.geometry.coordinates,
                            [coordinates.lng, coordinates.lat]
                        ]
                    },
                    properties: {
                        start_name: previousPoint.properties.name,
                        end_name: address,
                        duration: distance / (4 / 3.6), // 4 km/h divisé par 3.6 pour secondes
                        distance: distance,
                        dplus: this.elevation.dplus - lastDPlus,
                        dminus: this.elevation.dminus - lastDMinus,
                    }
                }
                this.data.steps.push(step);
                this.data.distance += distance;
                this.data.duration += distance / (4 / 3.6);
                this.data.dplus = this.elevation.dplus;
                this.data.dminus = this.elevation.dminus;
                this.__updateRouteInfo(this.data);

                // Réactivation de l'intéractivité si on est toujours dans le tracé d'itinéraire
                if (Globals.backButtonState === "routeDraw") {
                    this.map.on("click", this.boundOnAddWayPoint);
                }
            });
        });
    }

    /**
     * nettoyage du tracé
     * @public
     */
    clear () {
        this.map.off("click", this.boundOnAddWayPoint);
        this.options.steps = [];
    }

    /**
     * affiche le menu des résultats du calcul
     * @public
     */
    show () {
        Globals.menu.open("routeDraw");
    }

    /**
     * ferme le menu des résultats du calcul
     * @public
     */
    hide () {
        Globals.menu.close("routeDraw");
    }

}

// mixins
Object.assign(RouteDraw.prototype, RouteDrawDOM);

export default RouteDraw;
