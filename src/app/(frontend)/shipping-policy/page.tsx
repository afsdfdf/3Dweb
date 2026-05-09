import { FormalInfoPage } from '../_components/FormalInfoPage'
import { getFormalPageContent } from '../_lib/formal-page-content'

export default async function ShippingPolicyPage() {
  return <FormalInfoPage page={await getFormalPageContent('shippingPolicy')} />
}
