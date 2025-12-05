import { create } from 'zustand';
import { proxyFyUrl } from '../utils/pwa.utils';

interface PWAState {
  manifest: Partial<WebManifest>|null;
  pages : URL[];
  loadURL: (url: string) => Promise<void>;
}

export const usePWAStore = create<PWAState>((set) => ({
  manifest: null,
  pages : [],
  loadURL : async (url: string) => {
    const proxiedUrl = proxyFyUrl(url);
    set({ pages: [proxiedUrl] });
  }
}));