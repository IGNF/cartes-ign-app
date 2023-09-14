import MyCSS from "!!raw-loader!../../css/isochron.css";

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

        // container avec la CSS inline
        var strContainer = `
        <style>${MyCSS}</style>
        <div id="isochronContainer">
            <form id="isochronForm" onkeypress="return event.keyCode != 13;">
                <!-- titre -->
                <p class="">Lancer une recherche à proximité</p> 
                <!-- location -->
                <input id="isochronLocation" class="inputIsochronLocation" type="text" placeholder="Saisir une adresse..." name="location" data-coordinates="">
                <!-- type de calcul : distance / temps -->
                <div class="divIsochronMode">
                    <!-- TODO -->
                </div>
                <!-- transport -->
                <div class="divIsochronTransport">
                    <input id="isochronTransportPieton" type="radio" name="Transport" value="Pieton">
                    <label class="lblIsochronTransport" for="isochronTransportPieton" title="A pied">A pied</label>
                    <input id="isochronTransportVoiture" type="radio" name="Transport" value="Voiture">
                    <label class="lblIsochronTransport" for="isochronTransportVoiture" title="Véhicule">Véhicule</label>
                    <span class="glider"></span>
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

        // FIXME 
        // comment ajouter les CSS sur le shadow DOM ?
        //  var css = new CSSStyleSheet();
        //  css.replaceSync(MyCSS);
        //  shadow.adoptedStyleSheets.push(css);

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

        return container;
    },
};

export default IsochronDOM;