// Single source of truth for the client-side print pricing shown in the
// PrintOrderDialog and the cart. Keeping one definition prevents the cart from
// drifting to placeholder prices that don't match what the print dialog charges.

export const printSizeOptions = [
  {
    description: "Desktop miniature scale",
    key: "standard",
    label: "Standard",
    price: 39.9,
  },
  {
    description: "Larger display print",
    key: "premium",
    label: "Premium",
    price: 79.9,
  },
] as const

export const printMaterialOptions = [
  {
    description: "Baseline production material",
    key: "plastic",
    label: "Plastic",
    price: 0,
  },
  {
    description: "Sharper detail and smoother finish",
    key: "resin",
    label: "Resin",
    price: 10,
  },
] as const

// The default configuration (first size + first material) is what "Add to cart"
// represents until the buyer customizes the order in the print dialog.
export const printBaseSize = printSizeOptions[0]
export const printBaseMaterial = printMaterialOptions[0]
export const printBasePrice = printBaseSize.price + printBaseMaterial.price
export const printBaseServiceLabel = `${printBaseSize.label} · ${printBaseMaterial.label} 3D print`
