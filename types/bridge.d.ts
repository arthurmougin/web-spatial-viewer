export interface IBridgeMessage {
  type: BridgeMessageType;
  data: unknown;
}

export enum BridgeMessageType {
  INIT = "INIT",
  NETWORK_IDLE = "NETWORK_IDLE",
  ERROR = "ERROR",
}

export interface IBridgeInitData extends IBridgeMessage {
  type: BridgeMessageType.INIT;
  data: {
    manifestUrl: string | null;
    sdkSignature: WebSpatialSDKSignature | null;
  };
}

export interface IBridgeNetworkIdleData extends IBridgeMessage {
  type: BridgeMessageType.NETWORK_IDLE;
  data: null;
}

export type WebSpatialSDKSignature = {
  "XR_ENV": string,
  "core-sdk-version": string,
  "react-sdk-version": string
}