import RouteDrawSaveDOM from "./route-draw-save-dom";
import Globals from "../globals";
import { Toast } from "@capacitor/toast";

/**
 * Interface d'enregistrement d'itinéraire tracé
 * @module RouteDrawSave
 */
class RouteDrawSave {
    /**
     * constructeur
     * @constructs
     * @param {*} map
     * @param {*} options
     */
    constructor (target, options) {
      this.options = options || {
        data: {},
        transport: null,
        name: null,
      };

      // target
      this.target = target;

      // rendu graphique
      this.render();

      this.#listeners();

      return this;
    }

    /**
     * ajout d'ecouteurs pour la saisie interactive
     */
    #listeners() {
      document.getElementById("routeDrawSaveNameInputSubmit").addEventListener("click", () => {
        this.options.name = document.getElementById("routeDrawSaveNameInput").value;
        Globals.myaccount.addRoute(this.options);
        this.hide();
        Globals.routeDraw.hide();
        Toast.show({
          text: "Itinéraire enregistré dans 'Compte'",
          duration: "long",
          position: "bottom"
        });
      });
    }

    /**
     * creation de l'interface
     * @public
     */
    render () {
      var target = this.target || document.getElementById("routeDrawSaveWindow");
      if (!target) {
        console.warn();
        return;
      }

      var container = this.getContainer(this.options.data, this.options.transport);
      if (!container) {
        console.warn();
        return;
      }

      // ajout du container
      target.appendChild(container);
    }

    /**
     * affiche le menu des résultats du calcul
     * @public
     */
    show () {
      Globals.menu.open("routeDrawSave");
    }

    /**
     * ferme le menu des résultats du calcul
     * @public
     */
    hide () {
      Globals.menu.close("routeDrawSave");
    }
}

// mixins
Object.assign(RouteDrawSave.prototype, RouteDrawSaveDOM);

export default RouteDrawSave;
