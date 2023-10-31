/**
 * Fonctions utilitaires
 */
let utils = {
    /**
     * convert distance in meters or kilometers
     * @param {Number} distance - distance in meters
     * @returns {String} distance in km
     * @private
     */
    convertDistance (distance) {
        var d = "";

        var distanceKm = parseInt(distance / 1000, 10);
        if (!distanceKm) {
            d = parseInt(distance, 10) + " m"; // arrondi !
        } else {
            d = distanceKm + " km";
        }

        return d;
    },

    /**
     * convert seconds to time : HH:MM:SS
     * @param {Number} duration - duration in seconds
     * @returns {String} time in hours/minutes/seconds
     * @private
     */
    convertSecondsToTime (duration) {
        var time = "";

        duration = Math.round(duration);
        var hours = Math.floor(duration / (60 * 60));

        var divisor4minutes = duration % (60 * 60);
        var minutes = Math.floor(divisor4minutes / 60);
        // if (!minutes) {
        //     minutes = "00";
        // }

        // var divisor4seconds = divisor4minutes % 60;
        // var seconds = Math.ceil(divisor4seconds);
        // if (!seconds) {
        //     seconds = "00";
        // }

        if (hours) {
            time = hours + "h ";
        }
        time += minutes + " min";
        return time;
    }

};

/**
 * DOM du contrôle du calcul d'itineraire - resultats du calcul
 * @mixin DirectionsResultsDOM
 * @todo menu des détails du calcul
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
        // ajout du bouton de retour
        container.appendChild(this.__addResultsButtonReturnDOMElement());
        // ajout du résumé
        container.appendChild(this.__addResultsSummaryContainerDOMElement(
            data.distance,
            data.duration,
            data.transport,
            data.computation
        ));
        // ajout du bouton détails
        container.appendChild(this.__addResultsDetailsContainerDOMElement());
        // ajout des détails
        container.appendChild(this.__addResultsListDetailsContainerDOMElement(data.instructions));
        
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
     * ajout du bouton de retour
     * @returns {DOMElement}
     * @private
     */
    __addResultsButtonReturnDOMElement () {
        var div = this.dom.btnReturnBack = document.createElement("div");
        div.id = "directionsReturnBack";
        div.className = "btnDirectionsReturnBack";

        var self = this;
        div.addEventListener("click", function (e) {
            self.hide();
        });

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

        var labelDuration = document.createElement("label");
        labelDuration.id = "directionsSummaryDuration";
        labelDuration.className = "lblDirectionsSummaryDuration";
        labelDuration.textContent = utils.convertSecondsToTime(duration);
        div.appendChild(labelDuration);

        var labelDistance = document.createElement("label");
        labelDistance.id = "directionsSummaryDistance";
        labelDistance.className = "lblDirectionsSummaryDistance";
        labelDistance.textContent = utils.convertDistance(distance);
        div.appendChild(labelDistance);

        var labelTransport = document.createElement("label");
        labelTransport.id = "directionsSummaryTransport" + transport;
        labelTransport.className = "lblDirectionsSummaryTransport";
        div.appendChild(labelTransport);

        var labelComputation = document.createElement("label");
        labelComputation.id = "directionsSummaryComputation";
        labelComputation.className = "lblDirectionsSummaryComputation";
        labelComputation.textContent = computation;
        div.appendChild(labelComputation);

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
        labelShow.addEventListener("click", function (e) {
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
    __addResultsListDetailsContainerDOMElement (instructions) {
        
        var divList = document.createElement("div");
        divList.id = "directionsListDetails";
        divList.className = "";

        // instructions = routes[0].legs[]
        for (let index = 0; index < instructions.length; index++) {
            // instruction = steps[]
            const instruction = instructions[index];
            instruction.steps.forEach((step) => {
                // step = {
                //     distance
                //     driving_side
                //     duration
                //     maneuver: {
                //         modifier
                //         type
                //     }
                // }
                var el = this.__addResultsDetailsInstructionDOMElement(step);
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
    __addResultsDetailsInstructionDOMElement (step) {
        // step = {
        //     distance
        //     driving_side
        //     duration
        //     maneuver: {
        //         modifier
        //         type
        //     }
        // }
        var div = document.createElement("div");
        div.className = "";
        div.innerHTML = "TODO";
        return div;
    }

};

export default DirectionsResultsDOM;