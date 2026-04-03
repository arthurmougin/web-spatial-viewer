/**
 * Tests for the recordNavigation action of pages.store.
 *
 * PageListener and ProgressListener are mocked: they have real DOM/SSE side
 * effects that are irrelevant to the navigation history logic being tested.
 *
 * Strategy: directly set the store state with a synthetic page, then call
 * recordNavigation and assert the resulting history/historyIndex.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PageListener } from "../../classes/page-listener";
import type { Page } from "../../store/pages.store";
import { usePagesStore } from "../../store/pages.store";

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock("../../classes/page-listener", () => ({
  PageListener: vi.fn().mockImplementation(() => ({
    dispose: vi.fn(),
    setIframe: vi.fn(),
    sendMessage: vi.fn(),
  })),
}));

vi.mock("../../classes/progress-listener", () => ({
  ProgressListener: vi.fn().mockImplementation(() => ({
    dispose: vi.fn(),
  })),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────

const PAGE_ID = 1;

/** Insert a synthetic page directly into the store (bypasses PageListener ctor). */
function seedPage(overrides: Partial<Page> = {}) {
  usePagesStore.setState({
    pages: [
      {
        id: PAGE_ID,
        pageListener: {
          dispose: vi.fn(),
          setIframe: vi.fn(),
          sendMessage: vi.fn(),
        } as unknown as PageListener,
        progressListener: null,
        progressData: null,
        url: "http://lofi-cafe.localhost:47891/",
        showSplash: false,
        history: ["http://lofi-cafe.localhost:47891/"],
        historyIndex: 0,
        ...overrides,
      },
    ],
  });
}

function getPage(): Page {
  return usePagesStore.getState().getPage(PAGE_ID)!;
}

// ─── Tests ────────────────────────────────────────────────────────────────

beforeEach(() => {
  usePagesStore.setState({ pages: [] });
});

describe("recordNavigation — push", () => {
  it("appends the URL and advances historyIndex", () => {
    seedPage();
    usePagesStore.getState().recordNavigation(PAGE_ID, "/page2", "push");
    const page = getPage();
    expect(page.history).toEqual([
      "http://lofi-cafe.localhost:47891/",
      "/page2",
    ]);
    expect(page.historyIndex).toBe(1);
  });

  it("truncates the forward stack before appending", () => {
    // Simulate: navigated back to index 1 in a 3-entry history
    seedPage({
      history: ["/a", "/b", "/c"],
      historyIndex: 1,
    });
    usePagesStore.getState().recordNavigation(PAGE_ID, "/d", "push");
    const page = getPage();
    expect(page.history).toEqual(["/a", "/b", "/d"]);
    expect(page.historyIndex).toBe(2);
  });

  it("does not affect other pages in the store", () => {
    const OTHER_ID = 99;
    usePagesStore.setState({
      pages: [
        {
          id: PAGE_ID,
          pageListener: { dispose: vi.fn() } as unknown as PageListener,
          progressListener: null,
          progressData: null,
          url: "http://lofi-cafe.localhost:47891/",
          showSplash: false,
          history: ["/a"],
          historyIndex: 0,
        },
        {
          id: OTHER_ID,
          pageListener: { dispose: vi.fn() } as unknown as PageListener,
          progressListener: null,
          progressData: null,
          url: "http://other.localhost:47891/",
          showSplash: false,
          history: ["/x"],
          historyIndex: 0,
        },
      ],
    });
    usePagesStore.getState().recordNavigation(PAGE_ID, "/b", "push");
    const other = usePagesStore.getState().getPage(OTHER_ID)!;
    expect(other.history).toEqual(["/x"]);
    expect(other.historyIndex).toBe(0);
  });
});

describe("recordNavigation — replace", () => {
  it("replaces the current entry without changing historyIndex", () => {
    seedPage({
      history: ["/a", "/b"],
      historyIndex: 1,
    });
    usePagesStore.getState().recordNavigation(PAGE_ID, "/b-new", "replace");
    const page = getPage();
    expect(page.history).toEqual(["/a", "/b-new"]);
    expect(page.historyIndex).toBe(1);
  });

  it("replaces the first entry when historyIndex is 0", () => {
    seedPage();
    usePagesStore
      .getState()
      .recordNavigation(
        PAGE_ID,
        "http://lofi-cafe.localhost:47891/?v=2",
        "replace",
      );
    const page = getPage();
    expect(page.history).toEqual(["http://lofi-cafe.localhost:47891/?v=2"]);
    expect(page.historyIndex).toBe(0);
  });
});

describe("recordNavigation — pop", () => {
  it("moves historyIndex to a known URL (back navigation)", () => {
    seedPage({
      history: ["/a", "/b", "/c"],
      historyIndex: 2,
    });
    usePagesStore.getState().recordNavigation(PAGE_ID, "/b", "pop");
    expect(getPage().historyIndex).toBe(1);
  });

  it("moves historyIndex forward to a known URL (forward navigation)", () => {
    seedPage({
      history: ["/a", "/b", "/c"],
      historyIndex: 0,
    });
    usePagesStore.getState().recordNavigation(PAGE_ID, "/c", "pop");
    expect(getPage().historyIndex).toBe(2);
  });

  it("does not change index when URL is not found in history", () => {
    seedPage({
      history: ["/a", "/b"],
      historyIndex: 0,
    });
    usePagesStore.getState().recordNavigation(PAGE_ID, "/unknown", "pop");
    // Falls back to returning the page unchanged
    expect(getPage().historyIndex).toBe(0);
  });
});

describe("removePage", () => {
  it("removes the page from the store by proxified URL", () => {
    const url = "http://lofi-cafe.localhost:47891/";
    seedPage({ url });
    expect(usePagesStore.getState().pages).toHaveLength(1);
    usePagesStore.getState().removePage(new URL(url));
    expect(usePagesStore.getState().pages).toHaveLength(0);
  });

  it("calls dispose() on the page listener when removing", () => {
    const disposeSpy = vi.fn();
    usePagesStore.setState({
      pages: [
        {
          id: PAGE_ID,
          pageListener: {
            dispose: disposeSpy,
            setIframe: vi.fn(),
            sendMessage: vi.fn(),
          } as unknown as PageListener,
          progressListener: null,
          progressData: null,
          url: "http://lofi-cafe.localhost:47891/",
          showSplash: false,
          history: [],
          historyIndex: 0,
        },
      ],
    });
    usePagesStore
      .getState()
      .removePage(new URL("http://lofi-cafe.localhost:47891/"));
    expect(disposeSpy).toHaveBeenCalledOnce();
  });
});
