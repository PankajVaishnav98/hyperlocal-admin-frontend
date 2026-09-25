import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FileSpreadsheet } from 'lucide-react'

import { ApiError } from '../api/errors'
import { Button, Card } from '../components/ui/Primitives'
import { downloadCatalogImportTemplate, importCatalogWorkbook } from '../features/ops/api'
import type { CatalogImportResult } from '../features/ops/types'
import { PageHeader, PrimaryLink } from '../features/ops/ui'

const categoryColumns = 'slug, nameEn, nameHi, description, accent, sortOrder, isActive, imageUrl'
const productColumns =
  'sku, categorySlug, nameEn, nameHi, description, unit, priceRupees, mrpRupees, stockQuantity, lowStockThreshold, inStock, isActive, costRupees, imageUrl'

export function CatalogImportPage() {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [result, setResult] = useState<CatalogImportResult | null>(null)

  const download = useMutation({
    mutationFn: downloadCatalogImportTemplate,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'hyperlocal-catalog-import.xlsx'
      link.click()
      URL.revokeObjectURL(url)
    },
  })

  const upload = useMutation({
    mutationFn: (workbook: File) => importCatalogWorkbook(workbook),
    onSuccess: async (imported) => {
      setResult(imported)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    if (!file) {
      setFormError('Choose an .xlsx workbook or a .csv file.')
      return
    }
    try {
      await upload.mutateAsync(file)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Could not import the catalog file.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalog import"
        description="Create or update categories by slug and products by SKU from a spreadsheet. Invalid rows are listed; valid rows still save. Manual add/edit forms stay available."
        action={<PrimaryLink to="/products">Back to products</PrimaryLink>}
      />
      <Card className="max-w-3xl space-y-5 p-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-ink-950 text-white">
          <FileSpreadsheet aria-hidden="true" className="size-4.5" />
        </div>
        <p className="text-sm leading-6 text-ink-600">
          Match key: <span className="font-semibold text-ink-900">categories.slug</span> and{' '}
          <span className="font-semibold text-ink-900">products.sku</span>. Images are HTTPS URLs
          (Cloudinary or already uploaded). Leave imageUrl blank to skip. Binary images inside Excel are
          not required. Upload does not send Cloudinary secrets.
        </p>
        <dl className="grid gap-3 text-sm text-ink-700">
          <div>
            <dt className="font-semibold text-ink-900">categories sheet</dt>
            <dd className="mt-1 font-mono text-xs leading-5 text-ink-500">{categoryColumns}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink-900">products sheet</dt>
            <dd className="mt-1 font-mono text-xs leading-5 text-ink-500">{productColumns}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            loading={download.isPending}
            onClick={() => download.mutate()}
          >
            Download template
          </Button>
        </div>
        <form className="grid gap-4" onSubmit={(event) => void onSubmit(event)}>
          <label className="block space-y-2 text-sm font-semibold text-ink-800">
            Spreadsheet
            <input
              type="file"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="block w-full text-sm font-normal text-ink-700 file:mr-3 file:rounded-xl file:border-0 file:bg-ink-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          {formError ? (
            <p role="alert" className="text-sm text-danger-600">
              {formError}
            </p>
          ) : null}
          <Button type="submit" loading={upload.isPending}>
            Import catalog
          </Button>
        </form>
      </Card>
      {result ? (
        <Card className="max-w-3xl space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold text-ink-950">Import result</h2>
          <p className="text-sm text-ink-600">
            Categories: {result.categories.created} created, {result.categories.updated} updated,{' '}
            {result.categories.failed} failed. Products: {result.products.created} created,{' '}
            {result.products.updated} updated, {result.products.failed} failed.
          </p>
          {result.errors.length === 0 ? (
            <p className="text-sm text-success-700">Every data row imported.</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="py-2 pr-3">Sheet</th>
                  <th className="py-2 pr-3">Row</th>
                  <th className="py-2 pr-3">Key</th>
                  <th className="py-2">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 text-ink-800">
                {result.errors.map((error) => (
                  <tr key={`${error.sheet}-${error.row}-${error.key}`}>
                    <td className="py-2 pr-3">{error.sheet}</td>
                    <td className="py-2 pr-3">{error.row}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{error.key}</td>
                    <td className="py-2">{error.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      ) : null}
    </div>
  )
}
