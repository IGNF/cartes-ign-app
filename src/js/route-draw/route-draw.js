import RouteDrawDOM from "./route-draw-dom";
import RouteDrawSave from "./route-draw-save";
import Globals from "../globals";
import ElevationLineControl from "../elevation-line-control/elevation-line-control";
import DOM from "../dom";
import RouteDrawLayers from "./route-draw-styles";
import Reverse from "../services/reverse";

import MapLibreGL from "maplibre-gl";
import { Toast } from "@capacitor/toast";

import turfLength from "@turf/length";

import RouteDepartureIcon from "../../css/assets/route-draw/departure-marker.png";
import RouteDestinationIcon from "../../css/assets/route-draw/destination-marker.png";

/** util */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

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
  constructor(map, options) {
    this.options = options || {
      target: null,
      configuration: {},
      style: {},
      transport: null,
      mode: null,
      data: null,
    };

    // configuration
    this.configuration = this.options.configuration || {
      linesource: "route-draw-line",
      pointsource: "route-draw-point",
      api: "https://data.geopf.fr/navigation/itineraire?resource=bdtopo-osrm&getSteps=false&timeUnit=second&optimization=shortest&",
      template: (values) => {
        return `start=${values.start.lng},${values.start.lat}&end=${values.end.lng},${values.end.lat}&profile=${values.profile}`;
      }
    };

    // style
    this.style = this.options.style || {
      color: getComputedStyle(document.body).getPropertyValue("--dark-green"),
      opacity: 0.85
    };

    this.transport = this.options.transport || "pedestrian"; // one of "pedestrian", "car"

    this.data = this.options.data || {
      duration: 0,
      distance: 0,
      // point: GeoJSON feature point with properties: "name"
      points: [],
      // step: GeoJSON feature linestring with properties: "start_name", "end_name", "duration", "distance", "dplus", "dminus"
      steps: [],
      // data for the elevation control
      elevationData: {
        elevationData: [{ x: 0, y: 0 }],
        coordinates: [],
        dplus: 0,
        dminus: 0,
        unit: "m",
      },
    };

    // Mode lecture seule = affichage des détails de l'itinéraire
    this.readonly = false;

    // mode: libre 0 ou guidé 1
    this.mode = this.options.mode || 1;

    // target
    this.target = this.options.target;

    // carte
    this.map = map;

    this.#addSourcesAndLayers();
    // rendu graphique
    this.render();

    // Profil Altimétrique
    this.elevation = new ElevationLineControl({ target: document.getElementById("routedraw-elevationline") });
    this.elevation.addSourcesAndLayers();

    this.map.loadImage(RouteDepartureIcon, (_, image) => {
      this.map.addImage("routeDepartureIcon", image);
    });
    this.map.loadImage(RouteDestinationIcon, (_, image) => {
      this.map.addImage("routeDestinationIcon", image);
    });

    // fonction d'event avec bind
    this.handleAddWayPoint = this.#onAddWayPoint.bind(this);
    this.handleTouchStartPoint = this.#onTouchStartPoint.bind(this);
    this.handleTouchStartLine = this.#onTouchStartLine.bind(this);
    this.handleTouchMove = this.#onTouchMove.bind(this);
    this.handleTouchEnd = this.#onTouchEnd.bind(this);
    this.handleDeletePoint = this.#onDeleteWayPoint.bind(this);
    this.handleCancelChange = this.#cancelChange.bind(this);
    this.handleRestoreChange = this.#restoreChange.bind(this);
    this.handleToggleDelete = this.toggleDelete.bind(this);
    this.handleRouteSave = this.#onRouteSave.bind(this);

    // historique pour l'annulation et la restauration
    this.dataHistory = [];
    this.currentHistoryPosition = 0;

    // point actuellement déplacé par l'interactivité
    this.movedPoint = null;
    this.movedPointIndex = null;
    this.fictiveSteps = {
      before: null,
      after: null,
    };
    this.pointWasMoved = false;

    // compteurs pour identifiants uniques de points et steps
    this.nextPointId = 0;
    this.nextStepId = 0;

    // mode suppression de points
    this.delete = false;

    // popup d'aide
    this.popup = null;

    // interface de sauvegarde
    this.routeDrawSave = null;

    // Nom et ID de l'itinéraire s'il s'agit d'une modification d'un itinéraire existant
    this.name = null;
    this.routeId = null;

    // annulation de la reqête fetch
    this.controller = new AbortController();

    // requête en cours d'execution ?
    this.loading = false;

    return this;
  }

  /**
   * activation du contrôle
   * @public
   */
  activate() {
    this.dataHistory.unshift(JSON.parse(JSON.stringify(this.data)));
    this.dom.title.classList.add("d-none");
    this.dom.edit.classList.add("d-none");
    this.#listeners();
  }

  /**
   * creation de l'interface
   * @public
   */
  render() {
    var target = this.target || document.getElementById("routeDrawWindow");
    if (!target) {
      console.warn();
      return;
    }
    this.target = target;

    var container = this.getContainer(this.transport);
    if (!container) {
      console.warn();
      return;
    }

    // ajout du container
    target.appendChild(container);
  }

  /**
   * ajout de données déjà calculées
   * @param {*} data
   * @public
   */
  setData(data) {
    this.dataHistory = [];
    this.data = data;
    if (this.data.elevationData.elevationData && this.data.elevationData.elevationData.length > 1) {
      this.elevation.setData(this.data.elevationData);
    } else {
      this.#updateElevation();
    }
    if (this.data.distance === 0 && this.data.steps.length > 0) {
      this.data.steps.forEach( (step) => {
        this.data.distance += turfLength(step) * 1000;
      });
      if (this.data.duration === 0) {
        if (this.transport === "pedestrian") {
          // 4 km/h
          this.data.duration = this.data.distance / (4 / 3.6);
        } else {
          // 50 km/h
          this.data.duration = this.data.distance / (50 / 3.6);
        }
      }
    }
    this.#saveState();
    DOM.$routeDrawCancel.classList.add("inactive");
    this.__updateRouteInfo(this.data);
    this.#updateSources();
  }

  /**
   * Paramétrage du nom
   * @param {string} name
   * @public
   */
  setName(name) {
    this.name = name;
    this.__updateTitle(name);
  }

  /**
   * Paramétrage de l'id
   * @param {number} id
   * @public
   */
  setId(id) {
    this.routeId = id;
  }

  /**
   * Paramétrage du transport
   * @param {String} transport "car" ou "pedestrian"
   */
  setTransport(transport) {
    if (["car", "pedestrian"].includes(transport)) {
      this.#changeTransport(transport);
    }
  }

  /**
   * Ouvre l'itinéraire en mode édition s'il est puvert en lecture seule
   */
  openEdition() {
    if (!Globals.online) {
      Toast.show({
        text: "Fonctionnalité indisponible en mode hors ligne.",
        duration: "long",
        position: "bottom"
      });
      return;
    }
    const routeId = this.routeId;
    this.hide();
    document.getElementById(`route-edit_ID_${routeId}`).click();
  }

  /**
   * ajout d'ecouteurs pour la saisie interactive
   */
  #listeners() {
    this.map.on("click", this.handleAddWayPoint);
    this.map.on("touchstart", RouteDrawLayers["point"].id, this.handleTouchStartPoint);
    this.map.on("touchstart", RouteDrawLayers["line"].id, this.handleTouchStartLine);
    this.#editionButtonsListeners();

    DOM.$routeDrawModeSelectTransportPedestrian.addEventListener("click", () => {
      this.#changeTransport("pedestrian");
      this.changeMode(1);
    });
    DOM.$routeDrawModeSelectTransportCar.addEventListener("click", () => {
      this.#changeTransport("car");
      this.changeMode(1);
    });
    document.getElementById("routeDrawModeSelectModeFree").addEventListener("click", () => {
      this.#changeTransport("pedestrian");
      this.changeMode(0);
    });
  }

  #changeTransport(transport) {
    if (this.transport !== transport) {
      if (this.data.steps.length > 0) {
        this.#informChangeTransportImpossible();
        return;
      }
      let savedPoints;
      if (this.data.points.length === 1) {
        savedPoints = JSON.parse(JSON.stringify(this.data.points));
      }
      this.clear();
      if (savedPoints) {
        this.data.points = savedPoints;
        this.#updateSources();
      }
      this.activate();
      document.getElementById(`routeDrawModeTransport${capitalizeFirstLetter(transport)}`).classList.remove("d-none");
      document.getElementById(`routeDrawModeTransport${capitalizeFirstLetter(this.transport)}`).classList.add("d-none");
    }
    if (transport === "car") {
      document.getElementById("routedraw-elevationline").classList.add("d-none");
      document.querySelector("#routeDrawDetails .elevationLineHeader").classList.add("d-none");
      document.querySelector("#routeDrawSummary .routeDrawSummaryDenivele").classList.add("d-none");
    } else {
      document.getElementById("routedraw-elevationline").classList.remove("d-none");
      document.querySelector("#routeDrawDetails .elevationLineHeader").classList.remove("d-none");
      document.querySelector("#routeDrawSummary .routeDrawSummaryDenivele").classList.remove("d-none");
    }
    document.querySelector(".routeDrawSummaryTransport").className = "routeDrawSummaryTransport lblRouteDrawSummaryTransport" + transport;
    this.transport = transport;
    this.#closeRouteDrawMode();
  }

  #informChangeTransportImpossible() {
    Toast.show({
      text: "Impossible de changer de mode en cours de saisie",
      duration: "short",
      position: "bottom"
    });
  }

  #closeRouteDrawMode() {
    document.getElementById("routeDrawMode").classList.add("routeDrawModeClose");
    document.getElementById("routeDrawMode").addEventListener("click", (e) => {
      if ([
        "routeDrawMode", "routeDrawModeArrow", "routeDrawModeText", "routeDrawModeTransportPedestrian", "routeDrawModeTransportCar"
      ].includes(e.target.id)) {
        document.getElementById("routeDrawMode").classList.remove("routeDrawModeClose");
      }
    });
  }

  /**
   * Ajout d'écouteurs sur les boutons de la barre d'édition
   */
  #editionButtonsListeners() {
    DOM.$routeDrawCancel.addEventListener("click", this.handleCancelChange);
    DOM.$routeDrawRestore.addEventListener("click", this.handleRestoreChange);
    DOM.$routeDrawDelete.addEventListener("click", this.handleToggleDelete);
    DOM.$routeDrawSave.addEventListener("click", this.handleRouteSave);
  }

  /**
   * retrait d'ecouteurs pour attendre les traitements
   * @public
   */
  deactivate() {
    this.map.off("click", this.handleAddWayPoint);
    this.map.off("touchstart", RouteDrawLayers["point"].id, this.handleTouchStartPoint);
    this.map.off("touchstart", RouteDrawLayers["line"].id, this.handleTouchStartLine);
    DOM.$routeDrawCancel.removeEventListener("click", this.handleCancelChange);
    DOM.$routeDrawRestore.removeEventListener("click", this.handleRestoreChange);
    DOM.$routeDrawDelete.removeEventListener("click", this.handleToggleDelete);
    DOM.$routeDrawSave.removeEventListener("click", this.handleRouteSave);
  }

  /**
   * écouteur du bouton Enregistrer
   */
  #onRouteSave() {
    if (this.data.steps.length < 1) {
      Toast.show({
        text: "Au moins une étape nécessaire pour l'enregistrement",
        duration: "short",
        position: "bottom"
      });
      return;
    }
    let name = "";
    if (this.name) {
      name = this.name;
    }
    let id = -1;
    if (this.routeId !== null && this.routeId >= 0) {
      id = this.routeId;
    }
    this.routeDrawSave = new RouteDrawSave(null, {
      data: JSON.parse(JSON.stringify(this.data)),
      transport: this.transport,
      name: name,
      id: id,
    });
    this.routeDrawSave.show();
  }

  /**
   * ecouteur lors du déplacement d'un nouveau waypoint depuis une ligne sur la carte - début
   * @param {*} e
   * @returns
   */
  #onTouchStartLine(e) {
    // TODO patience
    e.preventDefault();
    if (this.map.queryRenderedFeatures(e.point, {
      layers: [RouteDrawLayers["point"].id],
    })[0]) {
      return;
    }
    const feature = this.map.queryRenderedFeatures(e.point, {
      layers: [RouteDrawLayers["line"].id],
    })[0];
    this.movedPointIndex = this.data.steps.findIndex((step) => {
      return step.properties?.id === feature?.properties?.id;
    }) + 1;
    var coordinates = e.lngLat;
    const newPoint = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [coordinates.lng, coordinates.lat]
      },
      properties: {
        name: "",
        id: this.nextPointId,
      }
    };
    this.nextPointId++;
    if (this.movedPointIndex < this.data.steps.length) {
      const newStep = JSON.parse(JSON.stringify(this.data.steps[this.movedPointIndex]));
      newStep.properties.id = this.nextStepId;
      newStep.properties.invisible = true;
      this.nextStepId++;
      this.data.steps.splice(this.movedPointIndex, 0, newStep);
    }
    this.data.points.splice(this.movedPointIndex, 0, newPoint);
    this.movedPoint = this.data.points[this.movedPointIndex];
    this.movedPoint.properties.highlight = true;
    this.#updateSources();

    this.map.on("touchmove", this.handleTouchMove);
    this.map.once("touchend", this.handleTouchEnd);
  }

  /**
   * ecouteur lors du déplacement d'un waypoint sur la carte - début
   * @param {*} e
   * @returns
   */
  #onTouchStartPoint(e) {
    // TODO gestion d'erreurs
    // TODO patience
    e.preventDefault();
    const feature = this.map.queryRenderedFeatures(e.point, {
      layers: [RouteDrawLayers["point"].id],
    })[0];
    this.movedPointIndex = this.data.points.findIndex((point) => {
      return point.properties?.id === feature?.properties?.id;
    });
    this.movedPoint = this.data.points[this.movedPointIndex];
    this.movedPoint.properties.highlight = true;
    this.#updateSources();

    this.map.on("touchmove", this.handleTouchMove);
    this.map.once("touchend", this.handleTouchEnd);
  }

  /**
   * ecouteur lors du déplacement d'un waypoint sur la carte - pendant
   * @param {*} e
   * @returns
   */
  #onTouchMove(e) {
    this.pointWasMoved = true;
    const coords = e.lngLat;
    this.movedPoint.geometry.coordinates = [coords.lng, coords.lat];
    // Définition de traits fictifs pours aider à situer le point
    let pointBefore;
    let pointAfter;
    if (this.movedPointIndex > 0) {
      pointBefore = this.data.points[this.movedPointIndex - 1];
    }
    if (this.movedPointIndex + 1 < this.data.points.length) {
      pointAfter = this.data.points[this.movedPointIndex + 1];
    }
    if (pointBefore) {
      if (!this.fictiveSteps.before) {
        this.fictiveSteps.before = {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [pointBefore.geometry.coordinates, this.movedPoint.geometry.coordinates]
          },
          properties: {
            fictif: true,
            id: -100,
          }
        };
        this.data.steps.push(this.fictiveSteps.before);
      } else {
        this.fictiveSteps.before.geometry.coordinates = [pointBefore.geometry.coordinates, this.movedPoint.geometry.coordinates];
      }
    }
    if (pointAfter) {
      if (!this.fictiveSteps.after) {
        this.fictiveSteps.after = {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [this.movedPoint.geometry.coordinates, pointAfter.geometry.coordinates]
          },
          properties: {
            fictif: true,
            id: -200,
          }
        };
        this.data.steps.push(this.fictiveSteps.after);
      } else {
        this.fictiveSteps.after.geometry.coordinates = [this.movedPoint.geometry.coordinates, pointAfter.geometry.coordinates];
      }
    }
    this.#updateSources();
  }

  /**
   * ecouteur lors du déplacement d'un waypoint sur la carte - fin
   * @param {*} e
   * @returns
   */
  async #onTouchEnd(e) {
    this.map.off("touchmove", this.handleTouchMove);
    this.deactivate();
    this.movedPoint.properties.highlight = false;
    if (!this.pointWasMoved) {
      this.#updateSources();
      this.movedPoint = null;
      this.movedPointIndex = null;
      this.#listeners();
      return;
    }
    const index = this.movedPointIndex;
    const address = await this.#computePointName(e.lngLat);
    this.movedPoint.properties.name = address;
    this.movedPoint = null;
    this.movedPointIndex = null;
    const toremove = [];
    for (let i = 0; i < this.data.steps.length; i++ ) {
      const step = this.data.steps[i];
      if (step.properties.fictif) {
        toremove.push(i);
      }
    }
    if (toremove.length >= 1) {
      this.data.steps.splice(toremove[0], 1);
    }
    if (toremove.length === 2) {
      this.data.steps.splice(toremove[1] - 1, 1);
    }
    this.fictiveSteps = {
      before: null,
      after: null,
    };
    this.#updateSources();
    var promises = [];
    if (index > 0) {
      const computeBefore = this.#computeStep(index - 1, this.mode, false);
      promises.push(computeBefore);
      if (this.mode === 1 && this.data.steps[index - 1].properties.mode === 0 && index > 1) {
        computeBefore.then(() => promises.push(this.#computeStep(index - 2, 0, false)));
      }
    }
    if (index < this.data.points.length - 1) {
      const computeAfter = this.#computeStep(index, this.mode, false);
      promises.push(computeAfter);
      if (this.mode === 1 && index < this.data.points.length - 2 && this.data.steps[index].properties.mode === 0) {
        computeAfter.then(() => promises.push(this.#computeStep(index + 1, 0, false)));
      }
    }
    Promise.all(promises).then(() => {
      // Enregistrement de l'état dans l'historique
      this.#updateElevation();
      this.#saveState();
      this.#listeners();
      this.pointWasMoved = false;
    });
  }

  /**
   * ecouteur lors de l'ajout d'un point avec addWayPoint()
   * @param {*} e
   * @returns
   */
  async #onAddWayPoint(e) {
    // On empêche l'intéraction tant que les opérations (hors alti) ne sont pas terminées
    this.map.off("click", this.handleAddWayPoint);
    // Si on a cliqué sur un waypoint, on ne fait rien)
    if (this.map.getSource(this.configuration.pointsource) && this.map.queryRenderedFeatures(e.point, {
      layers: [RouteDrawLayers["point"].id, RouteDrawLayers["line"].id],
    })[0]) {
      this.map.on("click", this.handleAddWayPoint);
      return;
    }
    // TODO: Patience
    this.deactivate();
    var coordinates = e.lngLat;
    var order = "destination";
    if (this.data.points.length === 0) {
      order = "departure";
    }
    var length = this.data.points.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [coordinates.lng, coordinates.lat]
      },
      properties: {
        name: "",
        id: this.nextPointId,
        order: order,
      }
    });
    for (let i = 1; i < this.data.points.length - 1; i++) {
      this.data.points[i].properties.order = "";
    }
    this.nextPointId++;

    const address = await this.#computePointName(coordinates);

    // on ajoute les resultats dans le tableau (avec la length récupérée avant la promesse pour gérer l'asynchrone)
    this.data.points[length - 1].geometry.coordinates = [coordinates.lng, coordinates.lat];
    this.data.points[length - 1].properties.name = address;

    this.#updateSources();

    // Pas d'autre étape s'il n'y a qu'un point (premier point)
    if (this.data.points.length < 2) {
      if (Globals.backButtonState === "routeDraw") {
        this.#listeners();
      }
      // Enregistrement de l'état dans l'historique
      this.#saveState();
      return;
    }

    await this.#computeStep(this.data.points.length - 2);
    // Enregistrement de l'état dans l'historique
    this.#saveState();
    // Affichage et réactivation de l'intéractivité si on est toujours dans le tracé d'itinéraire
    if (Globals.backButtonState === "routeDraw") {
      this.#listeners();
    }
  }

  /**
   * ecouteur lors de la suppression d'un point
   * @param {*} e
   * @returns
   */
  async #onDeleteWayPoint(e) {
    // TODO patience
    // On empêche l'intéraction tant que les opérations (hors alti) ne sont pas terminées
    this.map.off("click", RouteDrawLayers["point"].id, this.handleDeletePoint);
    this.deactivate();
    const feature = this.map.queryRenderedFeatures(e.point, {
      layers: [RouteDrawLayers["point"].id],
    })[0];
    const deleteIndex = this.data.points.findIndex((point) => {
      return point.properties?.id === feature?.properties?.id;
    });
    if (this.data.points.length === 1) {
      this.#saveState();
    }
    this.data.points.splice(deleteIndex, 1);
    if (this.data.points.length > 0) {
      this.data.points[this.data.points.length - 1].properties.order = "destination";
      this.data.points[0].properties.order = "departure";
    }
    if (this.data.steps.length < 1) {
      this.#updateSources();
      this.map.on("click", RouteDrawLayers["point"].id, this.handleDeletePoint);
      this.#editionButtonsListeners();
      return;
    }
    if (deleteIndex == 0 || this.data.steps.length == 1) {
      const removedStep = this.data.steps.splice(0, 1);
      this.#updateElevation();
      this.data.duration -= removedStep[0].properties.duration;
      this.data.distance -= removedStep[0].properties.distance;
      if (Globals.backButtonState === "routeDraw") {
        this.__updateRouteInfo(this.data);
      }
      this.#updateSources();
    } else if (deleteIndex == this.data.points.length) {
      const removedStep = this.data.steps.splice(deleteIndex - 1, 1);
      this.#updateElevation();
      this.data.duration -= removedStep[0].properties.duration;
      this.data.distance -= removedStep[0].properties.distance;
      if (Globals.backButtonState === "routeDraw") {
        this.__updateRouteInfo(this.data);
      }
      this.#updateSources();
    } else {
      this.data.steps.splice(deleteIndex - 1, 1);
      await this.#computeStep(deleteIndex - 1);
    }
    this.map.on("click", RouteDrawLayers["point"].id, this.handleDeletePoint);
    // Enregistrement de l'état dans l'historique
    this.#saveState();
    this.#editionButtonsListeners();
    if (this.transport === "car") {
      document.getElementById("routeDrawModeSelect").style.removeProperty("max-height");
      document.getElementById("routeDrawModeArrow").style.removeProperty("transform");
      document.getElementById("routeDrawMode").removeEventListener("click", this.#informChangeTransportImpossible);
    }
  }

  /**
   *  calcule le nom d'un point via reverse geocoding
   * @param {MapLibreGL.LngLat}
   */
  async #computePointName(coordinates) {
    try {
      await Reverse.compute({
        lon: coordinates.lng,
        lat: coordinates.lat
      });
    } catch (err) {
      console.debug(err);
    } finally {
      var coords = Reverse.getCoordinates() || { lon: coordinates.lng, lat: coordinates.lat };
      var address = Reverse.getAddress() || coords.lon.toFixed(6) + ", " + coords.lat.toFixed(6);
      var strAddress = address;
      if (typeof address !== "string") {
        strAddress = "";
        strAddress += (address.number !== "") ? address.number + " " : "";
        strAddress += (address.street !== "") ? address.street + ", " : "";
        strAddress += (address.street !== "") ? address.city + ", " + address.postcode : address.postcode;
      }
    }
    return strAddress;
  }

  /**
   *  (re)calcule une étape du tracé a un index donné
   * @param {int} index
   */
  async #computeStep(index, mode = this.mode, computeElevation = true) {
    const firstPoint = this.data.points[index];
    const lastPoint = this.data.points[index + 1];
    // saisie libre
    if (mode === 0) {
      var distance = new MapLibreGL.LngLat(
        lastPoint.geometry.coordinates[0], lastPoint.geometry.coordinates[1]
      ).distanceTo(
        new MapLibreGL.LngLat(firstPoint.geometry.coordinates[0], firstPoint.geometry.coordinates[1])
      );
      var duration = distance / (4 / 3.6); // 4 km/h divisé par 3.6 pour m/s
      var stepCoords = [
        firstPoint.geometry.coordinates,
        lastPoint.geometry.coordinates
      ];
      // saisie guidée
    } else if (mode === 1) {
      var url = this.configuration.api +
        this.configuration.template({
          start: { lng: firstPoint.geometry.coordinates[0], lat: firstPoint.geometry.coordinates[1] },
          end: { lng: lastPoint.geometry.coordinates[0], lat: lastPoint.geometry.coordinates[1] },
          profile: this.transport,
        });
      this.loading = true;
      try {
        var response = await fetch(url, { signal: this.controller.signal });
        var json = await response.json();
      } catch (err) {
        this.loading = false;
        // TODO "Erreur lors de l'ajout du point"
        this.map.on("click", this.handleAddWayPoint);
        return;
      }
      this.loading = false;
      lastPoint.geometry.coordinates = json.geometry.coordinates.slice(-1)[0];
      firstPoint.geometry.coordinates = json.geometry.coordinates[0];
      stepCoords = json.geometry.coordinates;
      distance = json.distance;
      duration = json.duration;
      this.#updateSources();
    }

    var step = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: stepCoords
      },
      properties: {
        start_name: firstPoint.properties.name,
        end_name: lastPoint.properties.name,
        duration: duration,
        distance: distance,
        id: this.nextStepId,
        mode: mode,
      }
    };
    this.nextStepId++;

    if (index >= this.data.steps.length) {
      this.data.steps.push(step);
    } else {
      this.data.steps[index] = step;
    }
    this.#updateSources();
    this.data.distance = this.data.steps.reduce((totalDistance, step) => totalDistance + step.properties.distance, 0);
    this.data.duration = this.data.steps.reduce((totalDistance, step) => totalDistance + step.properties.duration, 0);
    if (computeElevation) {
      this.#updateElevation();
    }
    if (Globals.backButtonState === "routeDraw") {
      this.__updateRouteInfo(this.data);
    }
    if (this.data.steps.length > 0) {
      if (this.transport === "car") {
        document.getElementById("routeDrawModeSelect").style.maxHeight = "0";
        document.getElementById("routeDrawModeArrow").style.transform = "translate(0)";
        document.getElementById("routeDrawMode").addEventListener("click", this.#informChangeTransportImpossible);
      }
    }
  }

  /**
   * met à jour les données d'altitude (profil alti)
   */
  async #updateElevation() {
    if (this.transport === "car") {
      return;
    }
    this.__setElevationLoading();
    this.elevationLoading = true;
    const allCoordinates = this.data.steps.map((step) => step.geometry.coordinates).flat();
    this.elevation.setCoordinates(allCoordinates);
    let aborted;
    try {
      aborted = await this.elevation.compute(this.data.distance);
    } finally {
      if (!aborted) {
        this.elevationLoading = false;
        this.__unsetElevationLoading();
      }
    }
    this.data.elevationData = this.elevation.getData();
    if (Globals.backButtonState === "routeDraw") {
      this.dataHistory[this.currentHistoryPosition].elevationData = JSON.parse(JSON.stringify(this.data.elevationData));
      this.__updateRouteInfo(this.data);
      // Si mode lecture seule mais que l'alti est recalculée (non sauvegardé de base), on la rajoute dans les données enregistrées
      if (this.readonly) {
        this.routeDrawSave = new RouteDrawSave(null, {
          data: JSON.parse(JSON.stringify(this.data)),
          transport: this.transport,
          name: this.name,
          id: this.routeId,
        });
        this.routeDrawSave.saveToAccount();
      }
    }
  }

  /**
   * ajoute la source et le layer à la carte pour affichage du tracé
   */
  #addSourcesAndLayers() {
    this.map.addSource(this.configuration.linesource, {
      "type": "geojson",
      "data": {
        type: "FeatureCollection",
        features: this.data.steps,
      }
    });

    RouteDrawLayers["line-casing"].source = this.configuration.linesource;
    RouteDrawLayers["line"].source = this.configuration.linesource;
    RouteDrawLayers["line-dashed"].source = this.configuration.linesource;
    this.map.addLayer(RouteDrawLayers["line-casing"]);
    this.map.addLayer(RouteDrawLayers["line"]);
    this.map.addLayer(RouteDrawLayers["line-dashed"]);

    this.map.addSource(this.configuration.pointsource, {
      "type": "geojson",
      "data": {
        type: "FeatureCollection",
        features: this.data.points,
      }
    });

    RouteDrawLayers["point-casing"].source = this.configuration.pointsource;
    RouteDrawLayers["point"].source = this.configuration.pointsource;
    RouteDrawLayers["point-departure"].source = this.configuration.pointsource;
    RouteDrawLayers["point-destination"].source = this.configuration.pointsource;
    this.map.addLayer(RouteDrawLayers["point-casing"]);
    this.map.addLayer(RouteDrawLayers["point"]);
    this.map.addLayer(RouteDrawLayers["point-departure"]);
    this.map.addLayer(RouteDrawLayers["point-destination"]);
  }

  /**
   * met à jour les sources de données pour l'affichage
   */
  #updateSources() {
    var linesource = this.map.getSource(this.configuration.linesource);
    linesource.setData({
      type: "FeatureCollection",
      features: this.data.steps,
    });

    this.#updatePointSource();
  }

  /**
   * met à jour les sources de données de points pour l'affichage
   */
  #updatePointSource() {
    var pointsource = this.map.getSource(this.configuration.pointsource);
    pointsource.setData({
      type: "FeatureCollection",
      features: this.data.points,
    });
  }

  /**
   * enregistre l'état précédent dans l'historique et réinitialise les annulations
   */
  #saveState() {
    if (Globals.backButtonState === "routeDraw") {
      DOM.$routeDrawCancel.classList.remove("inactive");
    }
    DOM.$routeDrawRestore.classList.add("inactive");
    this.dataHistory = this.dataHistory.splice(this.currentHistoryPosition, this.dataHistory.length);
    this.dataHistory.unshift(JSON.parse(JSON.stringify(this.data)));
    this.currentHistoryPosition = 0;
  }

  /**
   * annule le changement précédent
   */
  #cancelChange() {
    if (this.currentHistoryPosition == this.dataHistory.length - 1) {
      return;
    }
    this.currentHistoryPosition++;
    DOM.$routeDrawRestore.classList.remove("inactive");
    this.data = JSON.parse(JSON.stringify(this.dataHistory[this.currentHistoryPosition]));
    if (this.data.elevationData.elevationData && this.data.elevationData.elevationData.length > 1) {
      this.elevation.setData(this.data.elevationData);
    } else {
      this.#updateElevation();
    }
    this.#updateSources();
    this.__updateRouteInfo(this.data);
    if (this.currentHistoryPosition == this.dataHistory.length - 1) {
      DOM.$routeDrawCancel.classList.add("inactive");
    }
    if (this.data.steps.length === 0) {
      if (this.transport === "car") {
        document.getElementById("routeDrawModeSelect").style.removeProperty("max-height");
        document.getElementById("routeDrawModeArrow").style.removeProperty("transform");
        document.getElementById("routeDrawMode").removeEventListener("click", this.#informChangeTransportImpossible);
      }
    }
  }

  /**
   * restore le changement précédent
   */
  #restoreChange() {
    if (this.currentHistoryPosition == 0) {
      return;
    }
    this.currentHistoryPosition--;
    DOM.$routeDrawCancel.classList.remove("inactive");
    this.data = JSON.parse(JSON.stringify(this.dataHistory[this.currentHistoryPosition]));
    if (this.data.elevationData.elevationData.length > 1) {
      this.elevation.setData(this.data.elevationData);
    } else {
      this.#updateElevation();
    }
    this.#updateSources();
    this.__updateRouteInfo(this.data);
    if (this.currentHistoryPosition == 0) {
      DOM.$routeDrawRestore.classList.add("inactive");
      return;
    }
  }

  /**
   * toggle entre mode suppression du point et mode normal
   * @public
   */
  toggleDelete() {
    if (this.delete) {
      this.delete = false;
      DOM.$routeDrawDelete.classList.add("inactive");
      this.map.off("click", RouteDrawLayers["point"].id, this.handleDeletePoint);
      this.map.on("touchstart", RouteDrawLayers["point"].id, this.handleTouchStartPoint);
      this.map.on("touchstart", RouteDrawLayers["line"].id, this.handleTouchStartLine);
      this.map.on("click", this.handleAddWayPoint);
      return;
    }
    Toast.show({
      text: "Sélectionnez le point que vous souhaitez supprimer",
      duration: "short",
      position: "bottom"
    });
    this.delete = true;
    this.map.off("touchstart", RouteDrawLayers["point"].id, this.handleTouchStartPoint);
    this.map.off("touchstart", RouteDrawLayers["line"].id, this.handleTouchStartLine);
    this.map.off("click", this.handleAddWayPoint);
    this.map.on("click", RouteDrawLayers["point"].id, this.handleDeletePoint);
    DOM.$routeDrawDelete.classList.remove("inactive");
  }

  /**
   * toggle entre saisie libre et guidée
   * @public
   */
  changeMode(mode) {
    if (mode == 1) {
      this.mode = 1;
      DOM.$routeDrawMode.querySelector("#routeDrawModeText").innerText = "Saisie guidée";
      return;
    }
    this.mode = 0;
    DOM.$routeDrawMode.querySelector("#routeDrawModeText").innerText = "Saisie libre";
  }

  /**
   * Supprime les donnés dans les sources
   */
  #clearSources() {
    this.map.getSource(this.configuration.pointsource).setData({
      "type": "FeatureCollection",
      "features": []
    });
    this.map.getSource(this.configuration.linesource).setData({
      "type": "FeatureCollection",
      "features": []
    });
    this.#updateSources();
  }

  /**
   * nettoyage du tracé
   * @public
   */
  clear() {
    if (this.delete) {
      this.toggleDelete();
    }
    this.elevation.clear();
    this.elevationLoading = false;
    this.__unsetElevationLoading();
    this.deactivate();
    if (this.loading) {
      this.controller.abort();
      this.controller = new AbortController();
      this.loading = false;
    }
    this.data = {
      duration: 0,
      distance: 0,
      points: [],
      steps: [],
      elevationData: {
        dplus: 0,
        dminus: 0,
      },
    };
    this.routeId = null;
    this.dataHistory = [];
    this.__updateRouteInfo(this.data);
    DOM.$routeDrawCancel.classList.add("inactive");
    this.#clearSources();
    DOM.$routeDrawRestore.classList.add("inactive");
    DOM.$routeDrawCancel.classList.add("inactive");
    if (this.transport === "car") {
      document.getElementById("routeDrawModeSelect").style.removeProperty("max-height");
      document.getElementById("routeDrawModeArrow").style.removeProperty("transform");
      document.getElementById("routeDrawMode").removeEventListener("click", this.#informChangeTransportImpossible);
    }
  }

  /**
   * affiche le menu de tracé d'itinéraire
   * @public
   */
  show() {
    this.readonly = false;
    Globals.menu.open("routeDraw");
  }

  /**
   * affiche le menu de tracé d'itinéraire (lecture seule)
   * @public
   */
  showDetails() {
    this.readonly = true;
    this.dom.title.classList.remove("d-none");
    this.dom.edit.classList.remove("d-none");
    Globals.menu.open("routeDraw");
  }

  /**
   * ferme le menu des résultats du calcul
   * @public
   */
  hide() {
    const routeId = this.routeId;
    Globals.menu.close("routeDraw");
    if (routeId !== null && !document.getElementById(`route-visibility_ID_${routeId}`).checked) {
      document.getElementById(`route-visibility_ID_${routeId}`).click();
    }
  }

  /**
   * affiche la popup d'aide
   * @public
   */
  showHelpPopup() {
    // on supprime la popup
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }

    // template litteral
    const popupContent = `
        <div id="routeDrawHelpPopup">
            <div class="divPositionTitle">Mode de saisie</div>
            <div class="divPopupClose" onclick="onCloseRouteDrawHelpPopup(event)"></div>
            <div class="divPopupContent">
                La saisie d'itinéraire peut se faire selon deux modes pour les itinéraires pédestres :<br/>
                • Saisie guidée : Le chemin entre deux points saisis suivra le réseau des routes et chemins.<br/>
                • Saisie libre : Le chemin sera constitué de lignes droites entre les points saisis.<br/>
                Il est possible de faire un itinéraire pédestre combinant les deux modes de saisie. <br/><br/>
                Pour les itinéraires en véhicule, seule la saisie guidée est disponible.
            </div>
        </div>
        `;
    var self = this;
    window.onCloseRouteDrawHelpPopup = () => {
      self.popup.remove();
    };

    // centre de la carte
    var center = this.map.getCenter();
    // position de la popup
    var popupOffsets = {
      "bottom": [0, 100],
    };
    // ouverture d'une popup
    this.popup = new MapLibreGL.Popup({
      offset: popupOffsets,
      className: "routeDrawHelpPopup",
      closeOnClick: true,
      closeOnMove: true,
      closeButton: false
    })
      .setLngLat(center)
      .setHTML(popupContent)
      .setMaxWidth("300px")
      .addTo(this.map);
  }

}

// mixins
Object.assign(RouteDraw.prototype, RouteDrawDOM);

export default RouteDraw;
