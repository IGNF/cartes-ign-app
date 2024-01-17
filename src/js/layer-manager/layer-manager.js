import Globals from '../globals';
import LayerSwitcher from './layer-switcher';
import LayerCatalogue from './layer-catalogue';
import LayersConfig from './layer-config';

/**
 * Manager des couches avec l'initialisation des 2 modules suivants :
 * - gestionnaire des couches (classique)
 * - gestion des thèmatiques et fonds de carte
 * @see LayerSwitcher
 * @see LayerCatalogue
 * @fires addlayer
 * @fires removelayer
 * @fires movelayer
 * @description
 *      → manager
 *      	→ instancie this.catalogue & this.switcher
 *     	→ ecouteurs sur les events
 *	      	* addLayer
 *	      	   → this.catalogue → call this.switcher.addLayer
 *	      	   → this.switcher → call this.updateCounter
 *	      	* removeLayer
 *	      	   → this.catalogue → call this.switcher.removeLayer
 *	      	   → this.switcher → call this.updateCounter
 *      	→ loader de couches par defaut
 *         		→ call this.catalogue.addLayer
 *
 *      → catalogue
 *        	→ this.addLayer → call add interface → fire event addLayer
 *        	→ this.removeLayer → call remove interface → fire event removeLayer
 *      → switcher
 *        	→ this.addLayer → call addContainer & addGroup & map.addLayer → fire event addLayer
 *       	→ this.removeLayer → call removeContainer & removeGroup & map.removeLayer → fire event removeLayer
 *        	→ this.moveLayer → call moveContainer & moveGroup & map.moveLayer
 *
 */
class LayerManager extends EventTarget {
    /**
     * constructeur
     * @param {*} options -
     * @param {*} options.target - ...
     * @param {*} options.layers - ...
     * @example
     * new LayerManger({
     *   layers : [
     *     layers : "couche1, couche2, ...",
     *     type : "base" // data ou thematic
     *   ]
     * });
     */
    constructor(options) {
        super();
        this.options = options || {
            /**
             * ["layerid", "layer2id"]
             */
            layers : [],
            target : null
        };

        this.layerCatalogue = null;
        this.layerSwitcher = null;

        this.#render();
        this.#listeners();
        this.#loadLayers();
    }

    /**
     * Ecouteurs
     */
    #listeners() {
        this.layerCatalogue.addEventListener("addlayer", async (e) => {
            await this.layerSwitcher.addLayer(e.detail.id).then(() => {});
        });
        this.layerCatalogue.addEventListener("removelayer", (e) => {
            this.layerSwitcher.removeLayer(e.detail.id);
        });

        this.layerSwitcher.addEventListener("addlayer", (e) => {
            /**
             * Evenement "addlayer"
             * @event addlayer
             * @type {*}
             * @property {*} id -
             * @property {*} options -
             */
            this.dispatchEvent(
                new CustomEvent("addlayer", {
                    bubbles: true,
                    detail: e.detail
                })
            );
            if (Globals.layersDisplayed.indexOf(e.detail.id) === -1) {
              Globals.layersDisplayed.push(e.detail.id);
            }
            var element = document.getElementById(e.detail.id);
            element.classList.add('selectedLayer');
            this.#updateLayersCounter(e.type);
        });
        this.layerSwitcher.addEventListener("removelayer", (e) => {
            /**
             * Evenement "removelayer"
             * @event removelayer
             * @type {*}
             * @property {*} id -
             */
            this.dispatchEvent(
                new CustomEvent("removelayer", {
                    bubbles: true,
                    detail: e.detail
                })
            );
            Globals.layersDisplayed.splice(Globals.layersDisplayed.indexOf(e.detail.id), 1);
            var element = document.getElementById(e.detail.id);
            element.classList.remove('selectedLayer');
            if (e.detail.error) {
                return;
            }
            this.#updateLayersCounter(e.type);
        });
        this.layerSwitcher.addEventListener("movelayer", (e) => {
            /**
             * Evenement "movelayer"
             * @event movelayer
             * @type {*}
             * @property {*} id -
             * @property {*} positions -
             */
            this.dispatchEvent(
                new CustomEvent("movelayer", {
                    bubbles: true,
                    detail: e.detail
                })
            );
            Globals.layersDisplayed.splice(e.detail.positions.new, 0, Globals.layersDisplayed.splice(e.detail.positions.old, 1)[0])
        });
    }

    /**
     * Rendu du menu de management des couches
     */
    #render() {
        var target = this.options.target || document.getElementById("layerManagerWindow");
        if (!target) {
            console.warn();
            return;
        }

        // ajout du module thematique
        this.layerCatalogue = new LayerCatalogue({
            target : document.getElementById("layer-thematics")
        });

        // ajout du module de gestionnaire de couche
        this.layerSwitcher = new LayerSwitcher({
            target : document.getElementById("layer-switcher")
        });

        this.#getLayersAvailableCounter();
    }

    /**
     * Afficher le menu
     * @public
     */
    show() {}

    /**
     * Fermer le menu
     * @public
     */
    hide() {}

    /**
     * Chargement de plusieurs couches
     * @todo transmettre des options de la couches (ex. opacité)
     */
    #loadLayers() {
        // 1. le layer manager demande l'ajout de couches (liste) via le layer catalogue (méthode catalogue.addLayer)
        // 2. le layer catalogue modifie le dom du catalogue (statut selectionné) puis, envoie un event addlayer que le layer manager intercepte
        // 3. le layer manager demande un ajout au layer switcher (méthode switcher.addLayer)
        // 4. le layer switcher traite la demande (creation du dom), puis envoie un event addlayer de fin d'ajout
        // 5. le layer manager traite la demande du layer switcher avec une mise à jour des informations (incremente le nombre de couche)

        // le layer manager n'attend pas la fin de l'ajout de la couche courrante pour enchainer une autre couche
        // le layer manager devrait attendre la fin du 1er ajout de couche avant de passer à la suivante !
        if (this.options.layers) {
            for (let i = 0; i < this.options.layers.length; i++) {
                const layerName = this.options.layers[i];
                this.layerCatalogue.addLayer(layerName); // TODO transmettre des options de la couches (ex. opacité)
            }
        }
    }

    /**
     * Mise à jour du comtpeur de couches sur le gestionnaire de couches
     * @param {*} type
     */
    #updateLayersCounter(type) {
        // cf. l'abonnement à l'ajout / suppression de couche
        var counter = document.getElementById("layer-switcher-number");
        var value = parseInt(counter.textContent, 10);
        if (type === "addlayer") {
            value++;
        }
        if (type === "removelayer") {
            value--;
        }
        counter.textContent = value;
    }

    /**
     * Obtient le nombre de couches du catalogue disponibles
     */
    #getLayersAvailableCounter() {
        var counter = document.getElementById("layer-thematics-number");
        var value = LayersConfig.getBaseLayers().length +
                    LayersConfig.getThematicLayers().length;
        counter.textContent = value;
    }
}

export default LayerManager;
