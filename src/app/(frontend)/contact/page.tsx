import { FormalInfoPage } from '../_components/FormalInfoPage'
import { getFormalPageContent } from '../_lib/formal-page-content'

export default async function ContactPage() {
  return <FormalInfoPage page={await getFormalPageContent('contact')} />
}
