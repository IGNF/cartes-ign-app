/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

let enabled = false;

export function initAnalytics(url, siteId) {
  enabled = Boolean(url && siteId);
  if (!enabled) {
    return;
  }
  url = url.endsWith("/") ? url : url + "/";

  window._paq = window._paq || [];
  window._paq.push(["trackPageView"]);
  window._paq.push(["enableLinkTracking"]);
  window._paq.push(["setTrackerUrl", url + "matomo.php"]);
  window._paq.push(["setSiteId", siteId]);

  const script = document.createElement("script");
  script.async = true;
  script.src = url + "matomo.js";
  document.head.appendChild(script);
}

export function trackEvent(category, action, name) {
  if (enabled) {
    window._paq.push(["trackEvent", category, action, name]);
  }
}

export function trackPage(state, title) {
  if (enabled) {
    window._paq.push(["setCustomUrl", "/" + encodeURIComponent(state)]);
    window._paq.push(["setDocumentTitle", title]);
    window._paq.push(["trackPageView"]);
  }
}
