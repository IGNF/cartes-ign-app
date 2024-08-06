/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Instruction from "./directions-instructions";
import utils from "../utils/unit-utils";

/**
 * DOM du contrôle du calcul d'itineraire - resultats du calcul
 * @mixin DirectionsResultsDOM
 * @fixme fusionner les points intermediaires
 */
let DirectionsResultsDOM = {

  dom : {
    container : null,
    btnReturnBack : null,
    btnShowDetails : null
  },

  /**
     * obtenir le container principal
     * @param {*} data
     * @returns {DOMElement}
     * @public
     */
  getContainer (data) {
    // nettoyage
    if (this.dom.container) {
      this.dom.container.remove();
    }
    // ajout du container principal
    var container = this.__addResultsContainerDOMElement();
    // div du résultat sans détails
    var noDetailsDiv = document.createElement("div");
    // ajout du résumé
    noDetailsDiv.appendChild(this.__addResultsSummaryContainerDOMElement(
      data.distance,
      data.duration,
      data.transport,
      data.computation
    ));
    // ajout du bouton détails
    noDetailsDiv.appendChild(this.__addResultsDetailsContainerDOMElement());
    container.appendChild(noDetailsDiv);
    // ajout des détails
    try {

      container.appendChild(this.__addResultsListDetailsContainerDOMElement(data.instructions, data.transport));
    } catch (err) {
      console.error(err);
    }

    return container;
  },

  /**
     * ajout du container principal
     * @returns {DOMElement}
     * @private
     */
  __addResultsContainerDOMElement () {
    var div = this.dom.container = document.createElement("div");
    div.id = "directionsResults";
    div.className = "";

    return div;
  },

  /**
     * ajoute le container le résumé du parcours
     * @param {*} distance
     * @param {*} duration
     * @param {*} transport
     * @param {*} computation
     * @returns {DOMElement}
     * @private
     */
  __addResultsSummaryContainerDOMElement (distance, duration, transport, computation) {
    var div = document.createElement("div");
    div.id = "directionsSummary";
    div.className = "";

    var line1 = document.createElement("div");
    var line2 = document.createElement("div");

    var labelDuration = document.createElement("label");
    labelDuration.id = "directionsSummaryDuration";
    labelDuration.className = "lblDirectionsSummaryDuration";
    labelDuration.textContent = utils.convertSecondsToTime(duration);
    line1.appendChild(labelDuration);

    var labelDistance = document.createElement("label");
    labelDistance.id = "directionsSummaryDistance";
    labelDistance.className = "lblDirectionsSummaryDistance";
    labelDistance.textContent = utils.convertDistance(distance);
    line1.appendChild(labelDistance);

    var labelTransport = document.createElement("label");
    labelTransport.id = "directionsSummaryTransport" + transport;
    labelTransport.className = "lblDirectionsSummaryTransport";
    line2.appendChild(labelTransport);

    var labelComputation = document.createElement("label");
    labelComputation.id = "directionsSummaryComputation";
    labelComputation.className = "lblDirectionsSummaryComputation";
    labelComputation.textContent = computation;
    line2.appendChild(labelComputation);

    div.appendChild(line1);
    div.appendChild(line2);

    return div;
  },

  /**
     * ajoute le bouton d'affichage des détails
     * @returns
     */
  __addResultsDetailsContainerDOMElement () {
    // contexte de la classse
    var self = this;

    var div = document.createElement("div");
    div.id = "directionsDetails";
    div.className = "";

    var inputShow = this.dom.inputShow = document.createElement("input");
    inputShow.id = "directionsShowDetail";
    inputShow.type = "checkbox";
    inputShow.addEventListener("change", function (e) {
      self.toggleDisplayDetails(e);
    });
    div.appendChild(inputShow);

    var labelShow = document.createElement("label");
    labelShow.className = "lblDirectionsShowDetails";
    labelShow.htmlFor = "directionsShowDetail";
    labelShow.title = "Détails";
    labelShow.textContent = "Détails";
    labelShow.addEventListener("click", function () {
      // TODO
    });
    div.appendChild(labelShow);

    return div;
  },

  /**
     * ajoute le container sur les détails du parcours
     * @param {*} instructions - routes[0].legs[]
     * @returns {DOMElement}
     * @private
     */
  __addResultsListDetailsContainerDOMElement (instructions, transport) {

    var divList = document.createElement("div");
    divList.id = "directionsListDetails";
    divList.className = "";

    divList.appendChild(this.__addInstructionListDOMElement(instructions));

    // FIXME comment fusionner les points intermediaires ?
    if (transport !== "Voiture") {
      var profileHeader = document.createElement("p");
      profileHeader.className = "elevationLineHeader";
      profileHeader.textContent = "Profil altimétrique";
      divList.appendChild(profileHeader);

      var canvasProfile = document.createElement("canvas");
      canvasProfile.id = "directions-elevationline";
      canvasProfile.className = "elevationLineCanvas";
      canvasProfile.style.width = "100%";
      divList.appendChild(canvasProfile);
    }

    return divList;
  },

  __addInstructionListDOMElement(instructions) {
    var divList = document.createElement("div");
    divList.id = "directionsInstructionsList";
    var first = instructions[0].steps[0];
    var last = instructions.slice(-1)[0].steps.slice(-1)[0];

    var opts = {
      duration : 0,
      distance : 0
    };
    // instructions = routes[0].legs[n]
    for (let i = 0; i < instructions.length; i++) {
      // instruction = steps[n]
      const instruction = instructions[i];
      instruction.steps.forEach((step, index) => {
        // step = {
        //     distance
        //     driving_side
        //     duration
        //     maneuver: {
        //         modifier
        //         type
        //     }
        // }
        var type = null; // depart, arrive or other
        // on additionne les temps et distances pour tous les troncons !
        opts.duration += step.duration;
        opts.distance += step.distance;
        if (step === first) {
          // point de depart
          type = "first";
        }
        else if (step === last) {
          // point d'arrivée
          type = "last";
        }
        else if (index === (instruction.steps.length - 1)) {
          // étapes intermediares
          // > arrivée d'un troncon et départ d'un autre troncon
          type = "step";

        } else {
          // par defautt
        }
        var el = this.__addResultsDetailsInstructionDOMElement(step, type, opts);
        if (el) {
          divList.appendChild(el);
        }
      });
    }

    return divList;
  },

  /**
     * ajoute une étape de parcours
     * @param {*} step - routes[0].legs[].steps[]
     * @returns {DOMElement}
     * @private
     */
  __addResultsDetailsInstructionDOMElement (step, type, opts) {
    // step = {
    //     distance
    //     driving_side
    //     duration
    //     name
    //     mode
    //     maneuver: {
    //         modifier
    //         type
    //     }
    // }
    var instruction = new Instruction(step);

    var divContainer = document.createElement("div");
    divContainer.className = "divDirectionsDetailsItem";

    var labelIcon = document.createElement("label");
    labelIcon.classList.add("lblDirectionsDetailsItemGuidance");
    // HACK
    labelIcon.classList.add((type && type === "step") ? "lblDirectionsDetailsItemGuidance-point-step" : instruction.getGuidance());
    divContainer.appendChild(labelIcon);

    var divDistAndDesc = document.createElement("div");
    divDistAndDesc.className = "divDirectionsDetailsItemDistanceAndDesc";

    if (instruction.isStep()) {
      var divDistance = document.createElement("div");
      divDistance.className = "divDirectionsDetailsItemDistance";
      divDistance.textContent = utils.convertDistance(step.distance);
      divDistAndDesc.appendChild(divDistance);
    }

    var divDesc = document.createElement("div");
    divDesc.className = "divDirectionsDetailsItemDesc";
    divDesc.textContent = instruction.getDescription();
    divDistAndDesc.appendChild(divDesc);

    divContainer.appendChild(divDistAndDesc);

    if (type && type === "first") {
      var divDuration = document.createElement("div");
      divDuration.className = "divDirectionsDetailsItemDuration";
      divDuration.textContent = "0 min";
      divContainer.appendChild(divDuration);
    }

    if (type && type === "last") {
      divDuration = document.createElement("div");
      divDuration.className = "divDirectionsDetailsItemDuration";
      divDuration.textContent = utils.convertSecondsToTime(opts.duration);
      divContainer.appendChild(divDuration);
    }


    return divContainer;
  },

  __updateDurationDom() {
    this.dom.container.querySelector("#directionsSummaryDuration").textContent = utils.convertSecondsToTime(this.options.duration);
    this.dom.container.querySelector("#directionsInstructionsList").replaceWith(this.__addInstructionListDOMElement(this.options.instructions));
  }

};

export default DirectionsResultsDOM;
