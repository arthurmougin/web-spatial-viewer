import { use } from "react";
import type { IBridgeInitData, IBridgeMessage } from "../../types/bridge";
import { usePWAStore } from "../store/pwa.store";

export class BridgeReceiver {
  iframes: HTMLIFrameElement[] = [];
  private static instance: BridgeReceiver;

  private constructor() {
    console.log("BridgeReceiver initialized");
    window.onmessage = this.messageListener.bind(this);
  }

  public static getInstance(): BridgeReceiver {
    if (!BridgeReceiver.instance) {
      BridgeReceiver.instance = new BridgeReceiver();
    }
    return BridgeReceiver.instance;
  }

  private messageListener(event: MessageEvent): void {
    console.log("Message received in BridgeReceiver:", event);
    // Handle different message types here

    if (event.data && event.data.type) {
      switch (event.data.type) {
        case "INIT": {
          console.log("INIT message received with data:", event.data.data);
          const data = (event.data as IBridgeInitData).data;
          usePWAStore.getState().setSpatialSDKSignature(data.sdkSignature);
          if( data.manifestUrl) 
            usePWAStore.getState().loadManifest(data.manifestUrl );
          break;
        }
        case "NETWORK_IDLE": {
          console.log("NETWORK_IDLE message received");
          // Handle network idle event if needed
          break;
        }
        default:
          console.warn("Unknown message type received:", event.data.type);
      }
    } else {
      console.warn("Received message without type:", event.data);
    }
  }

  // Méthodes publiques pour interagir avec le viewer
  public sendToViewer(data: IBridgeMessage): void {
    window.parent.postMessage({...data}, "*");
  }

  addIframe(iframe: HTMLIFrameElement): void {
    this.iframes.push(iframe);
  }

  removeIframe(iframe: HTMLIFrameElement): void {
    this.iframes = this.iframes.filter((frame) => frame !== iframe);
  }
}
