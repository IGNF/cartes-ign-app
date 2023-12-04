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
        container.appendChild(this.__addResultsSummaryContainerDOMElement(data.transport));
        // ajout des détails (profil alti et détails du parcours)
        container.appendChild(this.__addResultsListDetailsContainerDOMElement(data.steps));

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
     * @param {*} distance
     * @param {*} duration
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
    __addResultsListDetailsContainerDOMElement (data) {

        var divList = document.createElement("div");
        divList.id = "routeDrawListDetails";
        divList.className = "";

        var profileHeader = document.createElement("p");
        profileHeader.className = "elevationLineHeader";
        profileHeader.textContent = "Profil altimétrique";
        divList.appendChild(profileHeader);

        var canvasProfile = document.createElement("canvas");
        canvasProfile.id = "routedraw-elevationline";
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

    },

    /**
     * Met à jour les infos dans le DOM
     * @param {*} step - routes[0].legs[].steps[]
     * @returns {DOMElement}
     * @private
     */
    __updateRouteInfo (data) {
        var labelDuration = document.getElementById("routeDrawSummaryDuration");
        labelDuration.textContent = utils.convertSecondsToTime(data.duration);

        var labelDistance = document.getElementById("routeDrawSummaryDistance");
        labelDistance.textContent = utils.convertDistance(data.distance);

        var labelDPlus = document.getElementById("routeDrawSummaryDPlus");
        labelDPlus.textContent = `${data.dplus} m`;

        var labelDMinus = document.getElementById("routeDrawSummaryDMinus");
        labelDMinus.textContent = `- ${data.dminus} m`;
    },

};

export default RouteDrawDOM;
