/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Globals from "./globals";

import { Share } from "@capacitor/share";

import { config } from "./utils/config-utils";
import fileUtils from "./utils/file-utils";
import DomUtils from "./utils/dom-utils";

/**
 * Générateur de fil d'actualités
 * @module NewsFeed
 */
class NewsFeed {

  _target = document.querySelector("#newsfeedWindow .newsfeedContent");
  _overlay = document.getElementsByTagName("img-overlay")[0];

  constructor() {
    this.generated = false;
    this._overlay.querySelector("#imgOverlayClose").addEventListener("click", () => {
      this._overlay.classList.add("d-none");
      Globals.backButtonState = "newsfeed";
    });

    return this;
  }

  generate() {
    if (config.newsfeed.length === 0) {
      return;
    }

    for (let i = config.newsfeed.length - 1; i >= 0; i--) {
      const news = config.newsfeed[i];
      news.id = i;
      const newsElem = document.createElement("div");
      newsElem.classList.add("newsfeedItem");
      newsElem.id = "newsfeedItem-" + news.id;
      newsElem.setAttribute("tabindex", "0");

      if (news.images) {
        const imageContainer = document.createElement("div");
        imageContainer.classList.add("newsfeedItemImageContainer");
        newsElem.appendChild(imageContainer);
        if (news.images.length > 1) {
          imageContainer.classList.add("carrousel");
          const beforeElem = document.createElement("div");
          beforeElem.classList.add("newsFeedImagesBefore");
          imageContainer.appendChild(beforeElem);
          beforeElem.appendChild(document.createElement("div"));
          beforeElem.addEventListener("click", (event) => {DomUtils.horizontalParentScrollLeft(event, 0.85);});
        }
        news.images.forEach( (imageSrc) => {
          const imgElem = document.createElement("img");
          imgElem.classList.add("newsfeedItemImg");
          imgElem.setAttribute("title", news.title);
          imgElem.setAttribute("src", imageSrc);
          imageContainer.appendChild(imgElem);

          imgElem.addEventListener("click", () => {
            Globals.backButtonState = "imageOverlay";
            const overlayimage = this._overlay.querySelector("#imgOverlayImage");
            overlayimage.src = imageSrc;
            overlayimage.title = news.title;
            overlayimage.addEventListener("click", () => {
              overlayimage.classList.toggle("zoomed");
            });
            const overlayShareBtn = this._overlay.querySelector("#imgOverlayShareBtn");
            overlayShareBtn.onclick = () => {
              let cachedFileUri;
              fileUtils.cacheImageFromUrl(imageSrc).then( (uri) => {
                cachedFileUri = uri;
                Share.share({
                  title: `${news.title}`,
                  text: `Ouvre la carte « ${news.title} » dans l'application Cartes IGN : https://cartes-ign.ign.fr?newsid=${news.id}`,
                  url: uri,
                  dialogTitle: "Partager l'image",
                }).finally( () => {
                  if (cachedFileUri) {
                    fileUtils.deleteCachedFile(cachedFileUri);
                  }
                });
              });
            };
            this._overlay.classList.remove("d-none");
          });
        });
        if (news.images.length > 1) {
          const afterElem = document.createElement("div");
          afterElem.classList.add("newsFeedImagesAfter");
          imageContainer.appendChild(afterElem);
          afterElem.appendChild(document.createElement("div"));
          afterElem.addEventListener("click", (event) => {DomUtils.horizontalParentScroll(event, 0.85);});
        }
      }

      const textContainer = document.createElement("div");
      textContainer.classList.add("newsfeedItemTextContainer");

      const titleContainer = document.createElement("div");
      titleContainer.classList.add("newsfeedItemTitleContainer");
      const titleElem = document.createElement("p");
      titleElem.classList.add("newsfeedItemTitle");
      titleElem.innerText = news.title;
      titleContainer.appendChild(titleElem);
      const shareElem = document.createElement("div");
      shareElem.classList.add("newsfeedShareBtn");
      shareElem.title = "Partager";
      shareElem.addEventListener("click", () => {
        let cachedFileUri;
        fileUtils.cacheImageFromUrl(news.images[0]).then( (uri) => {
          cachedFileUri = uri;
          Share.share({
            title: `${news.title}`,
            text: `Ouvre la carte « ${news.title} » dans l'application Cartes IGN : https://cartes-ign.ign.fr?newsid=${news.id}`,
            url: uri,
            dialogTitle: "Partager la carte",
          }).finally( () => {
            if (cachedFileUri) {
              fileUtils.deleteCachedFile(cachedFileUri);
            }
          });

        });
      });
      titleContainer.appendChild(shareElem);

      textContainer.appendChild(titleContainer);

      const dateElem = document.createElement("p");
      dateElem.classList.add("newsfeedItemDate");
      const dateString = new Date(Date.parse(news.date)).toLocaleString("fr-FR", { year: "numeric", month: "long" });
      dateElem.innerText = dateString.charAt(0).toUpperCase() + dateString.slice(1);
      textContainer.appendChild(dateElem);

      if (news.content) {
        const foldableInput = document.createElement("input");
        foldableInput.id = "foldableInput" + news.id;
        foldableInput.type = "checkbox";
        foldableInput.classList.add("d-none", "foldableInput");
        textContainer.appendChild(foldableInput);
      }

      const contentWrapper = document.createElement("div");
      contentWrapper.classList.add("foldable", "newsfeedItemContentWrapper");
      if (news.content) {
        const contentElem = document.createElement("p");
        contentElem.classList.add("newsfeedItemContent");
        contentElem.innerText = news.content;
        contentWrapper.appendChild(contentElem);
      }

      if (news.link) {
        const linkElem = document.createElement("a");
        linkElem.classList.add("newsfeedItemLink");
        linkElem.setAttribute("href", news.link);
        linkElem.setAttribute("target", "_blank");
        linkElem.innerText = "Lire l'article sur le site de l'IGN";
        contentWrapper.appendChild(linkElem);
      }
      textContainer.appendChild(contentWrapper);

      if (news.content) {
        const foldableLabel = document.createElement("label");
        foldableLabel.classList.add("foldableLabel");
        foldableLabel.setAttribute("for", "foldableInput" + news.id);
        foldableLabel.innerHTML = "&nbsp;Voir&nbsp;";
        textContainer.appendChild(foldableLabel);
      }

      newsElem.appendChild(textContainer);

      this._target.appendChild(newsElem);

      const separator = document.createElement("hr");
      separator.classList.add("newsfeedItemSeparator");
      this._target.appendChild(separator);
    }

    this.generated = true;
  }


}

// singleton
const newsFeed = new NewsFeed();

export default newsFeed;
