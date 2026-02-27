import type { ElectronApi } from './ipc';

declare global {
  interface Window {
    electronApi: ElectronApi;
  }
}

export {};

