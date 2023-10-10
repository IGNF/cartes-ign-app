import DOM from './dom';
import Globals from './globals';

function updateScrollAnchors() {
  Globals.maxScroll = (document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight);
  Globals.anchors = [0, Globals.maxScroll / 2.5, Globals.maxScroll];
  scrollTo(Globals.anchors[Globals.currentScrollIndex]);
}

function midScroll() {
  Globals.currentScrollIndex = 1;
  updateScrollAnchors();
}

function scrollTo(scrollValue) {
  Globals.ignoreNextScrollEvent = true;
  window.scroll({
    top: scrollValue,
    left: 0,
    behavior: 'smooth'
  });
}

// Ouverture/fermeture layerManager
function openCat() {
  DOM.$defaultMenu.classList.add("d-none");
  DOM.$layerManagerWindow.classList.remove('d-none');
  DOM.$layerManagerBtn.classList.add('d-none');
  DOM.$infoWindow.classList.add('d-none');
  DOM.$legendWindow.classList.add('d-none');
  DOM.$directionsWindow.classList.add('d-none');
  DOM.$isochroneWindow.classList.add("d-none");
  DOM.$directionsResultsWindow.classList.add('d-none');
  Globals.backButtonState = 'layerManager';
  midScroll();
}

function closeCat() {
  DOM.$defaultMenu.classList.remove("d-none");
  DOM.$layerManagerBtn.classList.remove('d-none');
  DOM.$layerManagerWindow.classList.add('d-none');
}

// Ouverture/fermeture de l'écran recherche
function searchScreenOn() {
  closeCat();
  DOM.$tabContainer.style.height = "100%";
  DOM.$layerManagerBtn.classList.add('d-none');
  DOM.$geolocateBtn.classList.add('d-none');
  DOM.$searchresultsWindow.classList.remove('d-none');
  DOM.$closeSearch.classList.remove('d-none');

  DOM.$defaultMenu.classList.add('d-none');
  DOM.$directionsWindow.classList.add("d-none");
  DOM.$isochroneWindow.classList.add("d-none");
  Globals.currentScrollIndex = 2;
  updateScrollAnchors();
  Globals.backButtonState = 'search';
}

function searchScreenOff() {
  Globals.controller.abort();
  Globals.controller = new AbortController();
  Globals.signal = Globals.controller.signal;
  DOM.$resultDiv.hidden = true;
  DOM.$resultDiv.innerHTML = "";
  DOM.$layerManagerBtn.classList.remove('d-none');
  DOM.$geolocateBtn.classList.remove('d-none');
  DOM.$closeSearch.classList.add('d-none');
  DOM.$searchresultsWindow.classList.add('d-none');
  DOM.$rech.blur()
  DOM.$defaultMenu.classList.remove('d-none');
  Globals.backButtonState = 'default';
  DOM.$tabContainer.style.height = "";
  openMenu();
}

function closeSearchScreen() {
  searchScreenOff();
  DOM.$rech.value = "";
}

// Ouverture/fermeture menu burger
function openMenu() {
  Globals.backButtonState = 'mainMenu';
  Globals.currentScrollIndex = 1;
  updateScrollAnchors();
}

function closeMenu() {
  Globals.backButtonState = 'default';
  Globals.ignoreNextScrollEvent = true;
  window.scroll({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
  Globals.currentScrollIndex = 0;
}

// Ouverture/fermeture des fentres infos et légende
function openLegend(){
  DOM.$defaultMenu.classList.add("d-none");
  DOM.$legendWindow.classList.remove("d-none");
  Globals.backButtonState = 'legend';
}

function closeLegend(){
  DOM.$legendWindow.classList.add("d-none");
  DOM.$defaultMenu.classList.remove("d-none");
  openCat();
}

function openInfos(){
  DOM.$defaultMenu.classList.add("d-none");
  DOM.$infoWindow.classList.remove("d-none");
  Globals.backButtonState = 'infos';
}

function closeInfos(){
  DOM.$infoWindow.classList.add("d-none");
  DOM.$defaultMenu.classList.remove("d-none");
  openCat();
}

// Ouverture/fermeture des écrans atlernatifs
function altScreenOn() {
  document.body.style.overflowY = "scroll";
  DOM.$defaultMenu.classList.add("d-none");
  DOM.$rech.disabled = true;
  DOM.$rech.style.fontFamily = 'Open Sans Bold';
  DOM.$blueBg.classList.remove('d-none');

  DOM.$search.style.display = "none";
  DOM.$backTopLeftBtn.classList.remove('d-none');

  DOM.$altMenuContainer.classList.remove('d-none');
  Globals.lastTextInSearch = DOM.$rech.value;
  Globals.ignoreNextScrollEvent = true;
  window.scroll({
    top: 0,
    left: 0,
    behavior: 'auto'
  });
  Globals.currentScrollIndex = 0;
}

function altScreenOff() {
  document.body.style.overflowY = "auto";
  DOM.$rech.disabled = false;
  DOM.$rech.value = Globals.lastTextInSearch;
  DOM.$rech.removeAttribute('style');
  DOM.$blueBg.classList.add('d-none');

  DOM.$search.style.display = "flex";
  DOM.$backTopLeftBtn.classList.add('d-none');

  DOM.$parameterMenu.classList.add('d-none');
  DOM.$altMenuContainer.classList.add('d-none');
  DOM.$defaultMenu.classList.remove("d-none");
  Globals.ignoreNextScrollEvent = true;
  window.scroll({
    top: 0,
    left: 0,
    behavior: 'auto'
  });
  Globals.currentScrollIndex = 0;
}

// Ouverture/fermeture de l'écran paramètres
function openParamsScreen() {
  altScreenOn();
  DOM.$parameterMenu.classList.remove('d-none');
  DOM.$rech.value = "Paramètres";
  Globals.backButtonState = 'params';
}

function closeParamsScreen() {
  altScreenOff();
  DOM.$parameterMenu.classList.add('d-none');
  Globals.backButtonState = 'default';
}

// Ouverture/fermeture de l'écran mentions légales
function openLegalScreen() {
  altScreenOn();
  DOM.$rech.value = "Mentions légales";
  DOM.$legalMenu.classList.remove('d-none');
  Globals.backButtonState = 'legal';
}

function closeLegalScreen(){
  altScreenOff();
  DOM.$legalMenu.classList.add('d-none');
  Globals.backButtonState = 'default';
}

// Ouverture/fermeture de l'écran vie privée
function openPrivacyScreen() {
  altScreenOn();
  DOM.$privacyMenu.classList.remove('d-none');
  DOM.$rech.value = "Vie privée";
  Globals.backButtonState = 'privacy';
}

function closePrivacyScreen(){
  altScreenOff();
  DOM.$privacyMenu.classList.add('d-none');
  Globals.backButtonState = 'default';
}

// Ouverture/fermeture de l'écran aller plus loin
function openPlusLoinScreen() {
  altScreenOn();
  DOM.$plusLoinMenu.classList.remove('d-none');
  Globals.backButtonState = 'plusLoin';
  DOM.$rech.value = "À découvrir également...";
}

function closePlusLoinScreen(){
  altScreenOff();
  DOM.$plusLoinMenu.classList.add('d-none');
  Globals.backButtonState = 'default';
}

// Menu outils du contrôle de calcul d'itineraire
function openDirections() {
  DOM.$defaultMenu.classList.add("d-none");
  DOM.$infoWindow.classList.add('d-none');
  DOM.$legendWindow.classList.add('d-none');
  DOM.$directionsWindow.classList.remove("d-none");
  DOM.$tabContainer.style.height = "100%";
  DOM.$search.style.display = "none";
  DOM.$backTopLeftBtn.classList.remove('d-none');
  midScroll();
  Globals.backButtonState = 'directions';
  Globals.directions.interactive(true);
}

function closeDirections() {
  DOM.$search.style.display = "flex";
  DOM.$backTopLeftBtn.classList.add('d-none');
  DOM.$defaultMenu.classList.remove("d-none");
  DOM.$directionsWindow.classList.add("d-none");
  midScroll();
  Globals.backButtonState = 'mainMenu';
  DOM.$tabContainer.style.height = "";
  Globals.directions.clear();
  Globals.directions.interactive(false);
}

function openSearchDirections() {
  DOM.$tabContainer.style.height = "100%";
  DOM.$layerManagerBtn.classList.add('d-none');
  DOM.$geolocateBtn.classList.add('d-none');
  DOM.$closeSearch.classList.remove('d-none');
  DOM.$searchresultsWindow.classList.remove('d-none');
  DOM.$search.style.display = "flex";
  DOM.$backTopLeftBtn.classList.add('d-none');

  DOM.$directionsWindow.classList.add("d-none");
  DOM.$defaultMenu.classList.add('d-none');
  Globals.currentScrollIndex = 2;
  updateScrollAnchors();
  Globals.backButtonState = 'searchDirections';
  DOM.$rech.focus();
  DOM.$rech.click();
}

function closeSearchDirections() {
  Globals.controller.abort();
  Globals.controller = new AbortController();
  Globals.signal = Globals.controller.signal;
  DOM.$resultDiv.hidden = true;
  DOM.$resultDiv.innerHTML = "";
  DOM.$defaultMenu.classList.add("d-none");
  DOM.$closeSearch.classList.add('d-none');
  DOM.$searchresultsWindow.classList.add('d-none');
  DOM.$search.style.display = "none";
  DOM.$backTopLeftBtn.classList.remove('d-none');
  DOM.$layerManagerBtn.classList.remove('d-none');
  DOM.$geolocateBtn.classList.remove('d-none');
  DOM.$directionsWindow.classList.remove("d-none");
  Globals.backButtonState = 'directions'; // on revient sur le contrôle !
  midScroll();
}

function openResultsDirections () {
  DOM.$tabContainer.style.height = "";
  DOM.$directionsWindow.classList.add("d-none");
  DOM.$directionsResultsWindow.classList.remove("d-none");
  midScroll();
  Globals.backButtonState = 'resultsDirections';
}

function closeResultsDirections () {
  DOM.$tabContainer.style.height = "100%";
  DOM.$directionsResultsWindow.classList.add("d-none");
  DOM.$directionsWindow.classList.remove("d-none");
  Globals.backButtonState = 'directions'; // on revient sur le contrôle !
  midScroll();
}

// Menu outils du contrôle isochrone
function openIsochrone() {
  DOM.$defaultMenu.classList.add("d-none");
  DOM.$infoWindow.classList.add('d-none');
  DOM.$legendWindow.classList.add('d-none');
  DOM.$directionsWindow.classList.add("d-none");
  DOM.$isochroneWindow.classList.remove('d-none');
  DOM.$tabContainer.style.height = "100%";
  DOM.$search.style.display = "none";
  DOM.$backTopLeftBtn.classList.remove('d-none');
  midScroll();
  Globals.backButtonState = 'isochrone';
  // Globals.isochrone.interactive(true);
}

function closeIsochrone() {
  DOM.$search.style.display = "flex";
  DOM.$backTopLeftBtn.classList.add('d-none');
  DOM.$defaultMenu.classList.remove("d-none");
  DOM.$isochroneWindow.classList.add("d-none");
  midScroll();
  Globals.backButtonState = 'mainMenu';
  DOM.$tabContainer.style.height = "";
  Globals.isochrone.clear();
}

function openSearchIsochrone() {
  DOM.$tabContainer.style.height = "100%";
  DOM.$layerManagerBtn.classList.add('d-none');
  DOM.$geolocateBtn.classList.add('d-none');
  DOM.$closeSearch.classList.remove('d-none');
  DOM.$searchresultsWindow.classList.remove('d-none');
  DOM.$isochroneWindow.classList.add("d-none");
  DOM.$search.style.display = "flex";
  DOM.$backTopLeftBtn.classList.add('d-none');

  Globals.currentScrollIndex = 2;
  updateScrollAnchors();
  Globals.backButtonState = 'searchIsochrone';
  DOM.$rech.focus();
  DOM.$rech.click();
}

function closeSearchIsochrone() {
  Globals.controller.abort();
  Globals.controller = new AbortController();
  Globals.signal = Globals.controller.signal;
  DOM.$resultDiv.hidden = true;
  DOM.$resultDiv.innerHTML = "";
  DOM.$defaultMenu.classList.add("d-none");
  DOM.$closeSearch.classList.add('d-none');
  DOM.$searchresultsWindow.classList.add('d-none');
  DOM.$search.style.display = "none";
  DOM.$backTopLeftBtn.classList.remove('d-none');
  DOM.$layerManagerBtn.classList.remove('d-none');
  DOM.$geolocateBtn.classList.remove('d-none');
  DOM.$isochroneWindow.classList.remove("d-none");
  Globals.backButtonState = 'isochrone'; // on revient sur le contrôle !
  midScroll();
}

// Menu "Où suis-je ?"
function openMyPosition() {
  DOM.$defaultMenu.classList.add("d-none");
  DOM.$infoWindow.classList.add('d-none');
  DOM.$legendWindow.classList.add('d-none');
  DOM.$directionsWindow.classList.add("d-none");
  DOM.$isochroneWindow.classList.add('d-none');
  DOM.$mypositionWindow.classList.remove('d-none');
  DOM.$tabContainer.style.height = "100%";
  midScroll();
  Globals.backButtonState = 'myposition';
}

function closeMyPosition() {
  DOM.$defaultMenu.classList.remove("d-none");
  DOM.$mypositionWindow.classList.add('d-none');
  DOM.$defaultMenu.classList.remove('d-none');
  midScroll();
  Globals.backButtonState = 'mainMenu';
  DOM.$tabContainer.style.height = "";
}

export default {
  openCat,
  closeCat,
  searchScreenOn,
  searchScreenOff,
  closeSearchScreen,
  closeMenu,
  openLegend,
  closeLegend,
  openInfos,
  closeInfos,
  openParamsScreen,
  closeParamsScreen,
  openLegalScreen,
  closeLegalScreen,
  openPrivacyScreen,
  closePrivacyScreen,
  openPlusLoinScreen,
  closePlusLoinScreen,
  scrollTo,
  updateScrollAnchors,
  openDirections,
  closeDirections,
  openSearchDirections,
  closeSearchDirections,
  openResultsDirections,
  closeResultsDirections,
  openIsochrone,
  closeIsochrone,
  openSearchIsochrone,
  closeSearchIsochrone,
  openMyPosition,
  closeMyPosition,
};
