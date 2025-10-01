/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import { config } from "./utils/config-utils";

/**
 * Générateur de fil d'actualités
 * @module NewsFeed
 */
class NewsFeed {

  _target = document.querySelector("#newsfeedWindow .newsfeedContent");

  constructor() {
    this.generated = false;
    return this;
  }

  generate() {
    if (config.newsfeed.length === 0) {
      return;
    }

    config.newsfeed.forEach( (news) => {
      const newsElem = document.createElement("div");
      newsElem.classList.add("newsfeedItem");
      newsElem.setAttribute("tabindex", "0");

      const imgElem = document.createElement("img");
      imgElem.classList.add("newsfeedItemImg");
      imgElem.setAttribute("alt", news.title);
      imgElem.setAttribute("src", news.image);
      newsElem.appendChild(imgElem);

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
