import DOM from "./dom";

var className = "recentresult";

const addEntry = (value) => {
    var el = document.createElement("p");
    el.className = className;
    el.setAttribute("fulltext", value);
    var splitedText = value.split(",");
    var city = "";
    if (splitedText.length > 1) {
      city = splitedText[1].trim();
    }
    el.innerHTML = `${splitedText[0]}<br/>
    <em class='autocompcity'>${city}</em>`;
    try {
      DOM.$resultsRechRecent.insertBefore(el, DOM.$resultsRechRecent.firstElementChild.nextSibling);
    } catch(error) {
      console.error(error);
    }
};

const addEntries = (values) => {
    for (let index = 0; index < values.length; index++) {
        addEntry(values[index]);
    }
};

const removeEntry = (value) => {
    var entries = document.getElementsByClassName(className);
    for (let index = 0; index < entries.length; index++) {
        const element = entries[index];
        if (element.getAttribute("fulltext") === value) {
            element.remove();
        }
    }
};

/**
 * Affichage de la liste des recherches recentes stockées
 * dans le localStorage (5 entrées max) dans l'outil de recherche.
 */
let RecentSearch = {
    /**
     * clef du localStorage
     */
    key : "lastRecentSearches",

    /**
     * creation de la liste complète des recherches recentes
     * @returns {null}
     */
    create () {
        try {
            if (!localStorage.getItem(this.key)) {
                localStorage.setItem(this.key, "[]");
            }
            var values = JSON.parse(localStorage.getItem(this.key));

            addEntries(values);

        } catch {
            // exception silencieuse
            return;
        }
    },

    /**
     * ajout d'une entrée dans la liste des recherches recentes
     * @param {*} value
     * @returns {null}
     */
    add (value) {
        try {
            if (!localStorage.getItem(this.key)) {
                localStorage.setItem(key, "[]");
            }
            var storeSearches = JSON.parse(localStorage.getItem(this.key));
            // Change l'odre pour avoir le plus récent en haut
            if (storeSearches.includes(value)) {
                var index = storeSearches.indexOf(value);
                removeEntry(storeSearches[index]);
                storeSearches.splice(index, 1);
            }

            if (storeSearches.length > 5) {
                removeEntry(storeSearches[0]);
                storeSearches.shift();
            }
            storeSearches.push(value);
            localStorage.setItem(this.key, JSON.stringify(storeSearches));
            addEntry(value);
        } catch {
            // exception silencieuse
            return;
        }
    }
};

export default RecentSearch;
