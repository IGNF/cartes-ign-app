import DOM from './dom';
import Globals from './globals';

// Fermeture popup démarrage
function startPopupValidation() {
  DOM.$startPopup.hidden = true;
  if (DOM.$chkNePlusAff.checked) {
    localStorage.setItem("lastMotdID", Globals.motd_id);
  }
}

// Ouverture/fermeture catalogue
function openCat() {
  DOM.$defaultMenu.classList.add("d-none");
  DOM.$catalog.classList.remove('d-none');
  DOM.$catalogBtn.classList.add('d-none');
  Globals.backButtonState = 'catalog';
}

function closeCat() {
  DOM.$defaultMenu.classList.remove("d-none");
  DOM.$catalogBtn.classList.remove('d-none');
  DOM.$catalog.classList.add('d-none');
}

// Ouverture/fermeture de l'écran recherche
function searchScreenOn() {
  closeCat();
  DOM.$catalogBtn.classList.add('d-none');
  DOM.$closeSearch.classList.remove('d-none');
  const maxScroll = (document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight);
  DOM.$defaultMenuNotSearch.classList.add('d-none');

  window.scroll({
    top: maxScroll,
    left: 0,
    behavior: 'smooth'
  });
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
}

function closeSearchScreen() {
  searchScreenOff();
  DOM.$rech.value = "";
  openMenu();
}

// Ouverture/fermeture menu burger
function openMenu() {
  Globals.backButtonState = 'mainMenu';
  const maxScroll = (document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight);
  window.scroll({
    top: maxScroll / 2.5,
    left: 0,
    behavior: 'smooth'
  });
}

function closeMenu() {
  Globals.backButtonState = 'default';
  window.scroll({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
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
  window.scroll({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
  Globals.backButtonState = 'default';
}

function openInfos(){
  DOM.$defaultMenu.classList.add("d-none");
  DOM.$infoWindow.classList.remove("d-none");
  Globals.backButtonState = 'infos';
}

function closeInfos(){
  DOM.$infoWindow.classList.add("d-none");
  DOM.$defaultMenu.classList.remove("d-none");
  window.scroll({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
  Globals.backButtonState = 'default';
}

// Ouverture/fermeture des écrans atlernatifs
function altScreenOn() {
  DOM.$defaultMenu.classList.add("d-none");
  DOM.$rech.disabled = true;
  DOM.$rech.style.fontFamily = 'Open Sans Bold';
  DOM.$blueBg.classList.remove('d-none');
  DOM.$searchImage.classList.add('d-none');
  DOM.$backTopLeft.classList.remove('d-none');
  DOM.$closeSearch.classList.remove('d-none');
  DOM.$altMenuContainer.classList.remove('d-none');
  Globals.lastTextInSearch = DOM.$rech.value;
  window.scroll({
    top: 0,
    left: 0,
    behavior: 'auto'
  });
}

function altScreenOff() {
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
  window.scroll({
    top: 0,
    left: 0,
    behavior: 'auto'
  });
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
  closePlusLoinScreen
};
