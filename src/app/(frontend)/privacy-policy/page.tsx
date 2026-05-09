import { FormalInfoPage } from '../_components/FormalInfoPage'
import { getFormalPageContent } from '../_lib/formal-page-content'

export default async function PrivacyPolicyPage() {
  return <FormalInfoPage page={await getFormalPageContent('privacyPolicy')} />
}
