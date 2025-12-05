/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import { decode } from "@placemarkio/polyline";
import lineSlice from "@turf/line-slice";
import cleanCoords from "@turf/clean-coords";

import DirectionsResultsDOM from "./directions-results-dom";
import DOM from "../dom";
import Globals from "../globals";
import RouteDrawSave from "../route-draw/route-draw-save";

/**
 * Interface sur les resultats du calcul d'itineraire
 * @module DirectionsResults
 */
class DirectionsResults {
  /**
     * constructeur
     * @constructs
     * @param {*} map
     * @param {*} options
     */
  constructor (map, target, options) {
    this.options = options || {
      duration : "",
      distance : "",
      transport : "",
      computation : "",
      geometry : null, // encoded polyline
      waypoints : [], // [ { name, hint, location } ]
      instructions : [], // [ routes[0].legs ] : [distance, duration, [steps], summary]
      elevation : null,
    };

    // target
    this.target = target;

    // carte
    this.map = map;

    // rendu graphique
    this.render();

    this.handleRouteSave = this.#onRouteSave.bind(this);
    DOM.$directionsSaveBtn.addEventListener("click", this.handleRouteSave);

    return this;
  }

  /**
   * creation de l'interface
   * @public
   */
  render () {
    var target = this.target || document.getElementById("directionsResultsWindow");
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
   * affiche le menu des résultats du calcul
   * @public
   */
  show () {
    Globals.menu.open("directionsResults");
  }

  /**
   * ferme le menu des résultats du calcul
   * @public
   */
  hide () {
    Globals.menu.close("directionsResults");
  }

  updateDuration(newDuration) {
    const oldDuration = this.options.duration;
    this.options.duration = newDuration;

    const ratio = newDuration / oldDuration;
    this.options.instructions.forEach( (instruction) => {
      instruction.steps.forEach( (step) => {
        step.duration *= ratio;
      });
    });

    this.__updateDurationDom();
  }

  /**
   * écouteur du bouton Enregistrer
    */
  #onRouteSave() {
    let transport;
    switch (this.options.transport) {
    case "Pieton":
      transport = "pedestrian";
      break;
    case "Voiture":
      transport = "car";
    }
    this.routeDrawSave = new RouteDrawSave(null, {
      data: JSON.parse(JSON.stringify(this.#directionsDataToRouteDrawData(this.options))),
      transport: transport,
      name: "",
      id: -1,
    });
    this.routeDrawSave.show("directions");
  }

  /**
   * Convertit les données d'itinéraire en données de tracé
   * @param {Object} options - Options d'itinéraire
   * @returns {Object} Données formatées pour le tracé
   */
  #directionsDataToRouteDrawData(options) {
    let elevationData = {
      elevationData: [{ x: 0, y: 0 }],
      coordinates: [],
      dplus: 0,
      dminus: 0,
      unit: "m",
    };
    if (options.elevation.elevationData) {
      elevationData = {
        elevationData: options.elevation.elevationData,
        coordinates: options.elevation.profileLngLats,
        dplus: options.elevation.dplus,
        dminus: options.elevation.dminus,
        unit: options.elevation.unit,
      };
    }

    let nextPointId = -1;
    const points = options.waypoints.map( (pt) => {
      let order = "";
      nextPointId ++;
      if (nextPointId === 0) {
        order = "departure";
      }
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: pt.location,
        },
        properties: {
          name: pt.name,
          id: nextPointId,
          order: order,
        },
      };
    });
    points[points.length -1].properties.order = "destination";

    let globalGeometry = {
      type: "LineString",
      coordinates: decode(options.geometry),
    };
    globalGeometry = cleanCoords(globalGeometry);
    const steps = [];
    let nextStepId = 0;
    for (let i = 1; i < points.length; i++) {
      let step = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: lineSlice(points[i - 1], points[i], globalGeometry).geometry.coordinates,
        },
        properties: {
          start_name: points[0].properties.name,
          end_name: points[i].properties.name,
          duration: options.instructions[i - 1].duration,
          distance:options.instructions[i - 1].distance,
          id: nextStepId,
          mode: 1,
        }
      };
      nextStepId++;
      steps.push(step);
    }

    const data = {
      duration: options.duration,
      distance: options.distance,
      points: points,
      steps: steps,
      elevationData: elevationData,
    };
    return data;
  }

}

// mixins
Object.assign(DirectionsResults.prototype, DirectionsResultsDOM);

export default DirectionsResults;
