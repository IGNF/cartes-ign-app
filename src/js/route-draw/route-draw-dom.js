import utils from "../utils/unit-utils";
import DomUtils from "../utils/dom-utils";

import { Toast } from "@capacitor/toast";

import LoadingDark from "../../css/assets/loading-darkgrey.svg";

/**
 * DOM du contrôle du dessin d'itineraire
 * @mixin RouteDrawDOM
 */
let RouteDrawDOM = {

  dom : {
    container: null,
    title: null,
    titlewrapper: null,
    summary: null,
    details: null,
    detailsList: null,
  },

  /**
     * obtenir le container principal
     * @param {*} transport
     * @returns {DOMElement}
     * @public
     */
  getContainer (transport) {
    // nettoyage
    if (this.dom.container) {
      this.dom.container.remove();
    }
    // ajout du container principal
    var container = this.__addResultsContainerDOMElement();
    // ajout du résumé
    this.dom.summary = this.__addResultsSummaryContainerDOMElement(transport);
    container.appendChild(this.dom.summary);
    // ajout des détails (profil alti et détails du parcours)
    this.dom.details = this.__addResultsListDetailsContainerDOMElement();
    container.appendChild(this.dom.details);

    return container;
  },

  /**
     * ajout du container principal
     * @returns {DOMElement}
     * @private
     */
  __addResultsContainerDOMElement () {
    var div = this.dom.container = document.createElement("div");
    div.id = "routeDrawResults";
    div.className = "";

    var wrapper = this.dom.titlewrapper = document.createElement("div");
    wrapper.className = "routeDrawTitleWrapper";
    var title = this.dom.title = document.createElement("p");
    title.classList.add("routeDrawResultsTitle");
    wrapper.appendChild(title);

    var labelAdvancedTools = this.dom.labelAdvancedTools = document.createElement("label");
    labelAdvancedTools.id = "route-draw-show-advanced-tools";
    labelAdvancedTools.title = "Plus d'outils";
    labelAdvancedTools.className = "tools-layer-advanced";

    var tplContainer = `
    <div id="route-draw-advanced-tools" class="tools-layer-advanced-menu">
      <div id="route-draw-advanced-edit" class="tools-layer-edit" title="Modifier l'itinéraire">Modifier</div>
      <div id="route-draw-advanced-share" class="tools-layer-share" title="Partager l'itinéraire">Partager</div>
      <div id="route-draw-advanced-export" class="tools-layer-export" title="Exporter l'itinéraire">Exporter</div>
      <div id="route-draw-advanced-remove" class="tools-layer-remove" title="Supprimer l'itinéraire'">Supprimer</div>
    </div>
    `;

    var advancedTools = DomUtils.stringToHTML(tplContainer.trim());
    advancedTools.querySelector("#route-draw-advanced-share").addEventListener("click", this.shareRoute.bind(this));
    advancedTools.querySelector("#route-draw-advanced-export").addEventListener("click", this.exportRoute.bind(this));
    advancedTools.querySelector("#route-draw-advanced-edit").addEventListener("click", this.openEdition.bind(this));
    let hasBeenClicked = false;
    advancedTools.querySelector("#route-draw-advanced-remove").addEventListener("click", () => {
      if (!hasBeenClicked) {
        Toast.show({
          text: "Confirmez la suppression de l'itinéraire",
          duration: "short",
          position: "bottom"
        });
        hasBeenClicked = true;
      } else {
        this.deleteRoute();
        hasBeenClicked = false;
      }
    });

    wrapper.appendChild(labelAdvancedTools);
    wrapper.appendChild(advancedTools);
    div.appendChild(wrapper);
    return div;
  },

  /**
     * ajoute le container le résumé du parcours
     * @param {*} transport
     * @returns {DOMElement}
     * @private
     */
  __addResultsSummaryContainerDOMElement (transport) {
    var div = document.createElement("div");
    div.id = "routeDrawSummary";
    div.className = "";

    var line1 = document.createElement("div");
    var line2 = document.createElement("div");
    line2.className = "routeDrawSummaryDenivele";

    var labelTransport = document.createElement("label");
    labelTransport.className = "routeDrawSummaryTransport lblRouteDrawSummaryTransport" + transport;
    line1.appendChild(labelTransport);

    var labelDuration = document.createElement("label");
    labelDuration.className = "routeDrawSummaryDuration";
    labelDuration.textContent = utils.convertSecondsToTime(0);
    line1.appendChild(labelDuration);

    var labelDistance = document.createElement("label");
    labelDistance.className = "routeDrawSummaryDistance";
    labelDistance.textContent = utils.convertDistance(0);
    line1.appendChild(labelDistance);

    var labelDPlus = document.createElement("label");
    labelDPlus.className = "routeDrawSummaryDPlus";
    labelDPlus.textContent = "0 m";
    line2.appendChild(labelDPlus);

    var labelDMinus = document.createElement("label");
    labelDMinus.className = "routeDrawSummaryDMinus";
    labelDMinus.textContent = "- 0 m";
    line2.appendChild(labelDMinus);

    div.appendChild(line1);
    div.appendChild(line2);

    return div;
  },

  /**
     * ajoute le container sur les détails du parcours
     * @returns {DOMElement}
     * @private
     */
  __addResultsListDetailsContainerDOMElement () {

    var div = document.createElement("div");
    div.id = "routeDrawDetails";
    div.className = "";

    var profileHeader = document.createElement("p");
    profileHeader.className = "elevationLineHeader";
    profileHeader.textContent = "Profil altimétrique";
    div.appendChild(profileHeader);

    var canvasProfile = document.createElement("canvas");
    canvasProfile.id = "routedraw-elevationline";
    canvasProfile.className = "elevationLineCanvas";
    canvasProfile.style.width = "100%";
    div.appendChild(canvasProfile);

    var detailsHeader = document.createElement("p");
    detailsHeader.className = "detailsHeader";
    detailsHeader.textContent = "Détails du parcours";
    div.appendChild(detailsHeader);

    this.dom.detailsList = document.createElement("div");
    this.dom.detailsList.id = "routedraw-details";
    this.dom.detailsList.className = "routedrawDetails";
    div.appendChild(this.dom.detailsList);

    div.style.display = "none";

    return div;
  },


  /**
   * Met à jour le titre de l'itinéraire dans le dom
   * @param {String} title - titre de l'itinéraire
   * @private
   */
  __updateTitle (title) {
    this.dom.title.innerText = title;
  },

  /**
     * Met à jour les infos dans le DOM
     * @param {*} data - RouteDraw.data
     * @returns {DOMElement}
     * @private
     */
  __updateRouteInfo (data) {
    var labelDuration = this.dom.summary.querySelector(".routeDrawSummaryDuration");
    labelDuration.textContent = utils.convertSecondsToTime(data.duration);

    var labelDistance = this.dom.summary.querySelector(".routeDrawSummaryDistance");
    labelDistance.textContent = utils.convertDistance(data.distance);

    if (!this.elevationLoading) {
      var labelDPlus = this.dom.summary.querySelector(".routeDrawSummaryDPlus");
      labelDPlus.textContent = `${data.elevationData.dplus} m`;

      var labelDMinus = this.dom.summary.querySelector(".routeDrawSummaryDMinus");
      labelDMinus.textContent = `- ${data.elevationData.dminus} m`;
    }

    // Ajout du détail du parcours
    let totalSeconds = 0;
    this.dom.detailsList.innerHTML = "";
    if (data.steps.length > 0) {
      // Code facilement adaptable si on veut afficher toutes les étapes (ADDSTEPS)
      // ADDSTEPS:  i += data.points.length - 1 --> i++
      for (let i = 0; i < data.points.length; i += data.points.length - 1) {
        const waypoint = data.points[i];
        var waypointDiv = document.createElement("div");
        waypointDiv.classList.add("routeDrawWaypointDiv");
        var waypointImage = document.createElement("span");
        var waypointLabelText = "Étape";
        var waypointLabelDurationText = "";
        waypointImage.classList.add("routeDrawWaypointImg");
        if (i == 0) {
          waypointImage.classList.add("routeDrawFirstWaypointImg");
          waypointLabelText = "Point de départ";
          waypointLabelDurationText = utils.convertSecondsToTime(totalSeconds);
        } else if (i == data.points.length - 1) {
          waypointLabelText = "Point d'arrivée";
          waypointImage.classList.add("routeDrawLastWaypointImg");
        }
        waypointDiv.appendChild(waypointImage);
        var waypointTextDiv = document.createElement("div");
        waypointTextDiv.classList.add("routeDrawWaypointTextDiv");
        var waypointLabel = document.createElement("div");
        waypointLabel.classList.add("routeDrawWaypointLabel");
        var waypointLabelTextSpan = document.createElement("span");
        waypointLabelTextSpan.innerText = waypointLabelText;
        waypointLabel.appendChild(waypointLabelTextSpan);
        var waypointLabelDurationTextSpan = document.createElement("span");
        waypointLabelDurationTextSpan.innerText = waypointLabelDurationText;

        if (i > 0) {
          // ADDSTEPS: const step = data.steps[i - 1];
          // Ajout de la div du step
          var stepDiv = document.createElement("div");
          stepDiv.classList.add("routeDrawStepDiv");
          stepDiv.innerText = utils.convertDistance(data.distance) + // ADDSTEPS: data.distance -> step.porperties.distance
                        " / " +
                        utils.convertSecondsToTime(data.duration); // ADDSTEPS: data.duration -> step.porperties.duration
          this.dom.detailsList.appendChild(stepDiv);
          totalSeconds += data.duration; // ADDSTEPS: data.duration -> step.porperties.duration
          waypointLabelDurationTextSpan.innerText = utils.convertSecondsToTime(totalSeconds);
        }
        waypointLabel.appendChild(waypointLabelDurationTextSpan);
        waypointTextDiv.appendChild(waypointLabel);
        var waypointName = document.createElement("span");
        waypointName.classList.add("routeDrawWaypointName");
        waypointName.innerText = waypoint.properties.name;
        waypointTextDiv.appendChild(waypointName);

        waypointDiv.appendChild(waypointTextDiv);
        this.dom.detailsList.appendChild(waypointDiv);
      }
      this.dom.details.style.removeProperty("display");
    } else {
      this.dom.details.style.display = "none";
    }
  },

  /**
     * bouton de calcul en mode chargement
     * @private
     */
  __setElevationLoading () {
    var loadingImgHtml = `<img src="${LoadingDark}" height="12px">`;
    var labelDPlus = this.dom.summary.querySelector(".routeDrawSummaryDPlus");
    labelDPlus.innerHTML = `${loadingImgHtml} m`;

    var labelDMinus = this.dom.summary.querySelector(".routeDrawSummaryDMinus");
    labelDMinus.innerHTML = `- ${loadingImgHtml} m`;
  },

  /**
     * bouton de calcul: fin du chargement
     * @private
     */
  __unsetElevationLoading () {
    console.debug("Profil alti loaded");
  },

};

export default RouteDrawDOM;
