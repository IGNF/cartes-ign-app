/**
 * DOM du contrôle du calcul d'itineraire
 * @mixin DirectionsDOM
 * @todo ajout des étapes
 * @todo suppression des étapes
 * @todo inversion des locations
 */
let DirectionsDOM = {

    dom : {
        container : null,
        inputCar : null,
        inputPedestrian : null,
        inputFastest : null,
        inputShortest : null
    },

    /**
     * transforme un texte html en dom
     * @param {String} str 
     * @returns {DOMElement}
     * @public
     */
    stringToHTML (str) {

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
            return doc.body;
        }
    
        // Otherwise, fallback to old-school method
        var dom = document.createElement('div');
        dom.innerHTML = str;
        return dom;
    
    },

    /**
     * obtenir le container principal
     * @returns {DOMElement}
     * @public
     */
    getContainer () {
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
    __addComputeFormDOMElement () {
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
            locations.push(start);
            locations.push(end);
            for (let i = 1; i < points.length - 1; i++) {
                locations.push(points[i].dataset.coordinates);
            }

            // mise en place d'une patience ?
            // https://uiverse.io/barisdogansutcu/light-rat-32
            
            // passer les valeurs au service
            self.compute({
                transport : transport,
                computation : computation,
                locations : locations
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
    __addComputeButtonDOMElement () {
        var input = document.createElement("input");
        input.id = "directionsCompute";
        input.className = "btnDirectionsCompute";
        input.type = "submit";
        input.value = "Calculer";

        return input;
    },

    /** 
     * ajoute le container sur le mode de transport
     * @returns {DOMElement}
     * @private
     */
    __addComputeContainerTransportDOMElement () {
        // cf. https://uiverse.io/Pradeepsaranbishnoi/heavy-dragonfly-92
        var div = document.createElement("div");
        div.className = "divDirectionsTransport";

        var inputPedestrian = this.dom.inputPedestrian = document.createElement("input");
        inputPedestrian.id = "directionsTransportPieton";
        inputPedestrian.type = "radio";
        inputPedestrian.name = "Transport";
        inputPedestrian.value = "Pieton";
        inputPedestrian.checked = true;
        inputPedestrian.addEventListener("change", function (e) {
            // TODO
            console.log(e);
        });
        div.appendChild(inputPedestrian);

        var labelPedestrian = document.createElement("label");
        labelPedestrian.className = "lblDirectionsTransport";
        labelPedestrian.htmlFor = "directionsTransportPieton";
        labelPedestrian.title = "A pied";
        labelPedestrian.textContent = "A pied";
        div.appendChild(labelPedestrian);

        var inputCar = this.dom.inputCar = document.createElement("input");
        inputCar.id = "directionsTransportVoiture";
        inputCar.type = "radio";
        inputCar.name = "Transport";
        inputCar.value = "Voiture";
        inputCar.addEventListener("change", function (e) {
            // TODO
            console.log(e);
        });
        div.appendChild(inputCar);

        var labelCar = document.createElement("label");
        labelCar.className = "lblDirectionsTransport";
        labelCar.htmlFor = "directionsTransportVoiture";
        labelCar.title = "Véhicule";
        labelCar.textContent = "Véhicule";
        div.appendChild(labelCar);

        var glider = document.createElement("span");
        glider.className = "glider";
        div.appendChild(glider);

        return div;
    },

    /** 
     * ajoute le container sur le mode de calcul
     * @returns {DOMElement}
     * @private
     */
    __addComputeContainerComputationDOMElement () {
        // https://uiverse.io/Yaya12085/rude-mouse-79
        var div = document.createElement("div");
        div.className = "divDirectionsComputation";
        
        var inputFastest = this.dom.inputFastest = document.createElement("input");
        inputFastest.id = "directionsComputationFastest";
        inputFastest.type = "radio";
        inputFastest.name = "Computation";
        inputFastest.value = "Fastest";
        inputFastest.checked = true;
        inputFastest.addEventListener("change", function (e) {
            // TODO
            console.log(e);
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
            // TODO
            console.log(e);
        });
        div.appendChild(inputShortest);

        var labelShortest = document.createElement("label");
        labelShortest.className = "lblDirectionsComputation";
        labelShortest.htmlFor = "directionsComputationShortest";
        labelShortest.title = "Shortest";
        labelShortest.textContent = "Plus court";
        div.appendChild(labelShortest);

        return div;
    },

    /** 
     * ajoute le container sur la saisie de locations
     * @returns {DOMElement}
     * @private
     */
    __addComputeContainerLocationsDOMElement () {
        // contexte de la classse
        var self = this;

        // https://uiverse.io/satyamchaudharydev/plastic-bobcat-37
        var div = document.createElement("div");
        div.className = "divDirectionsLocations";

        var divDefault = document.createElement("div");
        divDefault.className = "divDirectionsLocationsDefault";

        var labelDeparture = document.createElement("label");
        labelDeparture.id = "directionsLocationImg_first";
        labelDeparture.className = "lblDirectionsLocations";
        divDefault.appendChild(labelDeparture);

        var inputLocationDeparture = document.createElement("input");
        inputLocationDeparture.id = "directionsLocation_start";
        inputLocationDeparture.className = "inputDirectionsLocations";
        inputLocationDeparture.type = "text";
        inputLocationDeparture.placeholder = "Choisir un point de départ...";
        inputLocationDeparture.name = "start";
        // le geocodage enregistre les coordonnées dans la tag data-coordinates :
        //   data-coordinates = "[2.24,48.80]"
        inputLocationDeparture.dataset.coordinates = "";
        inputLocationDeparture.addEventListener("click", function (e) {
            // ouverture du menu de recherche
            self.onOpenSearchLocation(e);
        });
        divDefault.appendChild(inputLocationDeparture);

        var labelMiddle = document.createElement("label");
        labelMiddle.id = "directionsLocationsImg_middle";
        labelMiddle.className = "lblDirectionsLocations";
        divDefault.appendChild(labelMiddle);

        var labelArrival = document.createElement("label");
        labelArrival.id = "directionsLocationImg_last";
        labelArrival.className = "lblDirectionsLocations";
        divDefault.appendChild(labelArrival);

        var inputLocationArrival  = document.createElement("input");
        inputLocationArrival.id = "directionsLocation_end";
        inputLocationArrival.className = "inputDirectionsLocations";
        inputLocationArrival.type = "text";
        inputLocationArrival.placeholder = "Choisir une destination...";
        inputLocationArrival.name = "end";
        // le geocodage enregistre les coordonnées dans la tag data-coordinates :
        //   data-coordinates = "[2.24,48.80]"
        inputLocationArrival.dataset.coordinates = "";
        inputLocationArrival.addEventListener("click", function (e) {
            // ouverture du menu de recherche
            self.onOpenSearchLocation(e);
        });
        divDefault.appendChild(inputLocationArrival);

        var labelReverse = document.createElement("label");
        labelReverse.id = "directionsLocationImg_reverse";
        labelReverse.className = "lblDirectionsLocations";
        labelReverse.addEventListener("click", function (e) {
            // TODO
            console.log(e);
        });
        divDefault.appendChild(labelReverse);

        div.appendChild(divDefault);

        var divStep = document.createElement("div");
        divStep.className = "divDirectionsLocationsStep";

        var labelAddStep = document.createElement("label");
        labelAddStep.id = "directionsLocationImg_step";
        labelAddStep.className = "lblDirectionsLocations";
        labelAddStep.title = "Ajouter une étape";
        labelAddStep.textContent = "Ajouter une étape";
        labelAddStep.addEventListener("click", function (e) {
            // TODO
            console.log(e);
        });
        divStep.appendChild(labelAddStep);

        div.appendChild(divStep);

        return div;
    }
};

export default DirectionsDOM;