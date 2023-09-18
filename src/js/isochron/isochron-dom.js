/**
 * DOM du contrôle du calcul d'isochrone
 * @mixin IsochronDOM
 */
let IsochronDOM = {

    /** 
     * DOM utile pour la classe métier
     */
    dom : {
        form : null,
        location : null,
        modeDistance : null,
        distanceValue : null,
        modeDuration : null,
        durationValueHours : null,
        durationValueMinutes : null,
        transportCar : null,
        transportPedestrian : null
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
            return doc.body.firstChild;
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
        // contexte
        var self = this;

        // container
        var strContainer = `
        <div id="isochronContainer">
            <form id="isochronForm" onkeypress="return event.keyCode != 13;">
                <!-- titre -->
                <p class="pIsochronTitle">Lancer une recherche à proximité</p> 
                <!-- location -->
                <input id="isochronLocation" class="inputIsochronLocation" type="text" placeholder="Saisir une adresse..." name="location" data-coordinates="">
                <!-- type de calcul : distance / temps -->
                <div class="section">
                    <div class="divIsochronMode">
                        <input id="isochronModeDuration" type="radio" name="Mode" value="Temps" checked="true">
                        <label id="isochronModeDurationLabel" class="lblIsochronMode" for="isochronModeDuration" title="Durée">Durée</label>
                        <input id="isochronModeDistance" type="radio" name="Mode" value="Distance">
                        <label id="isochronModeDistanceLabel" class="lblIsochronMode" for="isochronModeDistance" title="Distance">Distance</label>
                        <span class="sliderIsochron"></span>
                    </div>
                    <div id="isochronModeValueDuration">
                        <p class="pIsochronTitle">Definissez votre temps de trajet</p>
                        <div id="isochronValueDuration" class="divIsochronValue">
                            <input id="isochronValueDurationInputHours" min="0" step="1" type="number">
                            <label class="unit">h</label>
                            <input id="isochronValueDurationInputMinutes" min="0" max="59" step="1" type="number">
                            <label class="unit">min</label>
                        </div>
                    </div>
                    <div id="isochronModeValueDistance" class="isochronValueHidden">
                        <p class="pIsochronTitle">Definissez la distance</p>
                        <div id="isochronValueDistance" class="divIsochronValue">
                            <input id="isochronValueDistanceInput" min="0" step="any" type="number">
                            <label class="unit">km</label>
                        </div>
                    </div>
                </div>
                <!-- transport -->
                <div class="section">
                    <p class="pIsochronTitle">Comment vous déplacez-vous ?</label>
                    <div class="divIsochronTransport">
                        <input id="isochronTransportPieton" type="radio" name="Transport" value="Pieton" checked="true">
                        <label class="lblIsochronTransport" for="isochronTransportPieton" title="A pied">A pied</label>
                        <input id="isochronTransportVoiture" type="radio" name="Transport" value="Voiture">
                        <label class="lblIsochronTransport" for="isochronTransportVoiture" title="Véhicule">Véhicule</label>
                        <span class="sliderIsochron"></span>
                    </div>
                </div>
                <!-- TODO filtres POI -->
                <!-- TODO option d'affichage -->
                <!-- bouton de calcul -->
                <input id="isochronCompute" class="btnIsochronCompute" type="submit" value="Calculer">
            </form>
        </div>
        `;

        // transformation du container : String -> DOM
        var container = this.stringToHTML(strContainer.trim());

        // ajout du shadow DOM
        const shadow = container.attachShadow({ mode: "open" });
        shadow.innerHTML = strContainer.trim();

        // defini les objets du dom utiles
        this.dom.form = shadow.getElementById("isochronForm");
        this.dom.location = shadow.getElementById("isochronLocation");
        this.dom.modeDistance = shadow.getElementById("isochronModeDistance");
        this.dom.distanceValue = shadow.getElementById("isochronValueDistanceInput");
        this.dom.modeDuration = shadow.getElementById("isochronModeDuration");
        this.dom.durationValueHours = shadow.getElementById("isochronValueDurationInputHours");
        this.dom.durationValueMinutes = shadow.getElementById("isochronValueDurationInputMinutes");
        this.dom.transportCar = shadow.getElementById("isochronTransportVoiture");
        this.dom.transportPedestrian = shadow.getElementById("isochronTransportPieton");

        // ajout des listeners principaux :
        // - le calcul
        // - l'ouverture du menu de recherche
        // - l'affichage du mode
        this.dom.form.addEventListener("submit", (e)  => {
            e.preventDefault();
            // recuperer les valeurs des composants HTML:
            // - transport
            // - mode
            // - location

            var transport = null;
            // voiture ?
            if (self.dom.transportCar && self.dom.transportCar.checked) {
                transport = self.dom.transportCar.value;
            }
            // pieton ?
            if (self.dom.transportPedestrian && self.dom.transportPedestrian.checked) {
                transport = self.dom.transportPedestrian.value;
            }

            var mode = {
                type : null, // Temps ou Distance
                value : null // km ou secondes
            };
            // temps ?
            if (self.dom.modeDuration && self.dom.modeDuration.checked) {
                mode.type = self.dom.modeDuration.value;
                var hours = parseInt(self.dom.durationValueHours.value, 10);
                if (isNaN && isNaN(hours)) {
                    hours = 0;
                }
                var minutes = parseInt(self.dom.durationValueMinutes.value, 10);
                if (isNaN && isNaN(minutes)) {
                    minutes = 0;
                }
                // durée exprimée en secondes
                mode.value = hours * 3600 + minutes * 60;
            }
            // distance ?
            if (self.dom.modeDistance && self.dom.modeDistance.checked) {
                mode.type = self.dom.modeDistance.value;
                // distance exprimée en kilomètres
                mode.value = parseFloat(self.dom.distanceValue.value);
            }
            // location
            var value = self.dom.location.dataset.coordinates;

            // passer les valeurs au service
            self.compute({
                transport : transport,
                mode : mode,
                location : value
            });

            return false;
        });
        this.dom.location.addEventListener("click", (e) => {
            console.log(e);
            // ouverture du menu de recherche
            self.onOpenSearchLocation(e);
        });
        this.dom.modeDistance.addEventListener("click", (e)  => {
            console.log(e);
            document.getElementById("isochronModeValueDistance").className = "";
            document.getElementById("isochronModeValueDuration").className = "isochronValueHidden";
        });
        this.dom.modeDuration.addEventListener("click", (e)  => {
            console.log(e);
            document.getElementById("isochronModeValueDuration").className = "";
            document.getElementById("isochronModeValueDistance").className = "isochronValueHidden";
        });

        return shadow;
    }
};

export default IsochronDOM;