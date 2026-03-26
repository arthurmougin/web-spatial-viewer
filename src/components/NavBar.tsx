import {
    ChevronLeft,
    ChevronRight,
    Copy,
    Globe,
    Lock,
    RotateCcw,
    Share,
    SquarePlus,
    X,
} from "lucide-react";
import styles from "./NavBar.module.css";

interface NavBarProps {
  displayUrl: string | null;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onCopyUrl: () => void;
  onNewTab: () => void;
  onClose: () => void;
  isSecure?: boolean;
}

export function NavBar({
  displayUrl,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onReload,
  onCopyUrl,
  onNewTab,
  onClose,
  isSecure = false,
}: NavBarProps) {
  const domain = displayUrl
    ? (() => {
        try {
          return new URL(displayUrl).hostname;
        } catch {
          return displayUrl;
        }
      })()
    : "Loading…";

  return (
    <div className={styles.bar}>
      {/* Left controls */}
      <div className={styles.controls}>
        <button
          className={styles.iconBtn}
          onClick={onBack}
          disabled={!canGoBack}
          title="Back"
          aria-label="Back"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          className={styles.iconBtn}
          onClick={onForward}
          disabled={!canGoForward}
          title="Forward"
          aria-label="Forward"
        >
          <ChevronRight size={14} />
        </button>
        <button
          className={styles.iconBtn}
          onClick={onReload}
          title="Reload"
          aria-label="Reload"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* URL bar */}
      <div className={styles.urlBar}>
        <div className={styles.urlContent}>
          <span className={styles.urlIcon}>
            {isSecure ? <Lock size={10} /> : <Globe size={10} />}
          </span>
          <span className={styles.urlText}>{domain}</span>
        </div>
        <button
          className={styles.urlActionBtn}
          onClick={onCopyUrl}
          title="Copy URL"
          aria-label="Copy URL"
        >
          <Copy size={10} />
        </button>
      </div>

      {/* Right controls */}
      <div className={styles.controls}>
        <button
          className={styles.iconBtn}
          onClick={onCopyUrl}
          title="Share"
          aria-label="Share"
        >
          <Share size={14} />
        </button>
        <button
          className={styles.iconBtn}
          onClick={onNewTab}
          title="New tab"
          aria-label="New tab"
        >
          <SquarePlus size={14} />
        </button>
        <button
          className={styles.iconBtn}
          onClick={onClose}
          title="Close"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
