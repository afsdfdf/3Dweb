# Model Preview Progress Bar Design

## Scope

Update the shared model-loading progress overlay to match the supplied reference. The change applies to the model asset loading overlay shown by `ModelViewer` for model previews, including model-detail and Workbench model preview surfaces. It does not apply to the generation task pending overlay.

## Layout

Use the 1920px desktop reference as the design coordinate system. The requested offsets are 730px from the left edge, 730px from the right edge, and 86px from the bottom edge, so the desktop design width is 460px. The overlay should use that reference width while clamping to the available preview container on smaller surfaces.

## Frame Asset

Use the supplied frame image as a 9-slice frame with a 9px slice. Copy it into the project's public UI asset tree so the app can reference it by a stable public URL. The frame should sit behind the existing progress content and keep pointer events disabled.

## Behavior

Keep the current loading phases and progress calculations:

- Network/cache/download
- Verify
- Decode
- Build
- Ready

Only the visual frame, width, typography spacing, and placement change. Loading state transitions, retry behavior, GLB validation, cache behavior, and viewer endpoint usage remain unchanged.

## Testing

Run TypeScript checking after the implementation. If a dev server is available, verify the Workbench desktop view visually at the standard 1920px design ratio and at a smaller browser size to confirm the overlay scales with the stage.
