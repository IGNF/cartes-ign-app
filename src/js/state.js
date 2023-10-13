import Globals from './globals';
import { App } from '@capacitor/app';
import MenuDisplay from './menu-display';

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
    if (Globals.backButtonState === 'mainMenu') {
        // ...
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
    if (Globals.backButtonState === 'plusLoinScreen') {
        Globals.menu.close('plusLoinScreen');
    }
    if (Globals.backButtonState === 'infos') {
        MenuDisplay.closeInfos();
    }
    if (Globals.backButtonState === 'legend') {
        MenuDisplay.closeLegend();
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
    if (Globals.backButtonState === 'myposition') {
        Globals.menu.close('myposition');
    }
}

export default {
    onBackKeyDown
}