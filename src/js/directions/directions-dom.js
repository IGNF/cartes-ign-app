/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import LoadingWhite from "../../css/assets/loading-white.svg";
import { Toast } from "@capacitor/toast";

/**
 * DOM du contrôle du calcul d'itineraire
 * @mixin DirectionsDOM
 */
let DirectionsDOM = {

  dom: {
    container: null,
    inputCar: null,
    inputPedestrian: null,
    inputFastest: null,
    inputShortest: null,
    inputDeparture: null,
    inputArrival: null,
    buttonCompute: null,
  },

  /**
   * obtenir le container principal
   * @returns {DOMElement}
   * @public
   */
  getContainer() {
    // ajout du formulaire
    var container = this.__addComputeFormDOMElement();
    // ajout du mode de transport
    container.appendChild(this.__addComputeContainerTransportDOMElement());
    // ajout des locations
    container.appendChild(this.__addComputeContainerLocationsDOMElement());
    // ajout du mode de calcul
    container.appendChild(this.__addComputeContainerComputationDOMElement());
    // ajout du bouton submit
    container.appendChild(this.__addComputeButtonDOMElement());
    return container;
  },

  /**
   * ajout du formulaire
   * @returns {DOMElement}
   * @private
   */
  __addComputeFormDOMElement() {
    var form = this.dom.container = document.createElement("form");
    form.id = "directionsForm";
    form.setAttribute("onkeypress", "return event.keyCode != 13;"); // FIXME hack pour desactiver l'execution via 'enter' au clavier !

    // contexte de la classse
    var self = this;
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // recuperer les valeurs des composants HTML:
      // - transport
      // - computation
      // - locations

      var transport = null;
      // voiture ?
      if (self.dom.inputCar) {
        if (self.dom.inputCar.checked) {
          transport = self.dom.inputCar.value;
        }
      }
      // pieton ?
      if (self.dom.inputPedestrian) {
        if (self.dom.inputPedestrian.checked) {
          transport = self.dom.inputPedestrian.value;
        }
      }

      var computation = null;
      // fast ?
      if (self.dom.inputFastest) {
        if (self.dom.inputFastest.checked) {
          computation = self.dom.inputFastest.value;
        }
      }
      // short ?
      if (self.dom.inputShortest) {
        if (self.dom.inputShortest.checked) {
          computation = self.dom.inputShortest.value;
        }
      }

      // recuperation des coordonnées issues du geocodage
      // le geocodage enregistre les coordonnées dans la tag data-coordinates :
      //   data-coordinates = "[2.24,48.80]"
      var locations = [];
      var points = document.getElementsByClassName("inputDirectionsLocations");
      var start = points[0].dataset.coordinates;
      var end = points[points.length - 1].dataset.coordinates;
      if (start) {
        locations.push(start);
      }
      for (let i = 1; i < points.length - 1; i++) {
        if (points[i].dataset.coordinates) {
          locations.push(points[i].dataset.coordinates);
        }
      }
      if (end) {
        locations.push(end);
      }
      if (locations.length < 2) {
        Toast.show({
          text: "Au moins 2 lieux sont nécessaires pour le calcul d'itinéraire",
          duration: "long",
          position: "bottom"
        });
        return;
      }
      // passer les valeurs au service
      self.compute({
        transport: transport,
        computation: computation,
        locations: locations
      });

      return false;
    });

    return form;
  },

  /**
   * ajout du bouton de calcul
   * @returns {DOMElement}
   * @private
   */
  __addComputeButtonDOMElement() {
    var input = this.dom.buttonCompute = document.createElement("input");
    input.id = "directionsCompute";
    input.className = "btnDirectionsCompute";
    input.type = "submit";
    input.value = "Calculer";

    return input;
  },

  /**
   * bouton de calcul en mode chargement
   * @private
   */
  __setComputeButtonLoading() {
    this.dom.buttonCompute.value = "";
    this.dom.buttonCompute.disabled = true;
    this.dom.buttonCompute.style.backgroundImage = "url(" + LoadingWhite + ")";
    document.querySelectorAll(".inputDirectionsLocationsContainer").forEach((el) => {
      el.classList.add("disabled");
    });
  },

  /**
   * bouton de calcul: fin du chargement
   * @private
   */
  __unsetComputeButtonLoading() {
    this.dom.buttonCompute.value = "Calculer";
    this.dom.buttonCompute.disabled = false;
    this.dom.buttonCompute.style.removeProperty("background-image");
    document.querySelectorAll(".inputDirectionsLocationsContainer").forEach((el) => {
      el.classList.remove("disabled");
    });
  },

  /**
   * ajoute le container sur le mode de transport
   * @returns {DOMElement}
   * @private
   */
  __addComputeContainerTransportDOMElement() {
    // cf. https://uiverse.io/Pradeepsaranbishnoi/heavy-dragonfly-92
    var div = document.createElement("div");
    div.className = "divDirectionsTransport";

    var inputPedestrian = this.dom.inputPedestrian = document.createElement("input");
    inputPedestrian.id = "directionsTransportPieton";
    inputPedestrian.type = "radio";
    inputPedestrian.name = "Transport";
    inputPedestrian.value = "Pieton";
    inputPedestrian.checked = true;
    var self = this;
    inputPedestrian.addEventListener("change", function (e) {
      if (e.target.checked) {
        self.obj.configuration.profile = "pedestrian";
      }
    });
    div.appendChild(inputPedestrian);

    var labelPedestrian = document.createElement("label");
    labelPedestrian.className = "lblDirectionsTransport";
    labelPedestrian.htmlFor = "directionsTransportPieton";
    labelPedestrian.title = "À pied";
    labelPedestrian.textContent = "À pied";
    div.appendChild(labelPedestrian);

    var inputCar = this.dom.inputCar = document.createElement("input");
    inputCar.id = "directionsTransportVoiture";
    inputCar.type = "radio";
    inputCar.name = "Transport";
    inputCar.value = "Voiture";
    inputCar.addEventListener("change", function (e) {
      if (e.target.checked) {
        self.obj.configuration.profile = "car";
      }
    });
    div.appendChild(inputCar);

    var labelCar = document.createElement("label");
    labelCar.className = "lblDirectionsTransport";
    labelCar.htmlFor = "directionsTransportVoiture";
    labelCar.title = "Véhicule";
    labelCar.textContent = "Véhicule";
    div.appendChild(labelCar);

    var slider = document.createElement("span");
    slider.className = "sliderDirections";
    div.appendChild(slider);

    return div;
  },

  /**
   * ajoute le container sur le mode de calcul
   * @returns {DOMElement}
   * @private
   */
  __addComputeContainerComputationDOMElement() {
    // https://uiverse.io/Yaya12085/rude-mouse-79
    var div = document.createElement("div");
    div.className = "divDirectionsComputation";

    var inputFastest = this.dom.inputFastest = document.createElement("input");
    inputFastest.id = "directionsComputationFastest";
    inputFastest.type = "radio";
    inputFastest.name = "Computation";
    inputFastest.value = "Fastest";
    inputFastest.checked = true;
    var self = this;
    inputFastest.addEventListener("change", function (e) {
      if (e.target.checked) {
        self.obj.configuration.optimization = "fastest";
      }
    });
    div.appendChild(inputFastest);

    var labelFastest = document.createElement("label");
    labelFastest.className = "lblDirectionsComputation";
    labelFastest.htmlFor = "directionsComputationFastest";
    labelFastest.title = "Fastest";
    labelFastest.textContent = "Plus rapide";
    div.appendChild(labelFastest);

    var inputShortest = this.dom.inputShortest = document.createElement("input");
    inputShortest.id = "directionsComputationShortest";
    inputShortest.type = "radio";
    inputShortest.name = "Computation";
    inputShortest.value = "Shortest";
    inputShortest.addEventListener("change", function (e) {
      if (e.target.checked) {
        self.obj.configuration.optimization = "shortest";
      }
    });
    div.appendChild(inputShortest);

    var labelShortest = document.createElement("label");
    labelShortest.className = "lblDirectionsComputation";
    labelShortest.htmlFor = "directionsComputationShortest";
    labelShortest.title = "Shortest";
    labelShortest.textContent = "Plus court";
    div.appendChild(labelShortest);

    var slider = document.createElement("span");
    slider.className = "sliderComputation";
    div.appendChild(slider);

    return div;
  },

  /**
   * ajoute le container sur la saisie de locations
   * @returns {DOMElement}
   * @private
   */
  __addComputeContainerLocationsDOMElement() {
    // contexte de la classse
    var self = this;

    // https://uiverse.io/satyamchaudharydev/plastic-bobcat-37
    var div = document.createElement("div");
    div.className = "divDirectionsLocations";

    var divDefault = document.createElement("div");
    divDefault.id = "divDirectionsLocationsList";

    var divContainer = document.createElement("div");
    divContainer.className = "divDirectionsLocationsItem draggable-layer start";
    divContainer.id = "divDirectionsLocationsItem_start";

    var labelDeparture = document.createElement("label");
    labelDeparture.id = "directionsLocationImg_first";
    labelDeparture.className = "lblDirectionsLocations directionsLocationImg";
    divContainer.appendChild(labelDeparture);

    var divInput = document.createElement("div");
    divInput.className = "inputDirectionsLocationsContainer";

    var inputLocationDeparture = document.createElement("input");
    inputLocationDeparture.id = "directionsLocation_start";
    inputLocationDeparture.className = "inputDirectionsLocations";
    inputLocationDeparture.type = "text";
    inputLocationDeparture.placeholder = "D'où partez-vous ?";
    inputLocationDeparture.name = "start";
    // le geocodage enregistre les coordonnées dans la tag data-coordinates :
    //   data-coordinates = "[2.24,48.80]"
    inputLocationDeparture.dataset.coordinates = "";
    inputLocationDeparture.addEventListener("click", function (e) {
      // ouverture du menu de recherche
      self.onOpenSearchLocation(e);
    });
    divInput.appendChild(inputLocationDeparture);
    // Stockage du input de départ pour interaction avec modules externes
    self.dom.inputDeparture = inputLocationDeparture;

    var labelCross = document.createElement("label");
    labelCross.className = "handle-draggable-layer";
    labelCross.addEventListener("click", () => { });
    divInput.appendChild(labelCross);

    divContainer.appendChild(divInput);

    divDefault.appendChild(divContainer);

    // on pre ajoute 5 étapes max
    for (let i = 1; i <= 5; i++) {
      divContainer = document.createElement("div");
      divContainer.className = "divDirectionsLocationsItem draggable-layer hidden step";
      divContainer.id = "divDirectionsLocationsItem_" + i;

      var labelMiddle = document.createElement("label");
      labelMiddle.id = "directionsLocationsImg_middle_" + i;
      labelMiddle.className = "lblDirectionsLocations directionsLocationImg";
      divContainer.appendChild(labelMiddle);

      divInput = document.createElement("div");
      divInput.className = "inputDirectionsLocationsContainer";

      var inputLocationStep = document.createElement("input");
      inputLocationStep.id = "directionsLocation_step_" + i;
      inputLocationStep.className = "inputDirectionsLocations";
      inputLocationStep.type = "text";
      inputLocationStep.placeholder = "Par où passez-vous ?";
      inputLocationStep.name = "step" + i;
      // le geocodage enregistre les coordonnées dans la tag data-coordinates :
      //   data-coordinates = "[2.24,48.80]"
      inputLocationStep.dataset.coordinates = "";
      inputLocationStep.addEventListener("click", function (e) {
        // ouverture du menu de recherche
        self.onOpenSearchLocation(e);
      });
      divInput.appendChild(inputLocationStep);

      labelCross = document.createElement("label");
      labelCross.className = "handle-draggable-layer";
      labelCross.addEventListener("click", () => { });
      divInput.appendChild(labelCross);

      divContainer.appendChild(divInput);
      var divAddStep = document.createElement("div");
      divAddStep.classList.add("divDirectionsLocationsAddStep");

      var labelRemoveMiddle = document.createElement("label");
      labelRemoveMiddle.id = "directionsLocationRemoveImg_step_" + i;
      labelRemoveMiddle.className = "lblDirectionsLocations lblDirectionsLocationsRemoveImg";
      labelRemoveMiddle.addEventListener("click", function (e) {
        e.target.parentNode.classList.add("hidden");
        var index = e.target.id.substring(e.target.id.lastIndexOf("_") + 1);
        var div = document.getElementById("directionsLocation_step_" + index);
        if (div) {
          div.value = "";
          div.dataset.coordinates = "";
        }
        divAddStep.classList.remove("hidden");
      });
      divContainer.appendChild(labelRemoveMiddle);

      divDefault.appendChild(divContainer);
    }

    divContainer = document.createElement("div");
    divContainer.className = "divDirectionsLocationsItem draggable-layer end";
    divContainer.id = "divDirectionsLocationsItem_end";

    var labelArrival = document.createElement("label");
    labelArrival.id = "directionsLocationImg_last";
    labelArrival.className = "lblDirectionsLocations directionsLocationImg";
    divContainer.appendChild(labelArrival);

    divInput = document.createElement("div");
    divInput.className = "inputDirectionsLocationsContainer";

    var inputLocationArrival = document.createElement("input");
    inputLocationArrival.id = "directionsLocation_end";
    inputLocationArrival.className = "inputDirectionsLocations";
    inputLocationArrival.type = "text";
    inputLocationArrival.placeholder = "Où allez-vous ?";
    inputLocationArrival.name = "end";
    // le geocodage enregistre les coordonnées dans la tag data-coordinates :
    //   data-coordinates = "[2.24,48.80]"
    inputLocationArrival.dataset.coordinates = "";
    inputLocationArrival.addEventListener("click", function (e) {
      // ouverture du menu de recherche
      self.onOpenSearchLocation(e);
    });
    divInput.appendChild(inputLocationArrival);
    // Stockage du input d'arrivée pour interaction avec modules externes
    self.dom.inputArrival = inputLocationArrival;

    labelCross = document.createElement("label");
    labelCross.className = "handle-draggable-layer";
    // Event listener vide pour gestion du touch
    labelCross.addEventListener("click", () => { });
    divInput.appendChild(labelCross);
    divContainer.appendChild(divInput);

    divDefault.appendChild(divContainer);

    // INFO : fonctionnalité desactivée sur la nouvelle maquette ?
    // var labelReverse = document.createElement("label");
    // labelReverse.id = "directionsLocationImg_reverse";
    // labelReverse.className = "lblDirectionsLocations";
    // labelReverse.addEventListener("click", function (e) {
    //     // TODO
    //     console.log(e);
    // });
    // divDefault.appendChild(labelReverse);

    div.appendChild(divDefault);

    var labelAddStep = document.createElement("label");
    labelAddStep.id = "directionsLocationImg_step";
    labelAddStep.className = "lblDirectionsLocations";
    labelAddStep.title = "Ajouter une étape";
    labelAddStep.textContent = "Ajouter une étape";
    labelAddStep.addEventListener("click", function () {
      labelAddStep.style.backgroundColor = "#E7E7E7";
      setTimeout(() => { labelAddStep.style.removeProperty("background-color"); }, 150);
      var locations = document.querySelectorAll(".divDirectionsLocationsItem");
      for (let index = 0; index < locations.length; index++) {
        const element = locations[index];
        if (element.classList.contains("hidden")) {
          element.classList.remove("hidden");
          break;
        }
      }
      let allShown = true;
      for (let index = 0; index < locations.length; index++) {
        const element = locations[index];
        if (element.classList.contains("hidden")) {
          allShown = false;
          break;
        }
      }
      if (allShown) {
        divAddStep.classList.add("hidden");
      }
    });
    divAddStep.appendChild(labelAddStep);

    div.appendChild(divAddStep);

    return div;
  }
};

export default DirectionsDOM;
