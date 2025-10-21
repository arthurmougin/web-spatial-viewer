/* eslint-disable @typescript-eslint/no-explicit-any */

// Sauvegarde des fonctions console originales
const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};

// Système de log pour le bridge
function bridgeLog(
  level: "log" | "info" | "warn" | "error" | "debug",
  ...args: any[]
) {
  // Log local
  originalConsole[level](...args);

  // Envoyer au parent
  try {
    window.parent?.postMessage(
      {
        type: "BRIDGE_LOG",
        data: {
          level,
          message: args
            .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
            .join(" "),
          data: args.length > 1 ? args.slice(1) : undefined,
          timestamp: Date.now(),
        },
      },
      "*"
    );
  } catch (error) {
    originalConsole.error("[Bridge] Erreur d'envoi des logs:", error);
  }
}

// Override des fonctions console
console.log = (...args: any[]) => bridgeLog("log", ...args);
console.info = (...args: any[]) => bridgeLog("info", ...args);
console.warn = (...args: any[]) => bridgeLog("warn", ...args);
console.error = (...args: any[]) => bridgeLog("error", ...args);
console.debug = (...args: any[]) => bridgeLog("debug", ...args);

// Premier log pour vérifier
console.log("=== SPATIAL VIEWER BRIDGE LOGGING READY ===");

// Import des dépendances
import { findAndLoadManifest } from "./manifest-loader";

// Types
declare global {
  interface Window {
    bridgeManager: BridgeManager;
  }
}

class BridgeManager {
  private parentOrigin = "*";

  constructor() {
    console.log("[Bridge] Démarrage...");
    this.initialize();
  }

  private async initialize() {
    try {
      // 1. Charger le manifest
      const manifest = await findAndLoadManifest();
      console.log("[Bridge] Manifest trouvé:", manifest);

      // 2. Envoyer le manifest au parent
      window.parent.postMessage(
        { type: "MANIFEST_READY", manifest },
        this.parentOrigin
      );

      // 3. Notifier quand la page est chargée
      if (document.readyState === "complete") {
        this.notifyReady();
      } else {
        window.addEventListener("load", () => this.notifyReady());
      }
    } catch (error) {
      console.error("[Bridge] Erreur d'initialisation:", error);
    }
  }

  private notifyReady() {
    console.log("[Bridge] Page chargée");
    window.parent.postMessage({ type: "FRAME_READY" }, this.parentOrigin);
  }
}

// Démarrage immédiat
console.log("[Bridge] Chargement du script...");
const bridge = new BridgeManager();

// Export global pour debug
(window as any).bridgeManager = bridge;
