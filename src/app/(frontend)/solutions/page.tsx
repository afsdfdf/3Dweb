import { MarketingPage } from '../_components/MarketingPage'
import { getMarketingPageContent } from '../_lib/formal-page-content'

export default async function SolutionsPage() {
  return <MarketingPage page={await getMarketingPageContent('solutions')} />
}
