import { create } from 'zustand';
import { FetchManifest } from '../utils/pwa.utils';
import type { WebSpatialSDKSignature } from '../../types/bridge';
import type { WebManifest } from '../../types/pwa';

interface PWAState {
  manifest: WebManifest|null;
  webSpatialSDKSignature: WebSpatialSDKSignature | null;
  loadManifest: (url: string) => Promise<void>; 
  setSpatialSDKSignature: (signature: WebSpatialSDKSignature | null) => void;
}

export const usePWAStore = create<PWAState>((set) => ({
  manifest: null,
  webSpatialSDKSignature: null,
  loadManifest : async (url: string) => {
    const manifest = await FetchManifest(url);
    set({ manifest });  
  },
  setSpatialSDKSignature : (signature: WebSpatialSDKSignature | null) => {
    set({ webSpatialSDKSignature: signature });
  }
}));