import Globals from './globals';
import DOM from './dom';
import { App } from '@capacitor/app';

/**
 * Back Button
 * @todo rendre cette fonction générique
 * @todo supprimer la dependance à "MenuDisplay"
 */
const onBackKeyDown = () => {
    // Handle the back button
    if (Globals.backButtonState == 'default') {
        App.exitApp();
    }
    if (Globals.backButtonState === 'search') {
        Globals.menu.close('search');
    }
    if (Globals.backButtonState === 'myaccount') {
        DOM.$whiteScreen.style.removeProperty("animation");
        Globals.menu.close('myaccount');
    }
    if (Globals.backButtonState === 'parameterScreen') {
        Globals.menu.close('parameterScreen');
        Globals.menu.open('myaccount');
    }
    if (Globals.backButtonState === 'legalScreen') {
        Globals.menu.close('legalScreen');
        Globals.menu.open('myaccount');
    }
    if (Globals.backButtonState === 'privacyScreen') {
        Globals.menu.close('privacyScreen');
        Globals.menu.open('myaccount');
    }
    if (Globals.backButtonState === 'informations') {
        Globals.menu.close('informations');
    }
    if (Globals.backButtonState === 'layerManager') {
        Globals.menu.close('layerManager');
    }
    if (Globals.backButtonState === 'directions') {
        Globals.menu.close('directions');
    }
    if (Globals.backButtonState === 'searchDirections') {
        Globals.menu.close('searchDirections');
    }
    if (Globals.backButtonState === 'directionsResults') {
        Globals.menu.close('directionsResults');
    }
    if (Globals.backButtonState === 'isochrone') {
        Globals.menu.close('isochrone');
    }
    if (Globals.backButtonState === 'searchIsochrone') {
        Globals.menu.close('searchIsochrone');
    }
    if (Globals.backButtonState === 'position') {
        Globals.menu.close('position');
    }
    if (Globals.backButtonState.split("-")[0] === 'poi') {
        var previousState = Globals.backButtonState.split("-")[1];
        Globals.menu.close('poi');
        // réouverture de menu précédent
        if (previousState !== "default") {
          Globals.menu.open(previousState);
          return;
        }
    }
    if (Globals.backButtonState === 'compare') {
        Globals.menu.close('compare');
    }
    if (Globals.backButtonState === 'compareLayers1') {
        Globals.menu.close('compareLayers1');
    }
    if (Globals.backButtonState === 'compareLayers2') {
        Globals.menu.close('compareLayers2');
    }
    if (Globals.backButtonState === 'routeDraw') {
        Globals.menu.close('routeDraw');
    }
    if (Globals.backButtonState === 'routeDrawSave') {
      Globals.menu.close('routeDrawSave');
    }
    if (Globals.backButtonState === 'selectOnMapDirections') {
        Globals.menu.close('selectOnMapDirections');
    }
    if (Globals.backButtonState === 'selectOnMapIsochrone') {
        Globals.menu.close('selectOnMapIsochrone');
    }
    if (Globals.backButtonState === 'comparePoi') {
      Globals.menu.close('comparePoi');
    }
    if (Globals.backButtonState === 'comparePoiActivated') {
      document.getElementById("comparePoiWindow").querySelector(".comparePoiText").classList.add("d-none");
      document.getElementById("comparePoiWindow").querySelector(".comparePoiButton").classList.remove("d-none");
      Globals.currentScrollIndex = 0;
      Globals.menu.open('compare');
    }
}

export default {
    onBackKeyDown
}
