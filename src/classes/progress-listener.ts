import { usePagesStore } from "@/store/pages.store";

export interface ProgressData {
  step: string;
  progress: number;
  message: string;
  duration?: number;
}

export class ProgressListener {
  private eventSource: EventSource | null = null;
  private pageId: number;

  constructor(pageId: number) {
    this.pageId = pageId;
    this.connect();
  }

  private connect() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const url = `http://localhost:3000/events/${this.pageId}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log(
        `[ProgressListener-${this.pageId}] Connection opened to server.`
      );
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data: ProgressData = JSON.parse(event.data);
        console.log(
          `[ViewerProgress-${this.pageId}] ${data.progress}% - ${data.step}: ${data.message}`
        );

        usePagesStore.getState().updateProgressData(this.pageId, data);

        // Si le traitement est terminé, on peut fermer la connexion
        if (data.progress === 100 && data.step.includes("COMPLETE")) {
          this.dispose();
        }
      } catch (error) {
        console.error(
          `[ProgressListener-${this.pageId}] Error parsing message:`,
          error
        );
      }
    };

    this.eventSource.onerror = (error) => {
      console.error(
        `[ProgressListener-${this.pageId}] EventSource failed:`,
        error
      );
      this.eventSource?.close();
      // On pourrait tenter de se reconnecter ici si nécessaire
    };
  }

  public dispose() {
    if (this.eventSource) {
      console.log(`[ProgressListener-${this.pageId}] Closing connection.`);
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
