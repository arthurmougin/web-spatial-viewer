/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    SpatialViewerBridge: SpatialViewerBridge;
  }
}

export class SpatialViewerBridge {
  private static instance: SpatialViewerBridge;
  private parentOrigin: string;

  private constructor() {
    this.parentOrigin = "*"; // À modifier en production pour plus de sécurité
    this.setupMessageListener();
    console.log("bonjour");
  }

  public static getInstance(): SpatialViewerBridge {
    if (!SpatialViewerBridge.instance) {
      SpatialViewerBridge.instance = new SpatialViewerBridge();
    }
    return SpatialViewerBridge.instance;
  }

  private setupMessageListener(): void {
    window.addEventListener("message", this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent): void {
    // Vérification de l'origine en production
    // if (event.origin !== this.parentOrigin) return;

    try {
      const data = event.data;
      switch (data.type) {
        case "INIT":
          this.handleInit(data);
          break;
        // Ajoutez d'autres cas selon vos besoins
        default:
          console.warn("Message type not handled:", data.type);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }

  private handleInit(data: any): void {
    console.log(data);
    // Répondre au viewer pour confirmer que la connexion est établie
    window.parent.postMessage(
      { type: "INIT_RESPONSE", status: "ready" },
      this.parentOrigin
    );
  }

  // Méthodes publiques pour interagir avec le viewer
  public sendToViewer(type: string, data: any): void {
    window.parent.postMessage({ type, data }, this.parentOrigin);
  }
}

// Auto-initialisation
window.SpatialViewerBridge = SpatialViewerBridge.getInstance();
