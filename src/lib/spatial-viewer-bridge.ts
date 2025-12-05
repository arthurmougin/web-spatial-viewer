declare global {
  interface Window {
    SpatialViewerBridge: SpatialViewerBridge;
  }
}

export class SpatialViewerBridge {
  private static instance: SpatialViewerBridge;

  private constructor() {
    console.log("bonjour");
    this.sendToViewer();
    console.log("message sent to viewer");
    window.onmessage = this.receiveMessage.bind(this);
  }

  public static getInstance(): SpatialViewerBridge {
    if (!SpatialViewerBridge.instance) {
      SpatialViewerBridge.instance = new SpatialViewerBridge();
    }
    return SpatialViewerBridge.instance;
  }


  // Méthodes publiques pour interagir avec le viewer
   
  public sendToViewer(): void {
    console.log(window.top);

    window.top!.postMessage("bonsoir", "*");
  }

  private receiveMessage(event: MessageEvent): void {
      console.log("Message received in SpatialViewerBridge:", event);
    }
}

// Auto-initialisation
window.SpatialViewerBridge = SpatialViewerBridge.getInstance();
