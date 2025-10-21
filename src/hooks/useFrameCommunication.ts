import { useEffect, useRef, useCallback } from "react";
import { useStore } from "../store/store";
import type { MessageType, WebSpatialMessage } from "../types/messages";
import { logger } from "../utils/logger";

export interface FrameAPI {
  sendMessage: <T>(type: MessageType, data?: T) => void;
}

export function useFrameCommunication(src: string) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Séparer les sélecteurs pour éviter les re-rendus inutiles
  const isLoading = useStore((state) => state.isLoading);
  const error = useStore((state) => state.error);

  const sendMessage = useCallback(<T>(type: MessageType, data?: T) => {
    const message: WebSpatialMessage<T> = { type, data };
    const iframe = iframeRef.current;

    if (iframe?.contentWindow) {
      try {
        const targetOrigin = new URL(iframe.src).origin;
        logger.debug("Sending message to frame", {
          message,
          targetOrigin,
          iframeSrc: iframe.src,
        });
        iframe.contentWindow.postMessage(message, targetOrigin);
      } catch (error) {
        logger.warn("Error sending message to frame", {
          error,
          src: iframe.src,
        });
        // Fallback to '*' if URL parsing fails
        iframe.contentWindow.postMessage(message, "*");
      }
    } else {
      logger.warn(
        "Cannot send message: iframe or contentWindow not available",
        {
          type,
          hasIframe: !!iframe,
          hasContentWindow: !!iframe?.contentWindow,
        }
      );
    }
  }, []);

  const frameApi: FrameAPI = {
    sendMessage,
  };

  // Gestion des événements de la souris pour l'interaction
  useEffect(() => {
    const handleMouseDown = () => {
      if (containerRef.current) {
        containerRef.current.style.pointerEvents = "none";
        containerRef.current.style.opacity = "0.6";
      }
    };

    const handleMouseUp = () => {
      if (containerRef.current) {
        containerRef.current.style.pointerEvents = "auto";
        containerRef.current.style.opacity = "1";
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    logger.debug("Mouse event handlers added");

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      logger.debug("Mouse event handlers removed");
    };
  }, []);

  // Communication avec l'iframe
  const handleMessage = useCallback(
    (event: MessageEvent<WebSpatialMessage>) => {
      // Vérifie si le message vient de notre iframe
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) {
        logger.debug("No iframe available to check message source");
        return;
      }

      try {
        if (event.source === iframe.contentWindow) {
          // Gestion des logs du bridge
          if (event.data?.type === ("BRIDGE_LOG" as MessageType)) {
            const logData = event.data.data as {
              level: "debug" | "info" | "warn" | "error";
              message: string;
              data?: unknown;
            };
            if (logData?.level && logData?.message) {
              logger[logData.level](logData.message, logData.data);
            }
            return;
          }

          // Gestion des autres messages
          logger.debug("Message from frame:", {
            type: event.data?.type,
            data: event.data,
          });
        } else {
          logger.debug("Ignoring message from unknown source");
        }
      } catch (error) {
        logger.warn("Error processing message", { error, src: iframe.src });
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    logger.debug("Message event handler added");

    return () => {
      window.removeEventListener("message", handleMessage);
      logger.debug("Message event handler removed");
    };
  }, [handleMessage]);

  const handleIframeLoad = useCallback(() => {
    logger.debug("Frame loaded");
    // Plus besoin d'envoyer INIT, le bridge nous enverra directement BRIDGE_READY
  }, []);
  return {
    iframeRef,
    containerRef,
    frameApi,
    isLoading,
    error,
    onIframeLoad: handleIframeLoad,
  };
}
