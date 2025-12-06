import type { UUID } from "crypto";

export interface IBridgeMessage {
  type: BridgeMessageType; // message we want to send
  id: UUID; // origin of the message
  data: unknown; // payload of the message
}

export enum BridgeMessageType {
  INIT = "INIT",
  ID_ATTRIBUTION = "ID_ATTRIBUTION",
  NETWORK_IDLE = "NETWORK_IDLE",
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
    id: UUID;
  };
}

export interface IBridgeNetworkIdleData extends IBridgeMessage {
  type: BridgeMessageType.NETWORK_IDLE;
  data: null;
}

export type WebSpatialSDKSignature = {
  XR_ENV: string;
  "core-sdk-version": string;
  "react-sdk-version": string;
};
