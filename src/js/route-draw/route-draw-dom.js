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

        var distanceKm = Math.round(10 * distance / 1000) / 10;
        if (distanceKm < 1) {
            d = parseInt(distance, 10) + " m"; // arrondi !
        } else {
            if (distanceKm > 100) {
                distanceKm = Math.round(distanceKm);
            }
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
 * DOM du contrôle du dessin d'itineraire
 * @mixin RouteDrawDOM
 */
let RouteDrawDOM = {

    dom : {
        container: null,
        summary: null,
        details: null,
        detailsList: null,
    },

    /**
     * obtenir le container principal
     * @param {*} data
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

        return div;
    },

    /**
     * ajoute le container le résumé du parcours
     * @param {*} transport
     * @param {*} computation
     * @returns {DOMElement}
     * @private
     */
    __addResultsSummaryContainerDOMElement (transport) {
        var div = document.createElement("div");
        div.id = "routeDrawSummary";
        div.className = "";

        var line1 = document.createElement("div");
        var line2 = document.createElement("div");

        var labelTransport = document.createElement("label");
        labelTransport.id = "routeDrawSummaryTransport" + transport;
        labelTransport.className = "lblRouteDrawSummaryTransport";
        line1.appendChild(labelTransport);

        var labelDuration = document.createElement("label");
        labelDuration.id = "routeDrawSummaryDuration";
        labelDuration.className = "lblRouteDrawSummaryDuration";
        labelDuration.textContent = utils.convertSecondsToTime(0);
        line1.appendChild(labelDuration);

        var labelDistance = document.createElement("label");
        labelDistance.id = "routeDrawSummaryDistance";
        labelDistance.className = "lblRouteDrawSummaryDistance";
        labelDistance.textContent = utils.convertDistance(0);
        line1.appendChild(labelDistance);

        var labelDPlus = document.createElement("label");
        labelDPlus.id = "routeDrawSummaryDPlus";
        labelDPlus.className = "lblRouteDrawSummaryDPlus";
        labelDPlus.textContent = `0 m`;
        line2.appendChild(labelDPlus);

        var labelDMinus = document.createElement("label");
        labelDMinus.id = "routeDrawSummaryDMinus";
        labelDMinus.className = "lblRouteDrawSummaryDMinus";
        labelDMinus.textContent = `- 0 m`;
        line2.appendChild(labelDMinus);

        div.appendChild(line1);
        div.appendChild(line2);

        return div;
    },

    /**
     * ajoute le container sur les détails du parcours
     * @param {*} instructions - routes[0].legs[]
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
     * ajoute une étape de parcours
     * @param {*} step - routes[0].legs[].steps[]
     * @returns {DOMElement}
     * @private
     */
    __addResultsDetailsInstructionDOMElement (step, type, opts) {

    },

    /**
     * Met à jour les infos dans le DOM
     * @param {*} step - routes[0].legs[].steps[]
     * @returns {DOMElement}
     * @private
     */
    __updateRouteInfo (data) {
        var labelDuration = this.dom.summary.querySelector("#routeDrawSummaryDuration");
        labelDuration.textContent = utils.convertSecondsToTime(data.duration);

        var labelDistance = this.dom.summary.querySelector("#routeDrawSummaryDistance");
        labelDistance.textContent = utils.convertDistance(data.distance);

        var labelDPlus = this.dom.summary.querySelector("#routeDrawSummaryDPlus");
        labelDPlus.textContent = `${data.dplus} m`;

        var labelDMinus = this.dom.summary.querySelector("#routeDrawSummaryDMinus");
        labelDMinus.textContent = `- ${data.dminus} m`;

        // Ajout du détail du parcours
        let totalSeconds = 0;
        this.dom.detailsList.innerHTML = "";
        if (data.steps.length > 0) {
            for (let i = 0; i < data.points.length; i++) {
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
                    const step = data.steps[i - 1];

                    // Ajout de la div du step
                    var stepDiv = document.createElement("div");
                    stepDiv.classList.add("routeDrawStepDiv");
                    stepDiv.innerText = utils.convertDistance(step.properties.distance) +
                        " / " +
                        utils.convertSecondsToTime(step.properties.duration);
                    this.dom.detailsList.appendChild(stepDiv);

                    totalSeconds += step.properties.duration;

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

};

export default RouteDrawDOM;
