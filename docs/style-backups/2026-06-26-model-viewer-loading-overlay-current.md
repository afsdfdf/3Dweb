# Model Viewer Loading Overlay Style Backup

This backup captures the current loading overlay style before replacing it with the requested framed model-preview progress bar.

## Source

- `src/app/(frontend)/_components/ModelViewer.tsx`
- Function: `ModelLoadingOverlay`
- Date: 2026-06-26

## Current Style Summary

- Default overlay:
  - `absolute inset-x-6 bottom-6`
  - compact black panel
  - small uppercase label row with a gold dot
  - rounded progress rail
  - uppercase stage labels
- Workbench variant:
  - `left-1/2`
  - `width: 460px`
  - `bottom: 86px`
  - `border-image` frame from `/ui-lab/workbench/model-loading-frame-2x.png`
  - compact framed content based on the first implementation pass

## Current Default Class Values

```tsx
const overlayClassName =
  "model-viewer-loading-overlay pointer-events-none absolute inset-x-6 bottom-6 z-20";

const frameClassName =
  "border border-white/15 bg-black/72 px-4 py-3 shadow-[0_16px_34px_rgba(0,0,0,0.46)] backdrop-blur-md";

const progressTrackClassName =
  "mt-2 h-[5px] overflow-hidden rounded-full bg-white/12";

const progressFillClassName =
  "h-full rounded-full bg-[linear-gradient(90deg,#f3c46d,#ffffff,#9ed2ff)] shadow-[0_0_18px_rgba(243,196,109,0.48)] transition-[width] duration-300 ease-out";
```

## Current Workbench Variant Values

```tsx
const overlayStyle = {
  bottom: "86px",
  transform: "translateX(-50%)",
  width: "460px",
};

const frameStyle = {
  borderImage:
    'url("/ui-lab/workbench/model-loading-frame-2x.png") 9 fill / 9px / 0 stretch',
};
```
