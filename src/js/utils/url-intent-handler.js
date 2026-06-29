/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import maplibregl from "maplibre-gl";
import { Toast } from "@capacitor/toast";

import Globals from "../globals";

const decodeSpaces = (value) => (value || "").replace(/%20/g, " ");

const sanitizeHtml = (value) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const getUrlScheme = (url) => {
  const match = url.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  return match ? match[1] : "";
};

const getCompareFeature = (urlParams, center, zoom) => ({
  type: "Feature",
  id: -1,
  geometry: {
    type: "Point",
    coordinates: [center.lng, center.lat],
  },
  properties: {
    accroche: decodeSpaces(urlParams.get("title")),
    theme: decodeSpaces(urlParams.get("title")),
    text: decodeSpaces(urlParams.get("text")),
    zoom: zoom,
    color: urlParams.get("color"),
    icon: `compare-landmark-${urlParams.get("color")}`,
    layer1: urlParams.get("l1"),
    layer2: urlParams.get("l2"),
    mode: urlParams.get("m"),
    visible: true,
  }
});

const handleMapPositionAction = (urlParams, map, center) => {
  map.once("moveend", () => {
    if (urlParams.get("layer")) {
      const id = urlParams.get("layer");
      let layerId = id;
      if (id.includes("$$$")) {
        layerId = id.split("$$$")[1];
      }
      if (map.getLayer(id)) {
        document.getElementById(layerId).click();
      }
      document.getElementById(layerId).click();
      map.once("idle", () => {
        const centerPoint = map.project(center);
        map.fire("click", { point: centerPoint, lngLat: center });
      });
    } else {
      const params = { lngLat: center };
      if (urlParams.get("titre")) {
        params.text = sanitizeHtml(urlParams.get("titre"));
        if (urlParams.get("description")) {
          params.html = `<p>${sanitizeHtml(urlParams.get("description"))}</p>`;
        }
      }
      Globals.position.compute(params).then(() => {
        Globals.menu.open("position");
      });
      if (Globals.searchResultMarker != null) {
        Globals.searchResultMarker.remove();
        Globals.searchResultMarker = null;
      }
      Globals.searchResultMarker = new maplibregl.Marker({element: Globals.searchResultIcon, anchor: "bottom"})
        .setLngLat(center)
        .addTo(map);
    }
  });
};

const handleHttpsUrl = ({ url, map, moveTo, resetState, canOpenNewsfeed }) => {
  const queryString = url.split("?")[1] || "";
  const urlParams = new URLSearchParams(queryString);
  if (urlParams.get("lng") && urlParams.get("lat")) {
    if (typeof resetState === "function") {
      resetState();
    }
    const center = { lng: parseFloat(urlParams.get("lng")), lat: parseFloat(urlParams.get("lat")) };
    const zoom = parseFloat(urlParams.get("z")) || map.getZoom();
    if (typeof moveTo === "function") {
      moveTo({ map, center, zoom });
    } else {
      map.flyTo({ zoom: zoom, center: center });
    }
    if (urlParams.get("l1") && urlParams.get("l2") && urlParams.get("m") && urlParams.get("title") && urlParams.get("color")) {
      Globals.myaccount.addCompareLandmark(getCompareFeature(urlParams, center, zoom));
      Toast.show({
        duration: "long",
        text: `Point de repère Comparer "${decodeSpaces(urlParams.get("title"))}" ajouté à 'Enregistrés' et à la carte`,
        position: "bottom",
      });
    } else {
      handleMapPositionAction(urlParams, map, center);
    }
    return true;
  }
  if (urlParams.get("newsid") && (typeof canOpenNewsfeed !== "function" || canOpenNewsfeed(urlParams.get("newsid")))) {
    Globals.menu.open("newsfeed");
    const element = document.getElementById("newsfeedItem-" + urlParams.get("newsid"));
    if (element) {
      setTimeout( () => {
        element.scrollIntoView(false, {
          behavior: "smooth",
        });
      }, 2000);
    }
    return true;
  }
  return false;
};

const handleGeoUrl = ({ url, map }) => {
  const payload = url.slice(url.indexOf(":") + 1);
  const [urlHost, urlParamsString] = payload.split("?");
  const urlParams = new URLSearchParams(urlParamsString || "");
  let [lat, lng] = (urlParams.get("q") || "").split(",").map(parseFloat);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    [lat, lng] = (urlHost || "").split(",").map(parseFloat);
  }
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const zoom = parseFloat(urlParams.get("z")) || map.getZoom();
    map.flyTo({zoom: zoom, center: { lng, lat }});
    return true;
  }
  return false;
};

export function handleIncomingUrl({
  url,
  map,
  moveTo,
  resetState,
  canOpenNewsfeed,
  allowGeo = false,
}) {
  if (!url || !map) {
    return false;
  }
  const urlScheme = getUrlScheme(url);
  if (urlScheme === "https") {
    return handleHttpsUrl({ url, map, moveTo, resetState, canOpenNewsfeed });
  }
  if (allowGeo && urlScheme === "geo") {
    return handleGeoUrl({ url, map });
  }
  return false;
}
