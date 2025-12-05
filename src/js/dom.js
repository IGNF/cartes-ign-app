/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

/* DOM elements */

const $search  = document.getElementById("search");
const $resultDiv = document.getElementById("resultsRech");
const $rech = document.getElementById("lieuRech");
const $searchResults = document.getElementById("searchResults");
const $resultsRechRecent = document.getElementById("resultsRechRecent");
const $searchImage = document.getElementById("searchImage");

const $map = document.getElementById("map");

const $myGeoLocation = document.getElementById("myGeoLocation");
const $selectOnMap = document.getElementById("selectOnMap");

const $geolocateBtn = document.getElementById("geolocateBtn");
const $backTopLeftBtn = document.getElementById("backTopLeftBtn");
const $compassBtn = document.getElementById("compassBtn");
const $trackRecordBtn = document.getElementById("trackRecordBtn");
const $layerManagerBtn = document.getElementById("layerManagerBtn");
const $sideBySideBtn = document.getElementById("sideBySideBtn");
const $compareMode = document.getElementById("compareMode");
const $sideBySideLeftLayer = document.getElementById("sideBySideLeftLayer");
const $sideBySideRightLayer = document.getElementById("sideBySideRightLayer");
const $createCompareLandmarkBtn = document.getElementById("createCompareLandmarkBtn");
const $sideBySideFadeSlider = document.getElementById("sideBySideFadeSlider");
const $compareLayers1Window = document.getElementById("compareLayers1Window");
const $compareLayers2Window = document.getElementById("compareLayers2Window");
const $filterPoiBtn = document.getElementById("filterPoiBtn");
const $interactivityBtn = document.getElementById("interactivityBtn");
const $routeDrawEdit = document.getElementById("routeDrawEdit");
const $routeDrawCancel = document.getElementById("routeDrawCancel");
const $routeDrawRestore = document.getElementById("routeDrawRestore");
const $routeDrawDelete = document.getElementById("routeDrawDelete");
const $routeDrawSaveBtn = document.getElementById("routeDrawSaveBtn");
const $routeDrawSnap = document.getElementById("routeDrawSnap");
const $directionsSaveBtn = document.getElementById("directionsSaveBtn");
const $eventMapBtn = document.getElementById("eventMapBtn");
const $fullScreenBtn = null;
const $mapScale = null;
const $trackRecordInfos = document.getElementById("trackRecordInfos");

const $mapCenter = document.getElementById("mapCenter");
const $mapCenterMenu = document.getElementById("mapCenterMenu");
const $mapCenterSubmit = document.getElementById("mapCenterSubmit");

const $bottomButtons = document.getElementById("bottomButtons");

const $whiteScreen = document.getElementById("whiteScreen");
const $informationsScreenWindow = document.getElementById("informationsScreenWindow");
const $altMenuContainer = document.getElementById("altMenuContainer");

const $informationsWindow = document.getElementById("informationsWindow");
const $informationsText = document.getElementById("informationsText");
const $informationsImg = document.getElementById("informationsImg");

const $newsfeedWindow = document.getElementById("newsfeedWindow");

const $chkPrintCoordsOnContext = document.getElementById("chkPrintCoordsOnContext");
const $chkPrintCoordsReticule = document.getElementById("chkPrintCoordsReticule");

const $tabClose = document.getElementById("tabClose");
const $tabContainer = document.getElementById("tabContainer");
const $tabHeader = document.getElementById("tabHeader");

const $searchresultsWindow = document.getElementById("searchresultsWindow");
const $layerManagerWindow = document.getElementById("layerManagerWindow");
const $directionsWindow = document.getElementById("directionsWindow");
const $directionsResultsWindow = document.getElementById("directionsResultsWindow");
const $isochroneWindow = document.getElementById("isochroneWindow");
const $positionWindow = document.getElementById("positionWindow");
const $myaccountWindow = document.getElementById("myaccountWindow");
const $poiWindow = document.getElementById("poiWindow");
const $routeDrawWindow = document.getElementById("routeDrawWindow");
const $routeDrawSaveWindow = document.getElementById("routeDrawSaveWindow");
const $comparePoiWindow = document.getElementById("comparePoiWindow");
const $signalementWindow = document.getElementById("signalementWindow");
const $signalementOSMWindow = document.getElementById("signalementOSMWindow");
const $landmarkWindow = document.getElementById("landmarkWindow");
const $compareLandmarkWindow = document.getElementById("compareLandmarkWindow");
const $offlineMapsWindow = document.getElementById("offlineMapsWindow");
const $trackRecordWindow = document.getElementById("trackRecordWindow");

export default {
  $search,
  $resultDiv,
  $rech,
  $geolocateBtn,
  $whiteScreen,
  $searchResults,
  $resultsRechRecent,
  $searchImage,
  $myGeoLocation,
  $selectOnMap,
  $backTopLeftBtn,
  $informationsScreenWindow,
  $altMenuContainer,
  $chkPrintCoordsOnContext,
  $chkPrintCoordsReticule,
  $compassBtn,
  $trackRecordBtn,
  $tabContainer,
  $tabHeader,
  $searchresultsWindow,
  $layerManagerWindow,
  $layerManagerBtn,
  $directionsWindow,
  $directionsResultsWindow,
  $isochroneWindow,
  $positionWindow,
  $sideBySideBtn,
  $compareMode,
  $sideBySideLeftLayer,
  $sideBySideRightLayer,
  $compareLayers1Window,
  $compareLayers2Window,
  $myaccountWindow,
  $informationsWindow,
  $informationsText,
  $informationsImg,
  $filterPoiBtn,
  $poiWindow,
  $interactivityBtn,
  $routeDrawWindow,
  $routeDrawEdit,
  $bottomButtons,
  $routeDrawCancel,
  $routeDrawRestore,
  $routeDrawDelete,
  $routeDrawSaveBtn,
  $routeDrawSnap,
  $routeDrawSaveWindow,
  $mapCenter,
  $mapCenterMenu,
  $mapCenterSubmit,
  $comparePoiWindow,
  $signalementWindow,
  $signalementOSMWindow,
  $landmarkWindow,
  $tabClose,
  $sideBySideFadeSlider,
  $fullScreenBtn,
  $mapScale,
  $map,
  $createCompareLandmarkBtn,
  $compareLandmarkWindow,
  $offlineMapsWindow,
  $trackRecordWindow,
  $eventMapBtn,
  $directionsSaveBtn,
  $newsfeedWindow,
  $trackRecordInfos,
};
