/**
 * DOM du contrôle du calcul d'isochrone
 * @mixin IsochronDOM
 */
let IsochronDOM = {

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
        var container = `
        <div id="" class="">
            <!-- titre -->
            <!-- location -->
            <!-- type de calcul : distance / temps -->
            <!-- transport -->
            <!-- filtres POI -->
            <!-- option d'affichage -->
            <!-- bouton de calcul -->
        </div>
        `;
        return this.stringToHTML(container).firstChild;
    },
};

export default IsochronDOM;