import Globals from './globals';
import DOM from './dom';

/**
 * Menu de navigation principal
 */
class MenuNavigation {

    constructor() {
        this.container = document.getElementById("navContainer");
        this.#listeners();
    }

    /**
     * Les écouteurs :
     * - event clic sur le menu de navigation
     * - event clic sur un element du DOM ayant une interaction avec le menu de navigation
     */
    #listeners() {
        // "Où suis-je ?"
        document.getElementById("mypositionWindowClose").addEventListener('click', () => { this.close("myposition"); });
        document.getElementById("myposition").addEventListener("click", () => {
            Globals.compare.hide();
            Globals.myposition.compute()
            .then(() => {
              this.open("myposition");
            });
        });
        // "A proximité"
        document.getElementById("isochroneWindowClose").addEventListener('click',  () => { this.close("isochrone"); });
        document.getElementById("isochrone").addEventListener("click", () => {
            Globals.compare.hide();
            this.open("isochrone");
        });
        // "S'y rendre"
        document.getElementById("directionsWindowClose").addEventListener('click',  () => { this.close("directions"); });
        document.getElementById("directions").addEventListener("click", () => {
            Globals.compare.hide();
            this.open("directions");
        });
        // "Compte"
        document.getElementById("myaccountWindowClose").addEventListener('click', () => { this.close("myaccount"); });
        document.getElementById("myaccount").addEventListener('click',  () => { this.open("myaccount"); });
        
    }

    hide() {
        this.container.classList.add("d-none");
    }

    show() {
        this.container.classList.remove("d-none");
    }

    /**
     * Ouvrir le panneau (tab) du composant
     * @param {*} id 
     */
    open(id) {
        // on vide tous les panneaux
        var lstElements = DOM.$tabContainer.childNodes;
        for (let i = 0; i < lstElements.length; i++) {
            var element = lstElements[i];
            if (element.id && element.tagName.toUpperCase() === "DIV") {
                element.classList.add('d-none');
            }
        }

        // on met à jour l'état du panneau demandé
        Globals.backButtonState = id;

        // on ajoute le panneau demandé
        var element = DOM["$" + id + "Window"];
        if (element) {
            element.classList.remove('d-none');
        }
        
        // y'a t il des particularités sur l'ouverture du panneau demandé ?
        var isSpecific = false;
        switch (id) {
            case "myaccount":
                DOM.$search.style.display = "none";
                DOM.$backTopLeftBtn.classList.remove('d-none');
                Globals.currentScrollIndex = 1;
                break;
            case "layerManager":
                DOM.$search.style.display = "none";
                DOM.$backTopLeftBtn.classList.remove('d-none');
                Globals.currentScrollIndex = 1;
                break;
            case "myposition":
                break;
            case "isochrone":
                // FIXME mettre en place une méthode sur la classe Search
                // ex. Globals.search.hide()
                DOM.$search.style.display = "none";
                DOM.$backTopLeftBtn.classList.remove('d-none');
                break;
            case "search":
                DOM.$sideBySideBtn.classList.add('d-none');
                DOM.$layerManagerBtn.classList.add('d-none');
                DOM.$geolocateBtn.classList.add('d-none');
                DOM.$searchresultsWindow.classList.remove('d-none');
                DOM.$closeSearch.classList.remove('d-none');
                Globals.currentScrollIndex = 2;
                break;
            case "parameterScreen":
            case "legalScreen":
            case "privacyScreen":
            case "plusLoinScreen":
                document.body.style.overflowY = "scroll";
                DOM.$sideBySideBtn.classList.add('d-none');
                DOM.$layerManagerBtn.classList.add('d-none');
                DOM.$geolocateBtn.classList.add('d-none');
                DOM.$blueBg.classList.remove('d-none');
                DOM.$search.style.display = "none";
                DOM.$backTopLeftBtn.classList.remove('d-none');
                DOM.$altMenuContainer.classList.remove('d-none');
                Globals.ignoreNextScrollEvent = true;
                window.scroll({
                    top: 0,
                    left: 0,
                    behavior: 'auto'
                });
                Globals.currentScrollIndex = 0;
                break;
            case "directionsResults":
                isSpecific = true;
                break;
            case "searchDirections":
            case "searchIsochrone":
                DOM.$sideBySideBtn.classList.add('d-none');
                DOM.$layerManagerBtn.classList.add('d-none');
                DOM.$geolocateBtn.classList.add('d-none');
                // FIXME mettre en place une méthode sur la classe Search
                // ex. Globals.search.show()
                DOM.$search.style.display = "flex";
                DOM.$backTopLeftBtn.classList.add('d-none');
                DOM.$searchresultsWindow.classList.remove('d-none');
                DOM.$closeSearch.classList.remove('d-none');
                Globals.currentScrollIndex = 2;
                break;
            case "directions":
                DOM.$search.style.display = "none";
                DOM.$backTopLeftBtn.classList.remove('d-none');
                Globals.directions.interactive(true);
                break;
            default:
                break;
        }
        
        if (isSpecific) {
            this.#open(id);
            return;
        }

        // on cache le menu de navigation
        this.hide();

        // on procede à l'affichage du panneau
        DOM.$tabContainer.style.height = "100%";
        if (Globals.currentScrollIndex === 2) {
            this.updateScrollAnchors();
        } else if (Globals.currentScrollIndex === 1) {
            this.#midScroll();
        } else {
            // ...
        }
    }

    /**
     * Fermer le panneau (tab) du composant
     * @param {*} id 
     */
    close(id) {
        var element = DOM["$" + id + "Window"];
        if (element) {
            element.classList.add('d-none');
        }

        // y'a t il des particularités sur la fermeture du panneau en cours ?
        var isSpecific = false;
        var isFinished = false; // hack pour search !
        switch (id) {
            case "myaccount":
                DOM.$search.style.display = "flex";
                DOM.$backTopLeftBtn.classList.add('d-none');
                break;
            case "layerManager":
                DOM.$search.style.display = "flex";
                DOM.$backTopLeftBtn.classList.add('d-none');
                break;
            case "myposition":
                break;
            case "isochrone":
                // FIXME mettre en place une méthode sur la classe Searchs
                DOM.$search.style.display = "flex";
                DOM.$backTopLeftBtn.classList.add('d-none');
                Globals.isochrone.clear();
                break;
            case "search":
                isSpecific = true;
                isFinished = false;
                break;
            case "directionsResults":
            case "searchDirections":
            case "searchIsochrone":
                isSpecific = true;
                isFinished = true;
                break;
            case "parameterScreen":
            case "legalScreen":
            case "privacyScreen":
            case "plusLoinScreen":
                document.body.style.overflowY = "auto";
                DOM.$sideBySideBtn.classList.remove('d-none');
                DOM.$layerManagerBtn.classList.remove('d-none');
                DOM.$geolocateBtn.classList.remove('d-none');
                DOM.$blueBg.classList.add('d-none');
                DOM.$search.style.display = "flex";
                DOM.$backTopLeftBtn.classList.add('d-none');
                DOM.$altMenuContainer.classList.add('d-none');
                Globals.ignoreNextScrollEvent = true;
                window.scroll({
                    top: 0,
                    left: 0,
                    behavior: 'auto'
                });
                Globals.currentScrollIndex = 0;
                break;
            case "directions":
                DOM.$search.style.display = "flex";
                DOM.$backTopLeftBtn.classList.add('d-none');
                Globals.directions.clear();
                Globals.directions.interactive(false);
                break;
            default:
                break;
        }

        // on est sur une fermeture specifique,
        // on passe donc par un autre mecanisme
        if (isSpecific) {
            this.#close(id);
            if (isFinished) {
                return;
            }
        }

        // on affiche le menu de navigation
        this.show();

        // on met à jour l'état du panneau : vers le menu de navigation
        Globals.backButtonState = 'mainMenu';

        // on retire le panneau
        this.#midScroll();
        DOM.$tabContainer.style.height = "";
    }

    #open(id) {
        switch (id) {
            case "directionsResults":
                break;
        
            default:
                break;
        }

        this.#midScroll();
        DOM.$tabContainer.style.height = "";
    }

    #close(id) {
        Globals.controller.abort();
        Globals.controller = new AbortController();
        Globals.signal = Globals.controller.signal;
        DOM.$resultDiv.hidden = true;
        DOM.$resultDiv.innerHTML = "";
        DOM.$closeSearch.classList.add('d-none');
        DOM.$searchresultsWindow.classList.add('d-none');
        DOM.$sideBySideBtn.classList.remove('d-none');
        DOM.$layerManagerBtn.classList.remove('d-none');
        DOM.$geolocateBtn.classList.remove('d-none');
        switch (id) {
            case "search":
                DOM.$search.style.display = "flex";
                DOM.$backTopLeftBtn.classList.add('d-none');
                break;
            case "directionsResults":
                DOM.$directionsWindow.classList.remove("d-none");
                Globals.backButtonState = 'directions'; // on revient sur le contrôle !
                this.#midScroll();
                break;
            case "searchIsochrone":
                DOM.$search.style.display = "none";
                DOM.$backTopLeftBtn.classList.remove('d-none');
                DOM.$isochroneWindow.classList.remove("d-none");
                Globals.backButtonState = 'isochrone'; // on revient sur le contrôle !
                this.#midScroll();
                break;
            case "searchDirections":
                DOM.$search.style.display = "none";
                DOM.$backTopLeftBtn.classList.remove('d-none');
                DOM.$directionsWindow.classList.remove("d-none");
                Globals.backButtonState = 'directions'; // on revient sur le contrôle !
                this.#midScroll();
            default:
                break;
        }
    }

    updateScrollAnchors() {
        Globals.maxScroll = (document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight);
        Globals.anchors = [0, Globals.maxScroll / 2.5, Globals.maxScroll];
        this.#scrollTo(Globals.anchors[Globals.currentScrollIndex]);
    }
      
    #midScroll() {
        Globals.currentScrollIndex = 1;
        this.updateScrollAnchors();
    }
      
    #scrollTo(value) {
        Globals.ignoreNextScrollEvent = true;
        window.scroll({
          top: value,
          left: 0,
          behavior: 'smooth'
        });
    }
}

export default MenuNavigation;