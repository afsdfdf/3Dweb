"use client";

import { useState } from "react";

import { CreditTopupRedemptionDialog } from "@/components/ui-lab/credit-topup-redemption-dialog";

const previewProducts = [
  {
    credits: 20,
    currency: "USD",
    id: 1,
    price: 4.99,
    slug: "preview-20",
    title: "20 Credits",
  },
  {
    credits: 50,
    currency: "USD",
    id: 2,
    price: 9.99,
    slug: "preview-50",
    title: "50 Credits",
  },
  {
    credits: 100,
    currency: "USD",
    id: 3,
    price: 17.99,
    slug: "preview-100",
    title: "100 Credits",
  },
];

export default function CreditTopupPreviewPage() {
  const [open, setOpen] = useState(true);

  return (
    <main style={{ background: "#050505", minHeight: "100vh" }}>
      <CreditTopupRedemptionDialog
        onOpenChange={setOpen}
        open={open}
        products={previewProducts}
      />
    </main>
  );
}
