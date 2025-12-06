import type {
  BridgeMessageType,
  IBridgeIDAttributionData,
  IBridgeInitData,
  IBridgeMessage,
  WebSpatialSDKSignature,
} from "../../types/bridge";

declare global {
  interface Window {
    SpatialViewerBridge: SpatialViewerBridge;
    __webspatialsdk__?: WebSpatialSDKSignature;
  }
}

export class SpatialViewerBridge {
  private static instance: SpatialViewerBridge;
  private id: string | null = null;

  private constructor() {
    console.log("bonjour from SpatialViewerBridge", window);
    window.onmessage = this.receiveMessage.bind(this);
    this.initialConversation();
  }

  public static getInstance(): SpatialViewerBridge {
    if (!SpatialViewerBridge.instance) {
      SpatialViewerBridge.instance = new SpatialViewerBridge();
    }
    return SpatialViewerBridge.instance;
  }

  private initialConversation() {
    const nextLink = document.querySelector(
      'link[rel="manifest"]'
    ) as HTMLLinkElement;
    const manifestUrl = nextLink ? nextLink.href : null;
    const sdkSignature = window.__webspatialsdk__ || null;

    const initMessage: IBridgeInitData = {
      type: "INIT" as BridgeMessageType.INIT,
      originHref: window.location.href,
      data: {
        manifestUrl,
        sdkSignature,
      },
    };
    this.sendToViewer(initMessage);

    //listen to network idle before sending NETWORK_IDLE message
    window.addEventListener("load", () => {
      console.log("Page fully loaded, sending NETWORK_IDLE message");
      const networkIdleMessage = {
        type: "NETWORK_IDLE" as BridgeMessageType.NETWORK_IDLE,
        data: null,
      };
      this.sendToViewer(networkIdleMessage);
    });
  }

  public sendToViewer(data: Omit<IBridgeMessage, "id">): void {
    if (this.id != null) {
      (data as IBridgeMessage).id = this.id;
    }
    window.top!.postMessage({ ...data }, "*");
  }

  private receiveMessage(event: MessageEvent): void {
    if (!event.data || !event.data.type) {
      //Not a message we care about
      return;
    }

    // HANDLE HANDSHAKE
    if (event.data.type === "ID_ATTRIBUTION") {
      const data = event.data as IBridgeIDAttributionData;
      this.id = data.data.id;
      console.log("ID_ATTRIBUTION received, assigned id:", this.id);
      return;
    }

    //END OF HANDSHAKE ZONE
    //All messages after this point require an assigned id
    if (this.id == null) {
      console.warn(
        "Received message before ID_ATTRIBUTION. Message ignored.",
        event.data
      );
      return;
    }
    if (event.data.id !== this.id) {
      //Message not for us
      return;
    }

    // Handle other messages
  }
}

// Auto-initialisation
window.SpatialViewerBridge = SpatialViewerBridge.getInstance();
