import * as Coords from './coordinates';
import * as EventListeners from './event-listeners';
import * as LayerSwitch from './layer-switch';
import * as Location from './location';
import DOM from './dom';
import Globals from './globals';

function app() {
  /**
   * Fonction définissant l'application
   */

  /* Demande d'autorisation au 1er lancement de l'appli */
  if (!localStorage.getItem("firstLocRequestDone")){
    Location.requestLocationAccuracy();
    localStorage.setItem("firstLocRequestDone", true);
  }
  /**/

  /* Message du jour (message of the day) */
  const motd_url = 'https://www.geoportail.gouv.fr/depot/app/motd.json?v=2';
  fetch(motd_url, {mode: 'cors'}).then( response => {
    response.json().then( data => {
      DOM.$message.innerHTML += DOMPurify.sanitize(data.motd, {FORBID_TAGS: ['input']});
      Globals.motd_id = data.id;
    }).then( () => {
      if (!localStorage.getItem("lastMotdID") || (localStorage.getItem("lastMotdID") && (localStorage.getItem("lastMotdID") < Globals.motd_id))) {
        if(DOM.$message.innerHTML !== '') {
          DOM.$startPopup.classList.remove('d-none');
        }
      }
    });
  });
  /**/

  /* Définition des marker icons */
  Globals.gpMarkerIcon = L.icon({
    iconUrl: cordova.file.applicationDirectory + 'www/css/assets/position.svg',
    iconSize:     [23, 23], // size of the icon
    iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
    className:    'gpsMarker',
  });

  Globals.gpMarkerIcon2 = L.icon({
    iconUrl: cordova.file.applicationDirectory + 'www/css/assets/map-center.svg',
    iconSize:     [23, 23], // size of the icon
    iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
    className:    'adressMarker',
  });
  /**/

  /* Récupération de la carte */
  const map = Globals.map;
  // Ajout de l'échelle
  L.control.scale({
    imperial: false,
    maxWidth: 150,
    position: "bottomleft",
  }).addTo(map);

  // Chargement de la postition précédente
  if (localStorage.getItem("lastMapLat") && localStorage.getItem("lastMapLng") && localStorage.getItem("lastMapZoom")) {
    map.setView([localStorage.getItem("lastMapLat"), localStorage.getItem("lastMapLng")], localStorage.getItem("lastMapZoom"));
  }
  // Initialisation des coordonnées du centre
  Coords.updateCenterCoords(map.getCenter());

  // Chargement de la couche précédente
  switch (Globals.layerDisplayed) {
    case 'photos':
      LayerSwitch.displayOrtho();
      break;
    case 'routes':
      LayerSwitch.displayOrthoAndRoads();
      break;
    case 'cadastre':
      LayerSwitch.displayOrthoAndParcels();
      break;
    case 'plan-ign':
      LayerSwitch.displayPlan();
      break;
    case 'cartes':
      LayerSwitch.displayCartes();
      break;
    case 'drones':
      LayerSwitch.displayDrones();
      break;
    case 'topo':
      LayerSwitch.displayTopo();
      break;
    case 'etat-major':
      LayerSwitch.displayEtatMajor();
      break;
    case 'ortho-histo':
      LayerSwitch.displayOrthoHisto();
      break;
  }
  /**/

  // Ajout des event listeners
  EventListeners.addEventListeners();

  /* Gestion des events sur iOS 13 et supérieur*/
  //  thank you to https://github.com/ilblog   
  // (https://github.com/Leaflet/Leaflet/issues/6817)   
  if (navigator.userAgent === "GeoportailAppIOS"){
    let timer = null;
    function fireLongPressEvent(originalEvent) {
      clearLongPressTimer();
      const el = originalEvent.target,
            x = originalEvent.touches[0].clientX,
            y = originalEvent.touches[0].clientY
      // This will emulate contextmenu mouse event
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y
      });

      // fire the long-press event
      const suppressClickEvent = el.dispatchEvent.call(el,event);
      if (suppressClickEvent) {
        // temporarily intercept and clear the next click
        DOM.$map.addEventListener('touchend', function clearMouseUp(e) {
          DOM.$map.removeEventListener('touchend', clearMouseUp, true);
          cancelEvent(e);
        }, true);
      }
    }

    function startLongPressTimer(e) {
      clearLongPressTimer(e);
      timer = setTimeout( fireLongPressEvent.bind(null,e), 1000 );
    }

    function clearLongPressTimer() {
      if(timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function cancelEvent(e){
      e.stopImmediatePropagation();
      e.preventDefault();
      e.stopPropagation();
    }

    // hook events that clear a pending long press event
    DOM.$map.addEventListener('touchcancel', clearLongPressTimer, true);
    DOM.$map.addEventListener('touchend', clearLongPressTimer, true);
    DOM.$map.addEventListener('touchmove', clearLongPressTimer, true);
    // hook events that can trigger a long press event
    DOM.$map.addEventListener('touchstart', startLongPressTimer, true); // <- start

    function makeDoubleClick(doubleClickCallback, singleClickCallback) {
      var clicks = 0, timeout;
      return function(originalEvent) {
        clicks++;               
        if (clicks == 1) {
          singleClickCallback && singleClickCallback.apply(this, arguments);
          timeout = setTimeout(function() { clicks = 0; }, 400);
        } else { 
          timeout && clearTimeout(timeout);
          const x = originalEvent.clientX,
                y = originalEvent.clientY;

          const event = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true, 
            clientX: x,
            clientY: y
          });

          let latlng = map.mouseEventToLatLng(event);
          map.setZoomAround(latlng, map.getZoom() + 1);
          doubleClickCallback && doubleClickCallback.apply(this, arguments);
          clicks = 0;
        }
      };
    }    
              
    DOM.$map.addEventListener('click', makeDoubleClick(), false);   
  }
  /**/
}

document.addEventListener('deviceready', () => {
  app();
});
