import type { BridgeMessageType,IBridgeInitData, IBridgeMessage, WebSpatialSDKSignature } from "../../types/bridge";

declare global {
  interface Window {
    SpatialViewerBridge: SpatialViewerBridge;
    __webspatialsdk__?: WebSpatialSDKSignature;
  }
}

export class SpatialViewerBridge {
  private static instance: SpatialViewerBridge;

  private constructor() {
    console.log("bonjour");
    window.onmessage = this.receiveMessage.bind(this);
    this.initialConversation();
  }

  public static getInstance(): SpatialViewerBridge {
    if (!SpatialViewerBridge.instance) {
      SpatialViewerBridge.instance = new SpatialViewerBridge();
    }
    return SpatialViewerBridge.instance;
  }

  private initialConversation(){
    const nextLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    const manifestUrl = nextLink ? nextLink.href : null;
    const sdkSignature = window.__webspatialsdk__ || null;

    const initMessage: IBridgeInitData = {
      type: "INIT" as BridgeMessageType.INIT,
      data: {
        manifestUrl,
        sdkSignature,
      },
    };
    this.sendToViewer(initMessage);

    //listen to network idle before sending NETWORK_IDLE message
    window.addEventListener('load', () => {
      console.log("Page fully loaded, sending NETWORK_IDLE message");
      const networkIdleMessage: IBridgeMessage = {
        type: "NETWORK_IDLE" as BridgeMessageType.NETWORK_IDLE,
        data: null,
      };
      this.sendToViewer(networkIdleMessage);
    });
  }

  public sendToViewer(data:IBridgeMessage): void {
    window.top!.postMessage({...data}, "*");
  }

  private receiveMessage(event: MessageEvent): void {
      console.log("Message received in SpatialViewerBridge:", event);
    }
}

// Auto-initialisation
window.SpatialViewerBridge = SpatialViewerBridge.getInstance();
