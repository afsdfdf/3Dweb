import { SiteShell } from '../_components/SiteShell'
import { getCurrentUser } from '../_lib/session'
import { WorkbenchScaffold } from './_components/WorkbenchScaffold'

export default async function WorkbenchPage() {
  const user = await getCurrentUser()

  return (
    <SiteShell currentPath="/generate" showFooter={false} showUtilityNav={false} user={user}>
      <WorkbenchScaffold />
    </SiteShell>
  )
}
