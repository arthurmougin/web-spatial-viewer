import { create } from "zustand";
import { PageListener } from "../classes/page-listener";
import {
    ProgressListener,
    type ProgressData,
} from "../classes/progress-listener";
import { proxyFyUrl } from "../utils/proxy.utils";

export interface Page {
  id: number;
  pageListener: PageListener;
  progressData: ProgressData | null;
  progressListener: ProgressListener | null;
  url: string;
  showSplash: boolean;
  /** Navigation history stack for this page (proxified URLs). */
  history: string[];
  /** Current position in the history stack. */
  historyIndex: number;
}

interface PagesState {
  pages: Page[];
  handleFirstPageSubmission(url: string): void;
  addPage: (url: string) => void;
  removePage: (url: URL) => void;
  getPage(id: number): Page | undefined;
  updatePage(id: number, data: Partial<Page>): void;
  getPageByUrl: (url: string) => Page | undefined;
  clearProgressListener(pageId: number): void;
  updateProgressData(pageId: number, data: ProgressData): void;
  /**
   * Record a navigation event for a page.
   * action="push" appends to history, truncating forward stack.
   * action="replace" replaces current entry.
   * action="pop" adjusts historyIndex without adding an entry.
   */
  recordNavigation(
    pageId: number,
    url: string,
    action: "push" | "replace" | "pop",
  ): void;
}

export const usePagesStore = create<PagesState>((set) => ({
  pages: [],
  handleFirstPageSubmission(url: string) {
    set((state) => {
      for (const page of state.pages) {
        page.pageListener.dispose();
        page.progressListener?.dispose();
      }
      //set current url as currentsite.fr/?url=formated(url) (without replacing history)
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("url", url);
      window.history.pushState(null, "", currentUrl.toString());

      const id = Date.now();
      const proxiedUrl = proxyFyUrl(url, id);
      if (!proxiedUrl) {
        console.error(
          "Invalid URL provided to handleFirstPageSubmission:",
          url,
        );
        return {};
      }
      return {
        pages: [
          {
            id,
            pageListener: new PageListener(proxiedUrl.toString(), id),
            progressListener: new ProgressListener(id),
            progressData: null,
            url: proxiedUrl.toString(),
            showSplash: true,
            history: [proxiedUrl.toString()],
            historyIndex: 0,
          },
        ],
      };
    });
  },
  addPage: (url: string) =>
    set((state) => {
      const id = Date.now();
      const proxiedUrl = proxyFyUrl(url, id);
      if (!proxiedUrl) {
        console.error("Invalid URL provided to addPage:", url);
        return {};
      }
      return {
        pages: [
          ...state.pages,
          {
            id,
            pageListener: new PageListener(proxiedUrl.toString(), id),
            progressListener: new ProgressListener(id),
            progressData: null,
            url: proxiedUrl.toString(),
            showSplash: true,
            history: [proxiedUrl.toString()],
            historyIndex: 0,
          },
        ],
      };
    }),
  getPage: (id: number): Page | undefined => {
    const state = usePagesStore.getState();
    return state.pages.find((page: Page) => page.id === id);
  },
  updatePage: (id: number, data: Partial<Page>) =>
    set((state) => {
      console.log("Updating page", id, data);
      return {
        pages: state.pages.map((page) =>
          page.id === id ? { ...page, ...data } : page,
        ),
      };
    }),
  getPageByUrl: (url: string): Page | undefined => {
    const state = usePagesStore.getState();
    return state.pages.find((page: Page) => page.url === url);
  },
  removePage: (url: URL) =>
    set((state) => ({
      pages: state.pages.filter((page) => {
        if (page.url !== url.toString()) {
          return true;
        }
        page.pageListener.dispose();
        page.progressListener?.dispose();
        return false;
      }),
    })),
  clearProgressListener: (pageId: number) =>
    set((state) => ({
      pages: state.pages.map((page) =>
        page.id === pageId ? { ...page, progressListener: null } : page,
      ),
    })),
  updateProgressData: (pageId: number, data: ProgressData) =>
    set((state) => ({
      pages: state.pages.map((page) =>
        page.id === pageId ? { ...page, progressData: data } : page,
      ),
    })),
  recordNavigation: (
    pageId: number,
    url: string,
    action: "push" | "replace" | "pop",
  ) =>
    set((state) => ({
      pages: state.pages.map((page) => {
        if (page.id !== pageId) return page;
        if (action === "push") {
          // Truncate forward stack, then append
          const newHistory = [
            ...page.history.slice(0, page.historyIndex + 1),
            url,
          ];
          return {
            ...page,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }
        if (action === "replace") {
          const newHistory = [...page.history];
          newHistory[page.historyIndex] = url;
          return { ...page, history: newHistory };
        }
        // "pop" — find new index by scanning for URL, or clamp
        const idx = page.history.lastIndexOf(url);
        if (idx !== -1) return { ...page, historyIndex: idx };
        // Fallback: adjust index by ±1 based on direction
        return page;
      }),
    })),
}));
