import DOM from "./dom";

var className = "recentresult";

const addEntry = (value) => {
    var el = document.createElement("p");
    el.className = className;
    el.textContent = value;
    DOM.$resultsRechRecent.appendChild(el);
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
        if (element.textContent === value) {
            element.remove();
        }
    }
};

/**
 * Liste des recherches recentes stockées dans le localStorage (5 entrées max).
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
            if (storeSearches.includes(value)) {
                return;
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