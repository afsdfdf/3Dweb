"use client";

import { useMemo, useState } from "react";

import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { CreditTopupRedemptionDialog } from "@/components/ui-lab/credit-topup-redemption-dialog";
import { OrangeMediumActionButton } from "@/components/ui-lab/action-buttons";
import type { CreditTopupProduct } from "@/lib/creditTopupProducts";

type CreditTopupPackPanelProps = {
  products: CreditTopupProduct[];
  stripeCreditTopupsEnabled: boolean;
  user: null | {
    email?: null | string;
  };
};

const formatCredits = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);

const formatPackRange = (products: CreditTopupProduct[]) => {
  if (products.length === 0) return "No packs configured";

  const credits = products.map((product) => product.credits);
  const min = Math.min(...credits);
  const max = Math.max(...credits);
  return min === max
    ? `${formatCredits(min)} credits`
    : `${formatCredits(min)}-${formatCredits(max)} credits`;
};

export function CreditTopupPackPanel({
  products,
  stripeCreditTopupsEnabled,
  user,
}: CreditTopupPackPanelProps) {
  const { openAuthModal } = useAuthModal();
  const [open, setOpen] = useState(false);
  const packRange = useMemo(() => formatPackRange(products), [products]);
  const unavailable = !stripeCreditTopupsEnabled || products.length === 0;

  return (
    <section className="flex min-h-[78px] w-[640px] items-center justify-between border border-[#403f46] bg-[#101012] px-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8f7a4a]">
          Credit Packs
        </p>
        <p className="mt-1 truncate text-sm leading-5 text-[#d8d0bf]">
          One-time top-ups for when subscription credits run out.
        </p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#f0d188]">
          {packRange}
        </p>
      </div>

      <div className="relative h-[36.54px] w-[95.21px] shrink-0">
        <OrangeMediumActionButton
          disabled={unavailable}
          label="BUY"
          onClick={() => {
            if (!user) {
              openAuthModal("login");
              return;
            }

            if (!unavailable) setOpen(true);
          }}
          type="button"
        />
      </div>

      <CreditTopupRedemptionDialog
        onOpenChange={setOpen}
        open={open}
        products={products}
      />
    </section>
  );
}
