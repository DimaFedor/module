"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// electron/preload.ts
var preload_exports = {};
module.exports = __toCommonJS(preload_exports);
var import_electron = require("electron");
var api = {
  openEvidenceFile: () => import_electron.ipcRenderer.invoke("evidence:openFile"),
  evidenceList: (req) => import_electron.ipcRenderer.invoke("evidence:list", req),
  evidenceGet: (id) => import_electron.ipcRenderer.invoke("evidence:get", id),
  evidenceCreate: (payload) => import_electron.ipcRenderer.invoke("evidence:create", payload),
  evidenceUpdate: (id, payload) => import_electron.ipcRenderer.invoke("evidence:update", id, payload),
  evidenceDelete: (id) => import_electron.ipcRenderer.invoke("evidence:delete", id),
  evidenceUndoDelete: () => import_electron.ipcRenderer.invoke("evidence:undoDelete"),
  auditLogList: () => import_electron.ipcRenderer.invoke("audit:list"),
  exportCreate: (filters) => import_electron.ipcRenderer.invoke("export:create", filters),
  themeGetSystem: () => import_electron.ipcRenderer.invoke("theme:get-system")
};
import_electron.contextBridge.exposeInMainWorld("electronApi", api);
//# sourceMappingURL=preload.js.map