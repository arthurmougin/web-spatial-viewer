import { create } from "zustand";
import { PageListener } from "../classes/page-listener";
import { proxyFyUrl } from "../utils/pwa.utils";

export interface Page {
  id: number;
  pageListener: PageListener;
  url: string;
  showSplash: boolean;
}

interface PagesState {
  pages: Page[];
  handlePageSubmission(url: string): void;
  addPage: (url: string) => void;
  removePage: (url: URL) => void;
  getPage(id: number): Page | undefined;
  updatePage(id: number, data: Partial<Page>): void;
  getPageByUrl: (url: string) => Page | undefined;
}

export const usePagesStore = create<PagesState>((set) => ({
  pages: [],
  handlePageSubmission(url: string) {
    set((state) => {
      for (const page of state.pages) {
        page.pageListener.dispose();
      }
      const proxiedUrl = proxyFyUrl(url);
      const id = Date.now();
      return {
        pages: [
          {
            id,
            pageListener: new PageListener(proxiedUrl.toString(), id),
            url: proxiedUrl.toString(),
            showSplash: true,
          },
        ],
      };
    });
  },
  addPage: (url: string) =>
    set((state) => {
      const proxiedUrl = proxyFyUrl(url);
      const id = Date.now();
      return {
        pages: [
          ...state.pages,
          {
            id,
            pageListener: new PageListener(proxiedUrl.toString(), id),
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
        return false;
      }),
    })),
}));
