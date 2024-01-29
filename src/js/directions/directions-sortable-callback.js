var sortableCallback = (evt) => {
  if (evt.newDraggableIndex == evt.oldDraggableIndex) {
    return;
  }
  const locationItems = document.querySelectorAll(".divDirectionsLocationsItem");
  const lastIndex = locationItems.length - 1;
  for (let i = 0; i < locationItems.length; i++) {
    if (i == 0) {
      locationItems[i].querySelector(".inputDirectionsLocations").placeholder = "D'où partez-vous ?";
    }
    else if (i == lastIndex) {
      locationItems[i].querySelector(".inputDirectionsLocations").placeholder = "Où allez-vous ?";
    } else {
      locationItems[i].querySelector(".inputDirectionsLocations").placeholder = "Par où passez-vous ?";
    }
  }
  let itemToAppend;
  let itemToRemoveDeleteButton;
  // Détection d'à quelle div retirer le bouton de suppression, et d'à laquelle l'ajouter
  if (evt.oldDraggableIndex == lastIndex || evt.oldDraggableIndex == 0) {
    itemToAppend = evt.item;
    let index = 0;
    if (evt.oldDraggableIndex == lastIndex) {
      index = lastIndex;
    }
    itemToRemoveDeleteButton = locationItems[index];
    if (evt.newDraggableIndex == 0) {
      itemToAppend = locationItems[1];
      itemToRemoveDeleteButton = locationItems[lastIndex];
    }
    if (evt.newDraggableIndex == 6) {
      itemToAppend = locationItems[lastIndex - 1];
      itemToRemoveDeleteButton = locationItems[0];
    }
  } else if (evt.newDraggableIndex == lastIndex || evt.newDraggableIndex == 0) {
    itemToRemoveDeleteButton = evt.item;
    let index = 1;
    if (evt.newDraggableIndex == lastIndex) {
      index = lastIndex - 1;
    }
    itemToAppend = locationItems[index];
  } else {
    return;
  }
  // Ajout et retrait du bouton de suppression
  var labelRemoveMiddle = document.createElement("label");
  var removeBtnIndex = itemToAppend.id.split("_")[1];
  labelRemoveMiddle.id = "directionsLocationRemoveImg_step_" + removeBtnIndex;
  labelRemoveMiddle.className = "lblDirectionsLocations lblDirectionsLocationsRemoveImg";
  labelRemoveMiddle.addEventListener("click", function (e) {
    e.target.parentNode.classList.add("hidden");
    var index = e.target.id.substring(e.target.id.lastIndexOf("_") + 1);
    if (index === "start") {
      var div = document.getElementById("directionsLocation_start");
    } else if (index === "end") {
      var div = document.getElementById("directionsLocation_end");
    } else {
      var div = document.getElementById("directionsLocation_step_" + index);
    }
    if (div) {
      div.value = "";
      div.dataset.coordinates = "";
    }
    var divAddStep = document.querySelector(".divDirectionsLocationsAddStep");
    divAddStep.classList.remove("hidden");
  });
  itemToAppend.appendChild(labelRemoveMiddle);
  const deleteButton = itemToRemoveDeleteButton.querySelector(".lblDirectionsLocationsRemoveImg");
  if (deleteButton) {
    itemToRemoveDeleteButton.removeChild(deleteButton);
  }
  let hiddenCountBefore = 0;
  for (let i = lastIndex; i >= 0; i--) {
    if (locationItems[i].classList.contains("hidden")) {
      hiddenCountBefore++
    }
    locationItems[i].style.transition = "unset";
    setTimeout(() => { locationItems[i].style.removeProperty("transition") }, 100)
  }
  locationItems[lastIndex].classList.remove("hidden");
  locationItems[0].classList.remove("hidden");
  let hiddenCountNow = 0;
  for (let i = lastIndex; i >= 0; i--) {
    if (locationItems[i].classList.contains("hidden")) {
      hiddenCountNow++
    }
  }
  if (hiddenCountBefore > hiddenCountNow) {
    for (let i = lastIndex - 1; i > 0; i--) {
      if (!locationItems[i].classList.contains("hidden")) {
        locationItems[i].classList.add("hidden");
        const value = locationItems[i].querySelector(".inputDirectionsLocations").value;
        const coords = locationItems[i].querySelector(".inputDirectionsLocations").dataset.coordinates;
        if (value) {
          locationItems[i].querySelector(".inputDirectionsLocations").value = "";
          delete locationItems[i].querySelector(".inputDirectionsLocations").dataset.coordinates;
          const lastNotHiddenLoc = [...locationItems].filter((elem) => {
            return !elem.classList.contains("hidden") && !elem.querySelector(".inputDirectionsLocations").value;
          }).splice(-1)[0];
          lastNotHiddenLoc.querySelector(".inputDirectionsLocations").value = value;
          lastNotHiddenLoc.querySelector(".inputDirectionsLocations").dataset.coordinates = coords;
        }
        break;
      }
    }
  }
}

export default sortableCallback;