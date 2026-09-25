import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { CatalogImportPage } from './CatalogImportPage'

const { importMock } = vi.hoisted(() => ({ importMock: vi.fn() }))

vi.mock('../features/ops/api', () => ({
  downloadCatalogImportTemplate: () => Promise.resolve(new Blob(['xlsx'])),
  importCatalogWorkbook: (...args: unknown[]) => importMock(...args),
}))

describe('CatalogImportPage', () => {
  it('uploads a workbook and shows per-row import errors', async () => {
    importMock.mockResolvedValue({
      importId: 'imp_1',
      categories: { created: 1, updated: 0, failed: 1 },
      products: { created: 1, updated: 0, failed: 0 },
      errors: [{ sheet: 'categories', row: 3, key: '(missing slug)', message: 'slug is required' }],
    })
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const user = userEvent.setup()
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <CatalogImportPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Catalog import' })).toBeInTheDocument()
    expect(screen.getByText(/categories.slug/)).toBeInTheDocument()
    const file = new File(['dummy'], 'catalog.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    await user.upload(screen.getByLabelText('Spreadsheet'), file)
    await user.click(screen.getByRole('button', { name: 'Import catalog' }))
    expect(await screen.findByText('Import result')).toBeInTheDocument()
    expect(screen.getByText('slug is required')).toBeInTheDocument()
    expect(importMock).toHaveBeenCalled()
  })
})
