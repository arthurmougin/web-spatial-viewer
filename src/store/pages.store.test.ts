const disposePageListener = vi.fn();
const disposeProgressListener = vi.fn();

vi.mock("../classes/page-listener", () => ({
  PageListener: vi.fn().mockImplementation((url: string, id: number) => ({
    url,
    id,
    dispose: disposePageListener,
    setIframe: vi.fn(),
  })),
}));

vi.mock("../classes/progress-listener", () => ({
  ProgressListener: vi.fn().mockImplementation((id: number) => ({
    id,
    dispose: disposeProgressListener,
  })),
}));

vi.mock("../utils/proxy.utils", () => ({
  proxyFyUrl: vi.fn((url: string, pageId?: number) => {
    const idPart = pageId ? `?pageId=${pageId}` : "";
    return new URL(`http://proxied.localhost/${encodeURIComponent(url)}${idPart}`);
  }),
}));

import { usePagesStore } from "./pages.store";

describe("pages.store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePagesStore.setState({ pages: [] });
    vi.spyOn(Date, "now").mockReturnValue(123456789);
    vi.spyOn(window.history, "pushState").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates the first page and initializes its history", () => {
    usePagesStore.getState().handleFirstPageSubmission("https://example.com");

    const page = usePagesStore.getState().pages[0];
    expect(usePagesStore.getState().pages).toHaveLength(1);
    expect(page.id).toBe(123456789);
    expect(page.showSplash).toBe(true);
    expect(page.history).toEqual([page.url]);
    expect(page.historyIndex).toBe(0);
  });

  it("adds a new page without clearing the previous ones", () => {
    usePagesStore.getState().addPage("https://one.example");
    vi.spyOn(Date, "now").mockReturnValue(123456790);
    usePagesStore.getState().addPage("https://two.example");

    expect(usePagesStore.getState().pages).toHaveLength(2);
  });

  it("records push and replace navigation in history", () => {
    usePagesStore.getState().handleFirstPageSubmission("https://example.com");
    const page = usePagesStore.getState().pages[0];

    usePagesStore
      .getState()
      .recordNavigation(page.id, "http://proxied.localhost/next", "push");
    usePagesStore
      .getState()
      .recordNavigation(page.id, "http://proxied.localhost/replaced", "replace");

    const updatedPage = usePagesStore.getState().pages[0];
    expect(updatedPage.history).toEqual([
      page.url,
      "http://proxied.localhost/replaced",
    ]);
    expect(updatedPage.historyIndex).toBe(1);
  });

  it("updates progress data for the matching page", () => {
    usePagesStore.getState().handleFirstPageSubmission("https://example.com");
    const page = usePagesStore.getState().pages[0];

    usePagesStore.getState().updateProgressData(page.id, {
      step: "HTML_FETCHED",
      progress: 50,
      message: "halfway",
    });

    expect(usePagesStore.getState().pages[0].progressData).toEqual({
      step: "HTML_FETCHED",
      progress: 50,
      message: "halfway",
    });
  });

  it("disposes listeners when removing a page", () => {
    usePagesStore.getState().handleFirstPageSubmission("https://example.com");
    const page = usePagesStore.getState().pages[0];

    usePagesStore.getState().removePage(new URL(page.url));

    expect(usePagesStore.getState().pages).toHaveLength(0);
    expect(disposePageListener).toHaveBeenCalled();
    expect(disposeProgressListener).toHaveBeenCalled();
  });
});
