const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("spike", {
  transcribe: (pcm, modelName, useGpu) => ipcRenderer.invoke("transcribe", pcm, modelName, useGpu),
});
