import { Metadata } from 'next'
import { generateMetadata, adminSEOConfig } from '@/lib/seo-optimization'

export const metadata: Metadata = generateMetadata(adminSEOConfig.overview)

export default function OverviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
