/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import { Network } from "@capacitor/network";

import PopupUtils from "./utils/popup-utils";
import ActionSheet from "./action-sheet";
import domUtils from "./utils/dom-utils";

import OnboardingConfig from "./onboarding-config.json";

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

function getGpfStatusPopup (map) {
  fetch("https://ignf.github.io/cartes-ign-services-uptime/cartes-ign-status-TEST.json?v=0").then(res => res.json()).then( (res) => {
    let msgDiv = null;
    let serviceList = null;
    for (const [key, value] of Object.entries(res)) {
      if (value.up) {
        continue;
      }
      if (!msgDiv) {
        msgDiv = document.createElement("div");
        const titleDiv = document.createElement("div");
        titleDiv.classList.add("divPositionTitle");
        titleDiv.innerText = "Fonctionnalités indisponibles";
        msgDiv.appendChild(titleDiv);

        const contentDiv = document.createElement("div");
        contentDiv.classList.add("divPopupContent");
        msgDiv.appendChild(contentDiv);

        const intro = document.createElement("p");
        intro.innerText = "Du fait d'une indisponibilité de la plateforme sur laquelle l'application se base, les fonctionnalités suivantes peuvent rencontrer des problèmes ou être indisponibles :";
        contentDiv.appendChild(intro);

        serviceList = document.createElement("ul");
        contentDiv.appendChild(serviceList);
      }
      const li = document.createElement("li");
      const date = new Date(0);
      date.setUTCSeconds(value.since);
      let sinceText = "";
      if (value.since !== 0) {
        sinceText = `(depuis le ${date.toLocaleString("fr-FR", {month: "numeric", day: "numeric", hour: "2-digit", minute:"2-digit"})})`;
      }
      const element = `
        <span class="gpfServiceName">${key}</span> ${sinceText}
      `;
      li.innerHTML = element;
      serviceList.appendChild(li);
    }
    if (msgDiv) {
      PopupUtils.showGpfStatusPopup(`
      <div id="editoPopup">
        <div class="divPopupClose" onclick="onClosegpfStatusPopup(event)"></div>
        <div>${msgDiv.innerHTML}</div>
      </div>
      `
      , map);
    }

  }).catch((err) => {
    console.warn("Could not load gpf status");
    console.warn(err);
  });
}

function getOnboardingModal(id = null, html = null) {
  if (
    id === null && localStorage.getItem("lastOnboardId") !== null && localStorage.getItem("lastOnboardId") === `${OnboardingConfig.id}`
    && localStorage.getItem("dontShowOnboardAgain") === "true"
  ) {
    return;
  }

  if (
    id && localStorage.getItem("lastOnboardEventId") !== null && localStorage.getItem("lastOnboardEventId") === id
    && localStorage.getItem("dontShowOnboardEventAgain") === "true")
  {
    return;
  }

  if (id && html) {
    const onboardingDom = domUtils.stringToHTML(html);
    onboardingDom.querySelector("#onBoardingConfirm").addEventListener("click", () => {
      ActionSheet._closeElem.click();
    });
    ActionSheet.show({
      style: "custom",
      content: onboardingDom,
    });

    localStorage.setItem("lastOnboardEventId", id);
    localStorage.setItem("dontShowOnboardEventAgain", "true");
  } else {
    const onboardingDom = domUtils.stringToHTML(OnboardingConfig.html);
    onboardingDom.querySelector("#onBoardingConfirm").addEventListener("click", () => {
      ActionSheet._closeElem.click();
    });
    ActionSheet.show({
      style: "custom",
      content: onboardingDom,
    });

    localStorage.setItem("lastOnboardId", OnboardingConfig.id);
    localStorage.setItem("dontShowOnboardAgain", "true");
  }
}

export default {
  getNetworkPopup,
  getEditoPopup,
  getOnboardingModal,
  getGpfStatusPopup,
};
