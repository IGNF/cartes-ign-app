import Globals from './globals';
import DOM from './dom';
import * as LayerSwitch from './layer-switch';
import * as MenuDisplay from './menu-display';

let sideBySide = L.control.sideBySide();
const map = Globals.map;

let prevDataLayerDisplayed = '';

function addMapControls() {

  // Échelle graphique
  L.control.scale({
    imperial: false,
    maxWidth: 150,
    position: "topleft",
  }).addTo(map);

  // Polyline measure
  L.control.polylineMeasure().addTo(map);

  /* GP plugin*/
  // Geoportail widget route
  const route = L.geoportalControl.Route({
    apiKey: "calcul",
    routeOptions: {
      onSuccess: routeSuccess,
      geometryInInstructions: false,
    },
  });
  map.addControl(route);

  // Geoportail widget elevationpath
  const elevationpath = L.geoportalControl.ElevationPath({
    apiKey: "calcul",
    elevationPathOptions: {
      httpMethod: "POST",
      api: "WPS",
      sampling: 200,
    }
  });
  map.addControl(elevationpath);

  // Route success callback
  function routeSuccess(routeResponse) {
    computeRouteElevation(routeResponse);
  }

  // Elevation path on route result
  function computeRouteElevation(routeResponse) {
    const geom = [];
    const routeGeom = routeResponse.routeGeometry.coordinates;
    for (var i = 0; i < routeGeom.length; i++) {
      geom.push({
        lon : routeGeom[i][0],
        lat : routeGeom[i][1]
      });
    }
    elevationpath._distance = parseFloat(routeResponse.totalDistance);
    elevationpath._geometry = geom;
    elevationpath.options.elevationPathOptions.sampling = 0;
    if (geom.length < 200) {
      elevationpath.options.elevationPathOptions.sampling = 200;
    }
    elevationpath._pictoContainer.style.display = "none";
    elevationpath._panelContainer.style.display = "block";
    elevationpath._altiRequest();
    elevationpath.options.elevationPathOptions.sampling = 200;
    MenuDisplay.updateScrollAnchors();
  };

  // Add route from my position
  const reference = document.querySelector('form[id^="GProuteForm"]').firstChild.firstChild.lastChild;
  const routeFromMe = document.createElement("label");
  routeFromMe.id = "routeFromMe";
  routeFromMe.classList.add("GPlocationOriginPointerImgFromMyPosition");
  routeFromMe.title = "Itinéraire depuis ma position";
  reference.parentNode.insertBefore(routeFromMe, reference);

  routeFromMe.addEventListener("click", () => {
    if (Geolocation) {
      Geolocation.getCurrentPosition( (position) => {
        const latlng = {lat: position.coords.latitude, lng: position.coords.longitude};
        route._currentPoints[0]._inputShowPointerContainer.checked = true;
        route._currentPoints[0]._inputAutoCompleteContainer.className = "GPlocationOriginHidden";
        route._currentPoints[0]._inputCoordinateContainer.className = "GPlocationOriginVisible";
        route._currentPoints[0]._setLabel();
        route._currentPoints[0]._clearResults();
        route._currentPoints[0]._setMarker(latlng, null, false);
        route._currentPoints[0]._setCoordinate(latlng);
        document.querySelector('input[id^="GProuteSubmit"]').click();
      });
    }
  })

  // Move controls in DOM
  DOM.$bottomMenu.appendChild(document.querySelector("div[id^=GProute-]"));
  document.querySelector("div[id^=GProuteResultsPanel-]").appendChild(document.querySelector("div[id^=GPelevationPath-]"));

  document.querySelector("div[id^=GProutePanelClose-]").addEventListener('click', MenuDisplay.closeRoute);

  const gpAddStage = document.querySelector("div[id^=GPlocationStageAdd-]");
  gpAddStage.addEventListener('click', () => {
    setTimeout( () => {
      MenuDisplay.updateScrollAnchors();
      if (Globals.currentScrollIndex != 2) {
        window.scrollBy({
          top: gpAddStage.clientHeight,
          left: 0,
          behavior : "smooth"
        });
      }
    }, 250);
  });

  document.querySelector("[id^=GPshowRouteExclusionsPicto-]").addEventListener('click', () => {
    setTimeout( () => {
      MenuDisplay.updateScrollAnchors();
      if (Globals.currentScrollIndex != 2) {
      window.scrollBy({
        top: document.querySelector("[id^=GProuteExclusions-]").clientHeight,
        left: 0,
        behavior : "smooth"
      });
      }

    }, 600);
  });

  const gpLocationImgs = document.querySelectorAll(".GPlocationOriginPointerImg");
  gpLocationImgs.forEach(el => el.addEventListener("click", () => {
    if (Globals.firstClickNeeded) {
      DOM.$map.click();
    }
    Globals.firstClickNeeded = false;
  }));

  document.querySelector("[id^=GProuteResultsNew-]").addEventListener("click", () => {
    Globals.firstClickNeeded = true;
  });

  document.querySelector("[id^=GPelevationPathProfil]").addEventListener("touchmove", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
}

function addSideBySide() {
  sideBySide.addTo(map);
  sideBySide.setLeftLayers(Globals.baseLayer.getLayers()[0]);
  Globals.sideBySideOn = true;
  document.querySelector(".baseLayer:not(.selectedLayer)").click();

  prevDataLayerDisplayed = Globals.dataLayerDisplayed;
  LayerSwitch.displayDataLayer(Globals.dataLayerDisplayed);
  document.querySelector("#dataLayers").classList.add("d-none");
  document.querySelector("#dataLayersLabel").classList.add("d-none");
  document.querySelector("#sideBySideOff").classList.remove("d-none");
  document.querySelector("#sideBySideOn").classList.add("d-none");
  document.querySelector(".selectedLayer").style.pointerEvents = "none";
  MenuDisplay.openCat();
}

function removeSideBySide() {
  map.removeControl(sideBySide);
  document.querySelectorAll(".baseLayer").forEach(elem => {
    elem.classList.remove('comparedLayer');
  });
  Globals.compareLayer.clearLayers();
  document.querySelector(".selectedLayer").style.pointerEvents = "";
  Globals.sideBySideOn = false;
  document.querySelector("#dataLayers").classList.remove("d-none");
  document.querySelector("#dataLayersLabel").classList.remove("d-none");
  document.querySelector("#sideBySideOff").classList.add("d-none");
  document.querySelector("#sideBySideOn").classList.remove("d-none");
  LayerSwitch.displayDataLayer(prevDataLayerDisplayed);
}

export {
  addMapControls,
  sideBySide,
  addSideBySide,
  removeSideBySide,
}
