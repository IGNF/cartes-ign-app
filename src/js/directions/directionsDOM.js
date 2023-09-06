let DirectionsDOM = {

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
     * ...
     * @returns {DOMElement}
     * @public
     */
    getContainer () {
        // ajout du formulaire
        var container = this.__addComputeFormDOMElement();
        // ajout du mode de transport
        container.appendChild(this.__addContainerTransportDOMElement());
        // ajout des locations
        container.appendChild(this.__addContainerLocationsDOMElement());
        // ajout du mode de calcul
        container.appendChild(this.__addContainerComputationDOMElement());
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
        var form = document.createElement("form");
        form.id = "directionsForm";
        form.setAttribute("onkeypress", "return event.keyCode != 13;"); // FIXME hack pour desactiver l'execution via 'enter' au clavier !

        form.addEventListener("submit", function (e) {
            logger.log(e);
            e.preventDefault();
            // TODO
            // recuperer les valeurs des composants HTML:
            // - transport
            // - computation
            // - locations

            // mise en place d'une patience ?
            // https://uiverse.io/barisdogansutcu/light-rat-32
            
            // passer les valeurs au service
            this.compute({
                transport : null,
                computation : null,
                locations : null
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
    __addContainerTransportDOMElement () {
        // cf. https://uiverse.io/Pradeepsaranbishnoi/heavy-dragonfly-92
        var div = document.createElement("div");
        div.className = "divDirectionsTransport";

        var inputPedestrian = document.createElement("input");
        inputPedestrian.id = "directionsTransportPieton";
        inputPedestrian.type = "radio";
        inputPedestrian.name = "Transport";
        inputPedestrian.value = "Pieton";
        inputPedestrian.checked = true;
        inputPedestrian.addEventListener("change", function (e) {
            // TODO
        });
        div.appendChild(inputPedestrian);

        var labelPedestrian = document.createElement("label");
        labelPedestrian.className = "lblDirectionsTransport";
        labelPedestrian.htmlFor = "directionsTransportPieton";
        labelPedestrian.title = "A pied";
        labelPedestrian.textContent = "A pied";
        div.appendChild(labelPedestrian);

        var inputCar = document.createElement("input");
        inputCar.id = "directionsTransportVoiture";
        inputCar.type = "radio";
        inputCar.name = "Transport";
        inputCar.value = "Voiture";
        inputCar.addEventListener("change", function (e) {
            // TODO
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
    __addContainerComputationDOMElement () {
        // https://uiverse.io/Yaya12085/rude-mouse-79
        var div = document.createElement("div");
        div.className = "divDirectionsComputation";
        
        var inputFastest = document.createElement("input");
        inputFastest.id = "directionsComputationFastest";
        inputFastest.type = "radio";
        inputFastest.name = "Computation";
        inputFastest.value = "Fastest";
        inputFastest.checked = true;
        inputFastest.addEventListener("change", function (e) {
            // TODO
        });
        div.appendChild(inputFastest);

        var labelFastest = document.createElement("label");
        labelFastest.className = "lblDirectionsComputation";
        labelFastest.htmlFor = "directionsComputationFastest";
        labelFastest.title = "Fastest";
        labelFastest.textContent = "Plus rapide";
        div.appendChild(labelFastest);

        var inputShortest = document.createElement("input");
        inputShortest.id = "directionsComputationShortest";
        inputShortest.type = "radio";
        inputShortest.name = "Computation";
        inputShortest.value = "Shortest";
        inputShortest.addEventListener("change", function (e) {
            // TODO
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
    __addContainerLocationsDOMElement () {
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
        inputLocationDeparture.id = "directionsLocation_first";
        inputLocationDeparture.className = "inputDirectionsLocations";
        inputLocationDeparture.type = "text";
        inputLocationDeparture.placeholder = "Choisir un point de départ...";
        inputLocationDeparture.name = "departure";
        inputLocationDeparture.addEventListener("change", function (e) {
            // TODO
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
        inputLocationArrival.id = "directionsLocation_last";
        inputLocationArrival.className = "inputDirectionsLocations";
        inputLocationArrival.type = "text";
        inputLocationArrival.placeholder = "Choisir une destination...";
        inputLocationArrival.name = "arrival";
        inputLocationArrival.addEventListener("change", function (e) {
            // TODO
        });
        divDefault.appendChild(inputLocationArrival);

        var labelReverse = document.createElement("label");
        labelReverse.id = "directionsLocationImg_reverse";
        labelReverse.className = "lblDirectionsLocations";
        divDefault.appendChild(labelReverse);

        div.appendChild(divDefault);

        var divStep = document.createElement("div");
        divStep.className = "divDirectionsLocationsStep";

        var labelAddStep = document.createElement("label");
        labelAddStep.id = "directionsLocationImg_step";
        labelAddStep.className = "lblDirectionsLocations";
        labelAddStep.title = "Ajouter une étape";
        labelAddStep.textContent = "Ajouter une étape";
        divStep.appendChild(labelAddStep);

        div.appendChild(divStep);

        return div;
    }
};

export default DirectionsDOM;