import Globals from './globals';
import DOM from './dom';
import * as MenuDisplay from './menu-display';


function addMapControls() {
  const map = Globals.map;

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
  routeFromMe.classList.add("GPlocationOriginPointerImg");
  routeFromMe.classList.add("GPlocationOriginPointerImgFromMyPosition");
  routeFromMe.title = "Itinéraire depuis ma position";
  reference.parentNode.insertBefore(routeFromMe, reference);

  routeFromMe.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition( (position) => {
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

  document.querySelector("[id^=GPelevationPathProfil]").addEventListener("scroll", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
}

export {
  addMapControls,
}
