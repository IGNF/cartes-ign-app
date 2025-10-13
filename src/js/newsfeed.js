/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Globals from "./globals";

import { Share } from "@capacitor/share";

import { config } from "./utils/config-utils";
import fileUtils from "./utils/file-utils";

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

    config.newsfeed.forEach( (news) => {
      const newsElem = document.createElement("div");
      newsElem.classList.add("newsfeedItem");
      newsElem.id = "newsfeedItem-" + news.id;
      newsElem.setAttribute("tabindex", "0");

      const imgElem = document.createElement("img");
      imgElem.classList.add("newsfeedItemImg");
      imgElem.setAttribute("title", news.title);
      imgElem.setAttribute("src", news.image);
      newsElem.appendChild(imgElem);

      imgElem.addEventListener("click", () => {
        Globals.backButtonState = "imageOverlay";
        const overlayimage = this._overlay.querySelector("#imgOverlayImage");
        overlayimage.src = news.image;
        overlayimage.title = news.title;
        overlayimage.addEventListener("click", () => {
          overlayimage.classList.toggle("zoomed");
        });
        this._overlay.classList.remove("d-none");
      });

      const textContainer = document.createElement("div");
      textContainer.classList.add("newsfeedItemTextContainer");

      const titleElem = document.createElement("p");
      titleElem.classList.add("newsfeedItemTitle");
      titleElem.innerText = news.title;
      textContainer.appendChild(titleElem);

      const contentElem = document.createElement("p");
      contentElem.classList.add("newsfeedItemContent");
      contentElem.innerText = news.content;
      textContainer.appendChild(contentElem);

      const linkElem = document.createElement("a");
      linkElem.classList.add("newsfeedItemLink");
      linkElem.setAttribute("href", news.link);
      linkElem.setAttribute("target", "_blank");
      linkElem.innerText = "En savoir plus";
      textContainer.appendChild(linkElem);

      const shareElem = document.createElement("div");
      shareElem.classList.add("newsfeedShareBtn");
      shareElem.title = "Partager";
      shareElem.addEventListener("click", () => {
        let cachedFileUri;
        fileUtils.cacheImageFromUrl(news.image).then( (uri) => {
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
      textContainer.appendChild(shareElem);

      newsElem.appendChild(textContainer);

      this._target.appendChild(newsElem);

      const separator = document.createElement("hr");
      separator.classList.add("newsfeedItemSeparator");
      this._target.appendChild(separator);
    });

    this.generated = true;
  }


}

// singleton
const newsFeed = new NewsFeed();

export default newsFeed;
