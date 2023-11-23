import { SymbolInstanceStruct } from 'maplibre-gl';
import Instruction from './directions-instructions';

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

        // FIXME comment fusionner les points intermediaires ?
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
            instruction.steps.forEach((step, index, array) => {
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

        var canvasProfile = document.createElement("canvas");
        canvasProfile.id = "directions-elevationline";
        canvasProfile.className = "elevationLineCanvas";
        divList.appendChild(canvasProfile);

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

        var divDesc = document.createElement("div");
        divDesc.className = "divDirectionsDetailsItemDesc";
        divDesc.textContent = instruction.getDescription();
        divContainer.appendChild(divDesc);

        if (type && type === "first") {
            var divDuration = document.createElement("div");
            divDuration.className = "divDirectionsDetailsItemDuration";
            divDuration.textContent = "0 min";
            divContainer.appendChild(divDuration);
        }

        if (type && type === "last") {
            var divDuration = document.createElement("div");
            divDuration.className = "divDirectionsDetailsItemDuration";
            divDuration.textContent = utils.convertSecondsToTime(opts.duration);
            divContainer.appendChild(divDuration);
        }

        if (instruction.isStep()) {
            var divDistance = document.createElement("div");
            divDistance.className = "divDirectionsDetailsItemDistance";
            divDistance.textContent = utils.convertDistance(step.distance);
            divContainer.appendChild(divDistance);
        }

        return divContainer;
    }

};

export default DirectionsResultsDOM;
