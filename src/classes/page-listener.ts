import { type RefObject } from "react";
import {
    BridgeMessageType,
    type IBridgeInitData,
    type IBridgeMessage,
    type IBridgeNavigateData,
} from "../../types/bridge";
import { usePagesStore } from "../store/pages.store";
import { usePWAStore } from "../store/pwa.store";

export class PageListener {
  id: number;
  url: string;
  iframe: RefObject<HTMLIFrameElement> | null = null;
  private boundParseMessage: (event: MessageEvent) => void;

  constructor(url: string, id: number) {
    this.url = url;
    this.id = id;
    this.boundParseMessage = this.parseMessage.bind(this);
    window.addEventListener("message", this.boundParseMessage);
  }

  dispose() {
    window.removeEventListener("message", this.boundParseMessage);
  }

  setIframe(iframe: RefObject<HTMLIFrameElement | null>) {
    if (iframe.current === null) return;
    this.iframe = iframe as RefObject<HTMLIFrameElement>;
    //this.iframe.current.contentWindow!.onmessage = this.parseMessage.bind(this);
    if (this.iframe.current.id !== this.id.toString()) {
      throw new Error("Iframe ID does not match PageListener ID");
    }
  }

  sendMessage(message: IBridgeMessage) {
    console.log("Sending message from Page to iframe:", message);
    if (this.iframe && this.iframe.current) {
      this.iframe.current.contentWindow?.postMessage(message, "*");
    }
  }

  parseMessage(event: MessageEvent) {
    if (!this.iframe) return;

    const messageOrigin = event.origin;
    const iframeSrc = this.iframe.current!.getAttribute("src") as string;
    const iframeOrigin = new URL(iframeSrc).origin;

    if (messageOrigin !== iframeOrigin) {
      console.warn(
        `Origin mismatch: message origin (${messageOrigin}) does not match iframe origin (${iframeOrigin}). Message ignored.`,
      );
      return;
    }

    if (!event.data || !event.data.type) {
      //Not a message we care about
      return;
    }

    // HANDLE HANDSHAKE
    if (event.data.type === "INIT") {
      if (!event.data.originHref) {
        console.warn(`INIT message missing originHref. Message ignored.`);
        return;
      }
      if (event.data.originHref != iframeSrc) {
        //We don't care for other pages
        return;
      }
      const data = (event.data as IBridgeInitData).data;

      usePWAStore.getState().setSpatialSDKSignature(data.sdkSignature);

      if (data.manifestUrl) {
        usePWAStore.getState().loadManifest(data.manifestUrl);
      }

      this.sendMessage({
        type: BridgeMessageType.ID_ATTRIBUTION,
        id: this.id,
        data: {
          id: this.id,
        },
      });
      return;
    }
    //END OF HANDSHAKE ZONE

    //We then filter out all messages that are not for us
    if (event.data.id !== this.id) {
      //Message not for us
      return;
    }

    switch (event.data.type) {
      case "NETWORK_IDLE": {
        console.log("NETWORK_IDLE message received", event.data);
        usePagesStore.getState().updatePage(this.id, { showSplash: false });
        break;
      }
      case "NAVIGATE": {
        const nav = event.data as IBridgeNavigateData;
        usePagesStore
          .getState()
          .recordNavigation(this.id, nav.data.url, nav.data.action);
        break;
      }
      default:
        console.warn("Unknown message type received:", event.data.type);
    }

    /*this.receivedMessageCallbacks.forEach((callback) =>
      callback(event.data as IBridgeMessage)
    );*/
  }

  toString() {
    return this.url.toString();
  }
}
