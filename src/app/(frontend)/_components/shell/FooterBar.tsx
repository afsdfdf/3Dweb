import type { FooterContent } from '../../_lib/marketing-content'

type FooterBarProps = {
  footerContent: FooterContent
  siteDescription: string
  supportEmail: string
}

export function FooterBar({ footerContent, siteDescription, supportEmail }: FooterBarProps) {
  return (
    <footer className="border-t border-[#403f46] bg-[#333333]">
      <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-12 text-sm sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="flex items-center gap-4">
          <div className="flex size-9 items-center justify-center rounded-full border border-[#8d5c25] text-[10px] font-semibold tracking-[0.18em] text-[#f0d188]">
            MF
          </div>
          <div>
            <p className="font-serif text-xl font-black uppercase tracking-[0.06em] text-[#f1d99c]">MiniForge AI 3D</p>
            <p className="mt-1 text-[#8e9097]">{siteDescription}</p>
          </div>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-[0.24em] text-[#f0d188]">Information</h3>
          <p className="mt-4 leading-6 text-[#9b9da5]">{footerContent.aboutTitle}</p>
          <p className="mt-2 leading-6 text-[#9b9da5]">{footerContent.directionTitle}</p>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-[0.24em] text-[#f0d188]">Help customers</h3>
          <p className="mt-4 leading-6 text-[#9b9da5]">{supportEmail}</p>
          <p className="mt-2 leading-6 text-[#9b9da5]">{footerContent.aboutText}</p>
        </div>
      </div>
    </footer>
  )
}
