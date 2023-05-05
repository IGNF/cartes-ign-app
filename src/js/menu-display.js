import DOM from './dom';
import Globals from './globals';

let polygonHandler;

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

// Fermeture popup démarrage
function startPopupValidation() {
  DOM.$startPopup.hidden = true;
  if (DOM.$chkNePlusAff.checked) {
    localStorage.setItem("lastMotdID", Globals.motd_id);
  }
}

// Ouverture/fermeture catalogue
function openCat() {
  if (document.querySelector("[id^=GProutePanelClose-]").offsetParent !== null){
    document.querySelector("[id^=GProutePanelClose-]").click();
  }
  DOM.$defaultMenu.classList.add("d-none");
  DOM.$catalog.classList.remove('d-none');
  DOM.$catalogBtn.classList.add('d-none');
  DOM.$infoWindow.classList.add('d-none')
  DOM.$legendWindow.classList.add('d-none')
  DOM.$measureMenu.classList.add('d-none')
  DOM.$measureAreaMenu.classList.add('d-none')
  Globals.backButtonState = 'catalog';
  midScroll();
}

function closeCat() {
  DOM.$defaultMenu.classList.remove("d-none");
  DOM.$catalogBtn.classList.remove('d-none');
  DOM.$catalog.classList.add('d-none');
}

// Ouverture/fermeture de l'écran recherche
function searchScreenOn() {
  closeCat();
  DOM.$bottomMenu.style.height = "100%";
  DOM.$catalogBtn.classList.add('d-none');
  DOM.$closeSearch.classList.remove('d-none');
  DOM.$defaultMenuNotSearch.classList.add('d-none');
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
  DOM.$catalogBtn.classList.remove('d-none');
  DOM.$closeSearch.classList.add('d-none');
  DOM.$rech.blur()
  DOM.$defaultMenuNotSearch.classList.remove('d-none');
  Globals.backButtonState = 'default';
  DOM.$bottomMenu.style.height = "";
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
  midScroll();
  Globals.backButtonState = 'mainMenu';
}

function openInfos(){
  DOM.$defaultMenu.classList.add("d-none");
  DOM.$infoWindow.classList.remove("d-none");
  Globals.backButtonState = 'infos';
}

function closeInfos(){
  DOM.$infoWindow.classList.add("d-none");
  DOM.$defaultMenu.classList.remove("d-none");
  midScroll();
  Globals.backButtonState = 'mainMenu';
}

// Ouverture/fermeture des écrans atlernatifs
function altScreenOn() {
  document.body.style.overflowY = "scroll";
  DOM.$defaultMenu.classList.add("d-none");
  DOM.$rech.disabled = true;
  DOM.$rech.style.fontFamily = 'Open Sans Bold';
  DOM.$blueBg.classList.remove('d-none');
  DOM.$searchImage.classList.add('d-none');
  DOM.$backTopLeft.classList.remove('d-none');
  DOM.$closeSearch.classList.remove('d-none');
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
  DOM.$closeSearch.classList.add('d-none');
  DOM.$backTopLeft.classList.add('d-none');
  DOM.$searchImage.classList.remove('d-none');
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

// Menu outils
function openRoute() {
  DOM.$defaultMenu.classList.add("d-none");
  document.querySelector("[id^=GPelevationPath-]").classList.remove("d-none");
  DOM.$bottomMenu.style.height = "100%";
  midScroll();
  Globals.firstClickNeeded = true;
  Globals.backButtonState = 'route';
}

function closeRoute() {
  DOM.$defaultMenu.classList.remove("d-none");
  document.querySelector("[id^=GPelevationPath-]").classList.add("d-none");
  midScroll();
  Globals.backButtonState = 'mainMenu';
  DOM.$bottomMenu.style.height = "";
}

function openMeasure() {
  document.getElementById("polyline-measure-control").click();
  DOM.$defaultMenu.classList.add("d-none");
  DOM.$measureMenu.classList.remove("d-none");
  Globals.currentScrollIndex = 2;
  updateScrollAnchors();
  setTimeout(() => {
    window.scrollBy(0, -10);
    window.scroll(0, Globals.anchors[2]);
  }, 100);
}

function closeMeasure() {
  document.getElementById("polyline-measure-control").click();
  DOM.$defaultMenu.classList.remove("d-none");
  DOM.$measureMenu.classList.add("d-none");
  DOM.$totalMeasure.innerText = "0";
  DOM.$measureUnit.innerText = "m";
  midScroll();
}

function openMeasureArea() {
  polygonHandler = new L.Draw.Polygon(Globals.map);
  polygonHandler.enable();
  DOM.$defaultMenu.classList.add("d-none");
  DOM.$measureAreaMenu.classList.remove("d-none");
  Globals.currentScrollIndex = 2;
  updateScrollAnchors();
}

function closeMeasureArea() {
  polygonHandler.disable();
  try {
    Globals.map.removeLayer(Globals.polygonLayer);
  } catch  {
    console.log("no layer to remove");
  }
  DOM.$defaultMenu.classList.remove("d-none");
  DOM.$measureAreaMenu.classList.add("d-none");
  DOM.$areaMeasureText.innerText = "0 m²";
  midScroll();
}



export {
  startPopupValidation,
  openCat,
  closeCat,
  searchScreenOn,
  searchScreenOff,
  closeSearchScreen,
  openMenu,
  closeMenu,
  openLegend,
  closeLegend,
  openInfos,
  closeInfos,
  altScreenOn,
  altScreenOff,
  openParamsScreen,
  closeParamsScreen,
  openLegalScreen,
  closeLegalScreen,
  openPrivacyScreen,
  closePrivacyScreen,
  openPlusLoinScreen,
  closePlusLoinScreen,
  midScroll,
  scrollTo,
  updateScrollAnchors,
  openRoute,
  closeRoute,
  openMeasure,
  closeMeasure,
  openMeasureArea,
  closeMeasureArea,
};
