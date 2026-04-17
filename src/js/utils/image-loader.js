/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

/**
 * Loads all images from a folder and adds them to the map sprite
 * @param {maplibregl.Map} map - The map instance
 * @param {Function} requireContext - The webpack require.context function
 * @param {Object} options - Options for image loading
 * @param {string} options.imageNamePrefix - Optional prefix to add to image names (default: empty string)
 * @param {Array<string>} options.fileExtensions - File extensions to load (default: ['.png', '.svg'])
 * @returns {Promise<void>} - Resolves when all images are loaded
 */
export async function loadImagesFromFolder(map, requireContext, options = {}) {
  const {
    imageNamePrefix = "",
    fileExtensions = [".png"]
  } = options;

  const keys = requireContext.keys();
  const promises = [];

  for (const key of keys) {
    // Check if the file has a supported extension
    const hasValidExtension = fileExtensions.some(ext => key.endsWith(ext));
    if (!hasValidExtension) continue;

    // Extract the filename without extension
    const filename = key.split("/").pop().split(".")[0];
    const imageName = imageNamePrefix ? `${imageNamePrefix}-${filename}` : filename;
    const imageUrl = requireContext(key);

    // Load and add the image to the map
    const promise = map.loadImage(imageUrl).then((image) => {
      map.addImage(imageName, image.data);
    }).catch((err) => {
      console.warn(`Failed to load image "${imageName}":`, err);
    });

    promises.push(promise);
  }

  await Promise.all(promises);
}
