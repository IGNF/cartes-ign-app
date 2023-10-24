import maplibregl from "maplibre-gl";
import MapLibreGlCompare from "@maplibre/maplibre-gl-compare";

import Globals from './globals';

/**
 * Outil de comparaison de carte
 * 
 * @todo le rendre plus parametrable avec des options dans le constructeur
 */
class Compare {
    /**
     * constructeur
     * @returns
     */
    constructor() {
        this.sideBySide = null;
        this.prevDataLayerDisplayed = '';
        this.container = "#cartoContainer";
        this.map = Globals.map;
        this.mapRLT = Globals.mapRLT;

        this.actived = false;

        return this;
    }

    /**
     * active la comparaison
     * @public
     */
    show() {
        this.actived = true;

        document.querySelector("#mapRLT").classList.remove("d-none");

        this.mapRLT.setCenter(this.map.getCenter());
        this.mapRLT.setZoom(this.map.getZoom());

        this.sideBySide = new MapLibreGlCompare(this.map, this.mapRLT, this.container);

        Globals.mapState = "compare";
        document.querySelector(".baseLayer:not(.selectedLayer)").click();

        this.prevDataLayerDisplayed = Globals.dataLayerDisplayed;
        
        document.querySelector("#dataLayers").classList.add("d-none");
        document.querySelector("#dataLayersLabel").classList.add("d-none");
        document.querySelector(".selectedLayer").style.pointerEvents = "none";
        Globals.menu.open("layerManager");
    }

    /**
     * ferme la comparaison
     * @public
     */
    hide() {
        this.actived = false;

        Globals.menu.close("layerManager");
        
        document.querySelectorAll(".baseLayer").forEach(elem => {
            elem.classList.remove('comparedLayer');
        });
        document.querySelector(".selectedLayer").style.pointerEvents = "";
        if (this.sideBySide) {
            this.sideBySide.remove();
        }
        Globals.mapState = "default";
        document.querySelector("#mapRLT").classList.add("d-none");
        document.querySelector("#dataLayers").classList.remove("d-none");
        document.querySelector("#dataLayersLabel").classList.remove("d-none");
    }

    /**
     * toggle d'affichage de la comparaison de carte
     * @public
     */
    toggle() {
        if (this.actived) {
            this.hide();
        } else {
            this.show();
        }
    }
}

export default Compare;