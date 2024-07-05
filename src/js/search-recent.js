/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import DOM from "./dom";

var className = "recentresult";

const addEntry = (value) => {
  var el = document.createElement("p");
  el.className = className;
  if (value.isOsm) {
    el.classList.add("poiOsm");
  }
  el.setAttribute("fulltext", value.text);
  el.dataset.coordinates = "{\"lon\":" + value.coordinates.lon + ",\"lat\":" + value.coordinates.lat + "}";
  var splitedText = value.text.split(",");
  var city = "";
  if (splitedText.length > 1) {
    city = splitedText[1].trim();
  }
  el.innerHTML = `${splitedText[0]}<br/>
    <em class='autocompcity'>${city}</em>`;
  try {
    DOM.$resultsRechRecent.insertBefore(el, DOM.$resultsRechRecent.firstElementChild.nextSibling);
  } catch(error) {
    console.error(error);
  }
};

const addEntries = (values) => {
  for (let index = 0; index < values.length; index++) {
    addEntry(values[index]);
  }
};

const removeEntry = (text) => {
  var entries = document.getElementsByClassName(className);
  for (let index = 0; index < entries.length; index++) {
    const element = entries[index];
    if (element.getAttribute("fulltext") === text) {
      element.remove();
    }
  }
};

/**
 * Affichage de la liste des recherches recentes stockées
 * dans le localStorage (5 entrées max) dans l'outil de recherche.
 */
let RecentSearch = {
  /**
     * clef du localStorage
     */
  key : "lastRecentSearches",

  /**
     * creation de la liste complète des recherches recentes
     * @returns {null}
     */
  create () {
    try {
      if (!localStorage.getItem(this.key)) {
        localStorage.setItem(this.key, "[]");
      }
      var values = JSON.parse(localStorage.getItem(this.key));

      addEntries(values);

    } catch {
      // exception silencieuse
      return;
    }
  },

  /**
     * ajout d'une entrée dans la liste des recherches recentes
     * @param {*} value
     * @returns {null}
     */
  add (value) {
    try {
      if (!localStorage.getItem(this.key)) {
        localStorage.setItem(this.key, "[]");
      }
      var storeSearches = JSON.parse(localStorage.getItem(this.key));
      var texts = storeSearches.map(search => search.text);
      // Change l'odre pour avoir le plus récent en haut
      if (texts.includes(value.text)) {
        var index = texts.indexOf(value.text);
        removeEntry(storeSearches[index].text);
        storeSearches.splice(index, 1);
      }

      if (storeSearches.length > 3) {
        removeEntry(storeSearches[0].text);
        storeSearches.shift();
      }
      storeSearches.push(value);
      localStorage.setItem(this.key, JSON.stringify(storeSearches));
      addEntry(value);
    } catch {
      // exception silencieuse
      return;
    }
  }
};

export default RecentSearch;
