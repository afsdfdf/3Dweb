import Link from "next/link";

import { BorderComboFrame2 } from "@/components/ui-lab/border-combo-frame-2";

type CheckoutPageProps = {
  searchParams: Promise<{
    items?: string;
  }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { items = "" } = await searchParams;
  const itemCount = items
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean).length;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111114] px-4 py-10 text-[#ededee]">
      <BorderComboFrame2 className="h-[520px] w-full max-w-[820px]">
        <section className="flex h-full flex-col justify-center px-12 py-10 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.22em] text-[#b7965c]">Checkout</p>
          <h1 className="m-0 text-4xl font-semibold text-[#f7d9a3]">Payment page is being prepared.</h1>
          <p className="mx-auto mt-5 max-w-[560px] text-base leading-7 text-[#b7b8c0]">
            {itemCount > 0
              ? `${itemCount} cart item${itemCount === 1 ? "" : "s"} selected.`
              : "No cart items were selected."}{" "}
            This front-end checkout placeholder keeps the cart flow ready for the next payment integration pass.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link className="rounded border border-[#d7a45b] px-5 py-3 text-[#f7d9a3]" href="/cart">
              Back To Cart
            </Link>
            <Link className="rounded bg-[#c85b23] px-5 py-3 font-semibold text-white" href="/account?section=orders">
              View Orders
            </Link>
          </div>
        </section>
      </BorderComboFrame2>
    </main>
  );
}
