import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ping: (host: string) => ipcRenderer.invoke('ping', host),
  checkPort: (host: string, port: number) => ipcRenderer.invoke('check-port', host, port),
  traceroute: (host: string) => ipcRenderer.invoke('traceroute', host)
});