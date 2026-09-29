import { Link, Navigate, useParams } from 'react-router-dom'

import { BrandMark, Card } from '../components/ui/Primitives'
import { LegalFooter } from '../components/LegalFooter'
import { SHOP_NAME } from '../brand'
import { LEGAL_DOCUMENTS, LEGAL_LINKS, type LegalSlug } from '../legal/policies'

function isLegalSlug(value: string | undefined): value is LegalSlug {
  return value === 'terms' || value === 'refund' || value === 'returns'
}

export function LegalPage() {
  const { slug } = useParams<{ slug: string }>()
  if (!isLegalSlug(slug)) {
    return <Navigate to="/legal/terms" replace />
  }
  const document = LEGAL_DOCUMENTS[slug]

  return (
    <main className="min-h-screen bg-canvas px-5 py-10 text-ink-950">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="font-display text-lg font-semibold">{SHOP_NAME}</p>
            <p className="text-xs text-ink-500">Administration</p>
          </div>
        </div>
        <Card className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
            Last updated {document.updated}
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
            {document.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-600">{document.summary}</p>
          <div className="mt-8 space-y-8">
            {document.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-display text-lg font-semibold">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="mt-3 text-sm leading-7 text-ink-600">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
          <div className="mt-10 border-t border-ink-100 pt-5">
            <p className="text-xs font-semibold text-ink-700">Also see</p>
            <ul className="mt-2 space-y-1">
              {LEGAL_LINKS.filter((item) => item.slug !== document.slug).map((item) => (
                <li key={item.slug}>
                  <Link
                    className="text-sm text-ink-600 underline-offset-2 hover:text-ink-900 hover:underline"
                    to={item.path}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>
        <LegalFooter />
        <Link className="text-sm font-semibold text-ink-800" to="/login">
          Back to admin sign in
        </Link>
      </div>
    </main>
  )
}
