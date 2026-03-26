/**
 * NavBar3D — uikit-based 3D browser chrome for the spatial viewer.
 *
 * Architecture note:
 *   This component renders ENTIRELY in WebGL via @react-three/uikit.
 *   It must NOT use CSS, HTML elements, or CSS Modules.
 *   It lives in the R3F scene as a native 3D object.
 *
 * Glassmorphism approximation (Approximated):
 *   CSS `backdrop-filter` is unavailable in WebGL. Translucency is approximated
 *   with per-element `opacity`. This is an intentional, documented limitation.
 *
 * Positioning:
 *   The outer <group> is placed in world space above the drei <Html> iframe.
 *   pixelSize={1/800} on the root Container aligns uikit layout pixels with the
 *   iframe geometry scale (frameWidth / 800 world units).
 *
 * uikit v1.0.x API notes:
 *   - Root is deprecated; replace with Container.
 *   - position must be on a <group> wrapper (Container has no position prop).
 *   - backgroundOpacity does not exist; use `opacity` (per-element panel alpha).
 *   - flex shorthand does not exist; use flexGrow + flexShrink + flexBasis.
 */

import { Container, Text } from "@react-three/uikit";
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
} from "@react-three/uikit-lucide";
import type { ReactNode } from "react";
import type { Vector3Tuple } from "three";

// ─── Design tokens (visionOS approximation) ────────────────────────────────

const NAV_BG_COLOR = "#ffffff";
const NAV_BG_OPACITY = 0.1;

const ICON_BTN_COLOR = "#ffffff";
const ICON_BTN_OPACITY = 0.25;
const ICON_BTN_OPACITY_HOVER = 0.35;
const ICON_BTN_OPACITY_ACTIVE = 0.45;
const ICON_BTN_OPACITY_DISABLED = 0.1;

const URL_BAR_COLOR = "#65635c";
const URL_BAR_OPACITY = 0.6;

const TEXT_COLOR = "#ffffff";

/** Actual bar height in uikit pixels (44px matches visionOS design spec). */
export const NAV_BAR_HEIGHT = 44;

// ─── Icon button primitive ─────────────────────────────────────────────────

interface IconButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}

function IconButton({ onClick, disabled = false, children }: IconButtonProps) {
  return (
    <Container
      width={32}
      height={32}
      borderRadius={999}
      backgroundColor={ICON_BTN_COLOR}
      opacity={disabled ? ICON_BTN_OPACITY_DISABLED : ICON_BTN_OPACITY}
      alignItems="center"
      justifyContent="center"
      onClick={disabled ? undefined : onClick}
      // uikit calls Object.entries() on hover/active values — passing `undefined`
      // crashes with "Cannot convert undefined or null to object". Use conditional
      // spread so the prop is simply absent when disabled, not undefined.
      {...(!disabled && {
        hover: { opacity: ICON_BTN_OPACITY_HOVER },
        active: { opacity: ICON_BTN_OPACITY_ACTIVE },
      })}
    >
      {children}
    </Container>
  );
}

// ─── NavBar3D props ────────────────────────────────────────────────────────

export interface NavBar3DProps {
  /**
   * World-space position passed to the wrapping <group>.
   * Computed in WebFrame: navBarCenterY = (totalHeight / 2 - NAV_BAR_HEIGHT / 2) / 800
   */
  position: Vector3Tuple;

  /**
   * World units per uikit pixel.
   * Use 1/800 to match the iframe geometry scale (frameWidth / 800 world units).
   */
  pixelSize: number;

  /** Width of the nav bar in uikit pixels. Should match frameSize.width. */
  width: number;

  /** De-proxified URL string (e.g. "https://lofi.cafe"), or null while loading. */
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

// ─── Component ────────────────────────────────────────────────────────────

export function NavBar3D({
  position,
  pixelSize,
  width,
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
}: NavBar3DProps) {
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
    // <group> provides the R3F world-space position; Container has no position prop.
    <group position={position}>
      <Container
        pixelSize={pixelSize}
        flexDirection="row"
        alignItems="center"
        paddingX={6}
        gap={20}
        width={width}
        height={NAV_BAR_HEIGHT}
        borderRadius={999}
        backgroundColor={NAV_BG_COLOR}
        opacity={NAV_BG_OPACITY}
      >
        {/* ── Left controls: Back · Forward · Reload ── */}
        <Container
          flexDirection="row"
          alignItems="center"
          gap={10}
          flexShrink={0}
        >
          <IconButton onClick={onBack} disabled={!canGoBack}>
            <ChevronLeft width={14} height={14} color={TEXT_COLOR} />
          </IconButton>
          <IconButton onClick={onForward} disabled={!canGoForward}>
            <ChevronRight width={14} height={14} color={TEXT_COLOR} />
          </IconButton>
          <IconButton onClick={onReload}>
            <RotateCcw width={14} height={14} color={TEXT_COLOR} />
          </IconButton>
        </Container>

        {/* ── URL bar ── */}
        <Container
          flexGrow={1}
          height={30}
          borderRadius={999}
          backgroundColor={URL_BAR_COLOR}
          opacity={URL_BAR_OPACITY}
          flexDirection="row"
          alignItems="center"
          paddingX={10}
          gap={6}
          onClick={onCopyUrl}
        >
          {isSecure ? (
            <Lock width={10} height={10} color={TEXT_COLOR} />
          ) : (
            <Globe width={10} height={10} color={TEXT_COLOR} />
          )}
          <Text fontSize={15} color={TEXT_COLOR} flexShrink={1} flexGrow={1}>
            {domain}
          </Text>
          <IconButton onClick={onCopyUrl}>
            <Copy width={10} height={10} color={TEXT_COLOR} />
          </IconButton>
        </Container>

        {/* ── Right controls: Share · New Tab · Close ── */}
        <Container
          flexDirection="row"
          alignItems="center"
          gap={10}
          flexShrink={0}
        >
          <IconButton onClick={onCopyUrl}>
            <Share width={14} height={14} color={TEXT_COLOR} />
          </IconButton>
          <IconButton onClick={onNewTab}>
            <SquarePlus width={14} height={14} color={TEXT_COLOR} />
          </IconButton>
          <IconButton onClick={onClose}>
            <X width={14} height={14} color={TEXT_COLOR} />
          </IconButton>
        </Container>
      </Container>
    </group>
  );
}
