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
        id: null,
      };

      // target
      this.target = target;

      this.id = this.options.id || -1;

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
        let name = document.getElementById("routeDrawSaveNameInput").value;
        if (name === "") {
          name = `De ${this.options.data.points[0].properties.name} à ${this.options.data.points.slice(-1)[0].properties.name}`;
        }
        this.options.name = name;
        this.options.visible = true;
        Globals.myaccount.addRoute(JSON.parse(JSON.stringify(this.options)));
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
      var container = this.getContainer(this.options.data, this.options.transport, this.options.name);
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
