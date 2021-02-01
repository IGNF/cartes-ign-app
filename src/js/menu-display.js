// Ouverture/fermeture catalogue
function openCat() {
  document.getElementById("catalog").classList.remove('d-none');
  backButtonState = 'catalog';
}

function closeCat() {
  document.getElementById("catalog").classList.add('d-none');
}

export {
  openCat,
  closeCat
};