const map = new L.map('map', { zoomControl: false, rotate: true }).setView([47.33, 2.0], 5);

/* DOM elements */
const $map = document.getElementById("map");
const $startPopup = document.getElementById("startPopup");
const $message = document.getElementById("message");
const $resultDiv = document.getElementById("resultsRech");
const $rech = document.getElementById('lieuRech');
const $geolocateBtn = document.getElementById("geolocateBtn");
const $blueBg = document.getElementById("blueBg");
const $closeSearch = document.getElementById("closeSearch");
const $menuBtn = document.getElementById("menuBtn");
const $menu = document.getElementById("menu");
const $searchImage = document.getElementById("searchImage");
const $backTopLeft = document.getElementById("backTopLeft");
const $parameterMenu = document.getElementById("parameterMenu");
const $legalMenu = document.getElementById("legalMenu");
const $privacyMenu = document.getElementById("privacyMenu");
const $plusLoinMenu = document.getElementById("plusLoinMenu");
const $altMenuContainer = document.getElementById("altMenuContainer");
const $legendWindow = document.getElementById("legendWindow");
const $infoWindow = document.getElementById("infoWindow");
const $infoText = document.getElementById("infoText");
const $legendImg = document.getElementById("legendImg");
const $chkNePlusAff = document.getElementById("chkNePlusAff");
const $chkPrintCoordsOnContext = document.getElementById("chkPrintCoordsOnContext");
const $chkPrintCoordsReticule = document.getElementById("chkPrintCoordsReticule");
const $compassBtn = document.getElementById("compassBtn");
const $chkRotate = document.getElementById("chkRotate");
const $centerCoords = document.getElementById("centerCoords");


export default {map};
