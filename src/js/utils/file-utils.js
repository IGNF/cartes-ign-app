/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import { Filesystem, Directory } from "@capacitor/filesystem";

/**
 * Downloads an image and saves it to cache
 * @param {string} imageUrl
 * @returns {Promise<string>} The URI of the cached file
 */
async function cacheImageFromUrl(imageUrl) {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const base64Data = btoa(
    new Uint8Array(arrayBuffer)
      .reduce((data, byte) => data + String.fromCharCode(byte), "")
  );

  const fileName = `shared-${Date.now()}.jpg`;

  const savedFile = await Filesystem.writeFile({
    path: fileName,
    data: base64Data,
    directory: Directory.Cache,
  });

  return savedFile.uri;
}

/**
 *  Deletes a cached file from its URI
 * @param {string} fileUri
 * @returns {Promise<void>}
 */
async function deleteCachedFile(fileUri) {
  try {
    const fileName = fileUri.split("/").pop();
    if (!fileName) return;

    await Filesystem.deleteFile({
      path: fileName,
      directory: Directory.Cache,
    });
  } catch (err) {
    console.warn("Error cleaning up cache: ", err);
  }
}

export default {
  cacheImageFromUrl,
  deleteCachedFile,
};
