# Shopping Cart Page Design

## Goal

Add a front-end shopping cart flow for Thorns Tavern model print purchases. This phase uses browser storage and existing UI assets only; it does not add Payload schema, order collections, or multi-item payment APIs.

## Confirmed Requirements

- Add a `/cart` route that presents the cart as a centered modal over a dimmed, blurred Tavern backdrop.
- The cart frame uses the existing `ButtonBoxFrame` modal frame assets from the site.
- The desktop cart modal is exactly `1160px` wide and `760px` high in the design stage.
- Cart items are persisted with `localStorage`.
- Model detail adds an `ADD TO CART` action next to the existing print action area.
- The cart supports item selection, multi-select, quantity editing, deletion, original price, discounted price, thumbnail-to-detail navigation, and vertical scrolling inside the item list.
- The bottom total bar stays fixed inside the frame while the list scrolls.
- The checkout button navigates to a front-end checkout page for this phase.
- UI text added in source is English to match the project source-language rule.

## Architecture

The cart is a browser-only feature. A focused storage helper owns validation, merging, quantity clamping, deletion, and subtotal calculation. The `/cart` client component owns selection state and calls the storage helper whenever item quantities or membership change.

The model detail page builds a cart item snapshot from the active model and writes it through the same storage helper. This keeps the future backend migration clear: replace the snapshot source and checkout target, while retaining the cart page interaction model.

## Routes And Components

- `/cart`: Shopping cart modal with the `1160px x 760px` framed desktop surface and a responsive mobile variant.
- `/checkout`: Front-end checkout placeholder that reads selected cart item ids from the query string and points users back to the order-capable account surface.
- `src/app/(frontend)/_lib/cartStorage.ts`: Local storage API and pure cart operations.
- `src/app/(frontend)/cart/CartPageClient.tsx`: Interactive cart UI.
- `src/app/(frontend)/model-detail/ModelDetailNative.tsx`: Adds the `ADD TO CART` action.

## Visual Direction

The cart route is centered as a modal over a dark, blurred Tavern backdrop. The frame reuses existing `ButtonBoxFrame` assets, and cart-specific PC slice assets in `public/ui-lab/cart-modal/` provide the logo, checkbox states, close icon, price chip, subtotal strip, checkout arrow, and quantity plus/minus icons. The internal layout follows the supplied reference: compact header, scrollable product rows, price chip, struck-through original price, quantity stepper, delete action, fixed subtotal strip, and an orange checkout button.

Desktop uses the exact `1160px x 760px` frame. Mobile keeps the same art direction but lets the frame fit the viewport so text and controls do not overlap.

## Testing

Unit tests cover pure cart behavior: add, merge duplicate model ids, clamp quantities, update quantities, delete items, toggle subtotal inclusion, and selected checkout id serialization. Browser verification should check `/cart` at desktop and mobile sizes for frame dimensions, scroll behavior, non-overlap, thumbnail links, and checkout navigation.
