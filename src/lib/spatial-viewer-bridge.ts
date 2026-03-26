import type {
    BridgeMessageType,
    IBridgeIDAttributionData,
    IBridgeInitData,
    IBridgeMessage,
    IBridgeNavigateData,
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
  private id: number | null = null;

  private backLog: Omit<IBridgeMessage, "id">[] = [];

  private constructor() {
    console.log("bonjour from SpatialViewerBridge", window);
    window.onmessage = this.receiveMessage.bind(this);
    this.initialConversation();
    this.interceptNavigation();
    this.pageLoadListening();
  }

  public static getInstance(): SpatialViewerBridge {
    if (!SpatialViewerBridge.instance) {
      SpatialViewerBridge.instance = new SpatialViewerBridge();
    }
    return SpatialViewerBridge.instance;
  }

  private initialConversation() {
    const nextLink = document.querySelector(
      'link[rel="manifest"]',
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
    // We can't send events without an ID, so we backlog them until we get one
    if (this.id != null) {
      (data as IBridgeMessage).id = this.id;
    } else if (data.type !== "INIT") {
      this.backLog.push(data);
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

      //Send backlog messages
      this.backLog.forEach((message) => {
        this.sendToViewer(message);
      });
      this.backLog = [];

      return;
    }

    //END OF HANDSHAKE ZONE
    //All messages after this point require an assigned id
    if (this.id == null) {
      console.warn(
        "Received message before ID_ATTRIBUTION. Message ignored.",
        event.data,
      );
      return;
    }
    if (event.data.id !== this.id) {
      //Message not for us
      return;
    }

    // Handle other messages
    if (event.data.type === "GO_BACK") {
      history.back();
      return;
    }
    if (event.data.type === "GO_FORWARD") {
      history.forward();
      return;
    }
  }

  private interceptNavigation() {
    // Intercept history.pushState
    const originalPushState = history.pushState.bind(history);
    history.pushState = (
      state: unknown,
      title: string,
      url?: string | URL | null,
    ) => {
      originalPushState(state, title, url);
      const navigateMessage: Omit<IBridgeNavigateData, "id"> = {
        type: "NAVIGATE" as BridgeMessageType.NAVIGATE,
        data: { url: window.location.href, action: "push" },
      };
      this.sendToViewer(navigateMessage);
    };

    // Intercept history.replaceState
    const originalReplaceState = history.replaceState.bind(history);
    history.replaceState = (
      state: unknown,
      title: string,
      url?: string | URL | null,
    ) => {
      originalReplaceState(state, title, url);
      const navigateMessage: Omit<IBridgeNavigateData, "id"> = {
        type: "NAVIGATE" as BridgeMessageType.NAVIGATE,
        data: { url: window.location.href, action: "replace" },
      };
      this.sendToViewer(navigateMessage);
    };

    // Intercept browser back/forward (popstate)
    window.addEventListener("popstate", () => {
      const navigateMessage: Omit<IBridgeNavigateData, "id"> = {
        type: "NAVIGATE" as BridgeMessageType.NAVIGATE,
        data: { url: window.location.href, action: "pop" },
      };
      this.sendToViewer(navigateMessage);
    });
  }

  private pageLoadListening() {
    // Placeholder for future page lifecycle forwarding (LOG, ERROR, NAVIGATE).
    // Nothing is sent to the viewer yet.
  }
}

// Auto-initialisation
window.SpatialViewerBridge = SpatialViewerBridge.getInstance();
