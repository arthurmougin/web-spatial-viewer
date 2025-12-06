import { create } from 'zustand';
import { FetchManifest, proxyFyUrl } from '../utils/pwa.utils';
import type { WebSpatialSDKSignature } from '../../types/bridge';

interface PWAState {
  manifest: Partial<WebManifest>|null;
  pages : URL[];
  webSpatialSDKSignature: WebSpatialSDKSignature | null;
  loadURL: (url: string) => Promise<void>;
  loadManifest: (url: string) => Promise<void>; 
  setSpatialSDKSignature: (signature: WebSpatialSDKSignature | null) => void;
}

export const usePWAStore = create<PWAState>((set) => ({
  manifest: null,
  pages : [],
  webSpatialSDKSignature: null,
  loadURL : async (url: string) => {
    const proxiedUrl = proxyFyUrl(url);
    set({ pages: [proxiedUrl] });
  },
  loadManifest : async (url: string) => {
    const manifest = await FetchManifest(url);
    set({ manifest });  
  },
  setSpatialSDKSignature : (signature: WebSpatialSDKSignature | null) => {
    set({ webSpatialSDKSignature: signature });
  }
}));