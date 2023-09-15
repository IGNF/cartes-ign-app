/**
 * DOM du contrôle du calcul d'isochrone
 * @mixin IsochronDOM
 */
let IsochronDOM = {

    /** 
     * DOM utile pour la classe métier
     */
    dom : {
        container : null
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
                        <input id="isochronModeTemps" type="radio" name="Mode" value="Temps" checked="true">
                        <label class="lblIsochronMode" for="isochronModeTemps" title="Durée">Durée</label>
                        <input id="isochronModeDistance" type="radio" name="Mode" value="Distance">
                        <label class="lblIsochronMode" for="isochronModeDistance" title="Distance">Distance</label>
                        <span class="sliderIsochron"></span>
                    </div>
                    <div class="divIsochronModeValueTemps">
                        <p class="pIsochronTitle">Definissez votre temps de trajet</p>
                        <div id="isochronValueTemps" class="divIsochronValue">
                            <input id="isochronValueTempsInput1" min="0" step="1" type="number">
                            <label class="unit">h</label>
                            <input id="isochronValueTempsInput2" min="0" max="59" step="1" type="number">
                            <label class="unit">min</label>
                        </div>
                    </div>
                    <div class="divIsochronModeValueDistance isochronValueHidden">
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

        // ajout des listeners principaux :
        // - le calcul
        // - l'ouverture du menu de recherche
        shadow.getElementById("isochronForm").addEventListener("submit", (e)  => {
            e.preventDefault();
            // TODO
            // recuperer les valeurs des composants HTML:
            // - transport
            // - type
            // - location

            // passer les valeurs au service
            self.compute({
                transport : null,
                type : null,
                location : null
            });

            return false;
        });
        shadow.getElementById("isochronLocation").addEventListener("click", (e) => {
            console.log(e);
            // ouverture du menu de recherche
            self.onOpenSearchLocation(e);
        });

        return shadow;
    },
};

export default IsochronDOM;