import { FormalInfoPage } from '../_components/FormalInfoPage'
import { getFormalPageContent } from '../_lib/formal-page-content'

export default async function RefundPolicyPage() {
  return <FormalInfoPage page={await getFormalPageContent('refundPolicy')} />
}
