/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import { v4 as uuidv4 } from "uuid";

/**
 * FileStorage
 *
 * A unified class for storing and managing json objects across
 * Capacitor platforms. Uses the Filesystem plugin on native (iOS/Android)
 * and falls back to the Preferences API on Web.
 *
 * Each geometry is saved as a separate `.json` file inside a specified
 * application directory (default: `geometries/`).
 *
 * Supports full CRUD operations:
 * - Create (save)
 * - Read (load)
 * - Delete (remove individual)
 * - List (load all geometries)
 *
 * Works on both iOS and Android via Capacitor's sandboxed app storage.
 */
class FileStorage {
  /**
   * @param {string} [folderName='geometries'] - Folder name inside the app's data directory.
   */
  constructor(folderName = "geometries") {
    this.folder = folderName;
    this.isNative = Capacitor.isNativePlatform(); // true on iOS/Android
  }

  /**
   * Ensures the geometry folder exists, creating it if necessary.
   * Called automatically by other methods.
   * @returns {Promise<void>}
   * @private
   */
  async #ensureFolder() {
    if (!this.isNative) return;
    try {
      await Filesystem.mkdir({
        path: this.folder,
        directory: Directory.Data,
        recursive: true,
      });
    } catch (error) {
      if (error.message?.includes("exists")) return;
      console.error("[FileStorage] Error ensuring folder:", error);
    }
  }

  /**
   * Saves a json object to storage.
   * If `id` is not provided, a UUID is generated.
   *
   * @param {object} json - A json object (e.g. a route or a landmark (geojson feature)).
   * @param {string} [id] - Optional custom ID to use for the filename.
   * @returns {Promise<string>} The ID used to save the file.
   */
  async save(json, id) {
    const geometryId = id || uuidv4();

    if (!this.isNative) {
      // Web fallback: use Preferences
      try {
        await Preferences.set({
          key: `${this.folder}_${geometryId}`,
          value: JSON.stringify(json),
        });
        return geometryId;
      } catch (error) {
        console.error("[FileStorage] Error saving geometry (web):", error);
        throw error;
      }
    }

    await this.#ensureFolder();
    const filePath = `${this.folder}/${geometryId}.json`;
    try {
      await Filesystem.writeFile({
        path: filePath,
        data: JSON.stringify(json),
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      return geometryId;
    } catch (error) {
      console.error("[FileStorage] Error saving geometry:", error);
      throw error;
    }
  }

  /**
   * Loads a GeoJSON file from storage by its ID.
   *
   * @param {string} id - The geometry ID (filename without `.json`).
   * @returns {Promise<object|null>} The parsed json object, or null if not found.
   */
  async load(id) {
    if (!this.isNative) {
      const result = await Preferences.get({ key: `${this.folder}_${id}` });
      return result.value ? JSON.parse(result.value) : null;
    }
    try {
      const result = await Filesystem.readFile({
        path: `${this.folder}/${id}.json`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      return JSON.parse(result.data);
    } catch (error) {
      console.warn(`[FileStorage] Could not load geometry ${id}:`, error);
      return null;
    }
  }

  /**
   * Deletes a file from storage.
   *
   * @param {string} id - The json ID.
   * @returns {Promise<void>}
   */
  async delete(id) {
    if (!this.isNative) {
      await Preferences.remove({ key: `${this.folder}_${id}` });
    }
    try {
      await Filesystem.deleteFile({
        path: `${this.folder}/${id}.json`,
        directory: Directory.Data,
      });
    } catch (error) {
      console.error(`[FileStorage] Error deleting geometry ${id}:`, error);
    }
  }

  /**
   * Lists all stored obekcts.
   *
   * @returns {Promise<Array<{ id: string, data: object }>>}
   * An array of objects containing:
   * - `id`: The file ID (filename without `.json`).
   * - `data`: The parsed JSON object.
   */
  async list() {
    if (!this.isNative) {
      // Web fallback: list all Preferences keys (simulated folder)
      const allKeys = await this.#getAllWebKeys();
      const geometries = [];
      for (const key of allKeys) {
        if (!key.startsWith(`${this.folder}_`)) {
          continue;
        }
        const id = key.replace(`${this.folder}_`, "");
        const value = await Preferences.get({ key });
        if (value.value) {
          geometries.push({ id, data: JSON.parse(value.value) });
        }
      }
      return geometries;
    }
    await this.#ensureFolder();
    const geometries = [];
    try {
      const result = await Filesystem.readdir({
        path: this.folder,
        directory: Directory.Data,
      });

      for (const file of result.files) {
        if (!file.name.endsWith(".json")) {
          continue;
        }
        const id = file.name.replace(".json", "");
        const content = await this.load(id);
        if (content) {
          geometries.push({ id, data: content });
        }
      }
      return geometries;
    } catch (error) {
      console.error("[FileStorage] Error listing geometries:", error);
    }
    return geometries;
  }

  /**
   * (Web only) Returns all available keys from Preferences.
   * @private
   * @returns {Promise<string[]>}
   */
  async #getAllWebKeys() {
    try {
      const { keys } = await Preferences.keys();
      return keys;
    } catch (error) {
      console.error("[FileStorage] Error reading web keys:", error);
      return [];
    }
  }

}

const fileStorage = new FileStorage();
export default fileStorage;
