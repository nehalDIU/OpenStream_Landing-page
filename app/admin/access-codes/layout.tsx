import { Metadata } from 'next'
import { generateMetadata, adminSEOConfig } from '@/lib/seo-optimization'

export const metadata: Metadata = generateMetadata(adminSEOConfig.accessCodes)

export default function AccessCodesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="access-codes-layout">
      {children}
    </div>
  )
}
