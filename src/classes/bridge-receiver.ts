
export class BridgeReceiver {
  iframes: HTMLIFrameElement[] = [];
  private static instance: BridgeReceiver;

  private constructor() {
    console.log("BridgeReceiver initialized");
    this.setupMessageListener();
  }

  public static getInstance(): BridgeReceiver {
    if (!BridgeReceiver.instance) {
      BridgeReceiver.instance = new BridgeReceiver();
    }
    return BridgeReceiver.instance;
  }

  private setupMessageListener(): void {
    window.onmessage = (event) => {
      console.log("Message received in BridgeReceiver:", event);
      const { type, data } = event.data;
      console.log(`Received message of type: ${type}`, data);
      // Handle different message types here
    };
  }

  // Méthodes publiques pour interagir avec le viewer
  public sendToViewer(type: string, data: any): void {
    window.parent.postMessage({ type, data });
  }

  addIframe(iframe: HTMLIFrameElement): void {
    this.iframes.push(iframe);
  }

  removeIframe(iframe: HTMLIFrameElement): void {
    this.iframes = this.iframes.filter((frame) => frame !== iframe);
  }
}
