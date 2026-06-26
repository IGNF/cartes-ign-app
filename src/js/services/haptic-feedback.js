/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

const MIN_FEEDBACK_GAP_MS = 35;

const HAPTIC_HANDLED_PROP = "__cartesIgnHapticHandled";

const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "[role='button']",
  "input[type='button']",
  "input[type='submit']",
  "input[type='reset']",
  ".btn",
  ".clickable",
  ".navitem"
].join(", ");

let lastFeedbackTimestamp = 0;
let globalTapFeedbackBound = false;

const isNativeHapticsAvailable = () => {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Haptics");
};

const runHaptic = async (callback) => {
  if (!isNativeHapticsAvailable()) {
    return;
  }

  const now = Date.now();
  if (now - lastFeedbackTimestamp < MIN_FEEDBACK_GAP_MS) {
    return;
  }
  lastFeedbackTimestamp = now;

  try {
    await callback();
  } catch (e) {
    // Ignore haptic errors to keep UI interactions responsive.
  }
};

const markEventHandled = (event) => {
  if (event) {
    event[HAPTIC_HANDLED_PROP] = true;
  }
};

const wasEventHandled = (event) => {
  return Boolean(event && event[HAPTIC_HANDLED_PROP]);
};

const impact = async (style = ImpactStyle.Light) => {
  await runHaptic(() => Haptics.impact({ style }));
};

const notification = async (type = NotificationType.Success) => {
  await runHaptic(() => Haptics.notification({ type }));
};

const selectionChanged = async () => {
  await runHaptic(() => Haptics.selectionChanged());
};

const impactLight = (event) => {
  markEventHandled(event);
  return impact(ImpactStyle.Light);
};

const impactMedium = (event) => {
  markEventHandled(event);
  return impact(ImpactStyle.Medium);
};

const impactHeavy = (event) => {
  markEventHandled(event);
  return impact(ImpactStyle.Heavy);
};

const notifySuccess = (event) => {
  markEventHandled(event);
  return notification(NotificationType.Success);
};

const findInteractiveTarget = (event) => {
  if (!event) {
    return null;
  }

  if (event.composedPath) {
    for (const node of event.composedPath()) {
      if (node instanceof Element && node.matches(INTERACTIVE_SELECTOR)) {
        return node;
      }
    }
  }

  if (event.target instanceof Element) {
    return event.target.closest(INTERACTIVE_SELECTOR);
  }

  return null;
};

const isDisabled = (element) => {
  return element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true" || element.classList.contains("disabled");
};

const bindGlobalTapFeedback = () => {
  if (globalTapFeedbackBound || !isNativeHapticsAvailable()) {
    return;
  }

  document.addEventListener("click", (event) => {
    const element = findInteractiveTarget(event);

    if (!element) {
      return;
    }

    if (!event.isTrusted || event.defaultPrevented || wasEventHandled(event) || isDisabled(element) || element.closest("[data-haptic='off']")) {
      return;
    }

    impact(ImpactStyle.Light);
  });

  globalTapFeedbackBound = true;
};

export default {
  bindGlobalTapFeedback,
  markEventHandled,
  impactLight,
  impactMedium,
  impactHeavy,
  selectionChanged,
  notifySuccess,
};
