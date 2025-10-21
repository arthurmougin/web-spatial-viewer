export type MessageType =
  | "INIT"
  | "INIT_RESPONSE"
  | "UPDATE_MANIFEST"
  | "ERROR"
  | "BRIDGE_LOG"
  | "MANIFEST_READY"
  | "FRAME_READY";

export interface WebSpatialMessage<T = unknown> {
  type: MessageType;
  data?: T;
  error?: string;
}

import type { WebManifest } from "./spatial";

export interface InitResponseData {
  status: string;
  manifest: WebManifest;
}

export type WebSpatialEventHandler = (
  event: MessageEvent<WebSpatialMessage>
) => void;
