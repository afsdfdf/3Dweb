import { MarketingPage } from '../_components/MarketingPage'
import { getMarketingPages } from '../_lib/marketing-content'
import { getCurrentLocale } from '../_lib/locale-server'

export default async function FeaturesPage() {
  const locale = await getCurrentLocale()
  return <MarketingPage page={getMarketingPages(locale).features} />
}
