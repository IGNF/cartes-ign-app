import { Network } from "@capacitor/network";

import PopupUtils from "./utils/popup-utils";

function getNetworkPopup(map) {
  Network.getStatus().then((status) => {
    if (!status.connected) {
      PopupUtils.showOnlinePopup(`
      <div id="onlinePopup">
      <div class="divPositionTitle">Vous êtes hors ligne</div>
      <div class="divPopupClose" onclick="onCloseonlinePopup(event)"></div>
      <div class="divPopupContent">
      La plupart des fonctionnalités de l'application sont indisponibles. Vous pouvez consulter les cartes et données déjà chargées, ainsi que les données enregistrées, et visualiser votre position sur la carte.
      </div>
      </div>
      `, map);
    }
  });
}

function getEditoPopup (map) {
  fetch("https://ignf.github.io/cartes-ign-services-uptime/edito.json?v=0").then(res => res.json()).then( (res) => {
    if (
      localStorage.getItem("lastEditoPopupId") !== null && localStorage.getItem("lastEditoPopupId") === `${res.id}`
      && localStorage.getItem("dontShowEditoAgain") === "true"
      && !res.force
    ) {
      return;
    }
    if (res.message === "") {
      return;
    }
    let dontShowCheckBox = "";
    if (!res.force) {
      window.onChkEditoChange = (event) => {
        if (event.target.checked) {
          localStorage.setItem("dontShowEditoAgain", "true");
        } else {
          localStorage.setItem("dontShowEditoAgain", "false");
        }
      };
      dontShowCheckBox = `
      <p style="margin-bottom: 0px"><label class="chkContainer" for="dontShowEditoAgain" title="Ne plus afficher ce message">
      Ne plus afficher ce message
      <input id="dontShowEditoAgain"
          class="checkbox"
          type="checkbox"
          onchange="onChkEditoChange(event)"
      >
      <span class="checkmark"></span>
      </label></p>
      `;

    }
    PopupUtils.showEditoPopup(`
    <div id="editoPopup">
      <div class="divPopupClose" onclick="onCloseeditoPopup(event)"></div>
      ${res.message}
      ${dontShowCheckBox}
    </div>
    `
    , map);
    localStorage.setItem("lastEditoPopupId", res.id);
  }).catch((err) => {
    console.warn("Could not load edito message");
    console.warn(err);
  });
}

export default {
  getNetworkPopup,
  getEditoPopup,
};
