export interface IBridgeMessage {
  type: BridgeMessageType; // message we want to send
  id: number; // numeric page id (Date.now())
  data: unknown; // payload of the message
}

export enum BridgeMessageType {
  INIT = "INIT",
  ID_ATTRIBUTION = "ID_ATTRIBUTION",
  NETWORK_IDLE = "NETWORK_IDLE",
  /** Bridge → Viewer: the iframe navigated (pushState / replaceState / popstate). */
  NAVIGATE = "NAVIGATE",
  /** Viewer → Bridge: instruct the iframe to go back in history. */
  GO_BACK = "GO_BACK",
  /** Viewer → Bridge: instruct the iframe to go forward in history. */
  GO_FORWARD = "GO_FORWARD",
  ERROR = "ERROR",
}

export interface IBridgeInitData extends Omit<IBridgeMessage, "id"> {
  type: BridgeMessageType.INIT;
  originHref: string;
  data: {
    manifestUrl: string | null;
    sdkSignature: WebSpatialSDKSignature | null;
  };
}

export interface IBridgeIDAttributionData extends IBridgeMessage {
  type: BridgeMessageType.ID_ATTRIBUTION;
  data: {
    id: number;
  };
}

export interface IBridgeNetworkIdleData extends IBridgeMessage {
  type: BridgeMessageType.NETWORK_IDLE;
  data: null;
}

export interface IBridgeNavigateData extends IBridgeMessage {
  type: BridgeMessageType.NAVIGATE;
  data: {
    /** The new proxified URL after navigation. */
    url: string;
    /** How the navigation happened. */
    action: "push" | "replace" | "pop";
  };
}

export type WebSpatialSDKSignature = {
  XR_ENV: string;
  "core-sdk-version": string;
  "react-sdk-version": string;
};
