import { create } from "zustand";
import { PageListener } from "../classes/page-listener";
import { ProgressListener } from "../classes/progress-listener";
import { proxyFyUrl } from "../utils/proxy.utils";

export interface Page {
  id: number;
  pageListener: PageListener;
  progressListener: ProgressListener | null;
  url: string;
  showSplash: boolean;
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
      return {
        pages: [
          {
            id,
            pageListener: new PageListener(proxiedUrl.toString(), id),
            progressListener: new ProgressListener(id),
            url: proxiedUrl.toString(),
            showSplash: true,
          },
        ],
      };
    });
  },
  addPage: (url: string) =>
    set((state) => {
      const id = Date.now();
      const proxiedUrl = proxyFyUrl(url, id);
      return {
        pages: [
          ...state.pages,
          {
            id,
            pageListener: new PageListener(proxiedUrl.toString(), id),
            progressListener: new ProgressListener(id),
            url: proxiedUrl.toString(),
            showSplash: true,
          },
        ],
      };
    }),
  getPage: (id: number): Page | undefined => {
    const state = usePagesStore.getState();
    return state.pages.find((page: Page) => page.id === id);
  },
  updatePage: (id: number, data: Partial<Page>) =>
    set((state) => ({
      pages: state.pages.map((page) =>
        page.id === id ? { ...page, ...data } : page
      ),
    })),
  getPageByUrl: (url: string): Page | undefined => {
    const state = usePagesStore.getState();
    return state.pages.find((page: Page) => page.url === url);
  },
  removePage: (url: URL) =>
    set((state) => ({
      pages: state.pages.filter((page) => {
        if (page.toString() !== url.toString()) {
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
        page.id === pageId ? { ...page, progressListener: null } : page
      ),
    })),
}));
