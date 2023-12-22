import Globals from './globals';
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
        Globals.menu.close('myaccount');
    }
    if (Globals.backButtonState === 'parameterScreen') {
        Globals.menu.close('parameterScreen');
    }
    if (Globals.backButtonState === 'legalScreen') {
        Globals.menu.close('legalScreen');
    }
    if (Globals.backButtonState === 'privacyScreen') {
        Globals.menu.close('privacyScreen');
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
    if (Globals.backButtonState === 'poi') {
        Globals.menu.close('poi');
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
}

export default {
    onBackKeyDown
}
