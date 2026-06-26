import { PageFooter } from '@/components/layout/PageFooter'
import { RegistryContent } from './RegistryContent'

export default function RegistrySettingsPage() {
  return (
    <main className="page-band reveal pt-6 md:pt-8 pb-24">
      <RegistryContent />
      <PageFooter />
    </main>
  )
}
