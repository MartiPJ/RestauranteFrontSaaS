// src/data/invoicePrintTemplate.ts
// Genera el documento HTML completo para impresión de facturas.
// Se mantiene separado del componente para mantener el código limpio.

export interface InvoiceProduct {
  name: string
  notes?: string
  quantity: number
  unitPrice: string | number
  subtotal: string | number
}

export interface InvoicePrintData {
  orderNumber: string
  orderDate: string
  userName: string
  tableNumber?: string
  notes?: string
  products?: InvoiceProduct[]
  subtotal: string | number
  tax: string | number
  total: string | number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
  }).format(num)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-GT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// ── HTML Blocks ───────────────────────────────────────────────────────────────

function buildProductRows(products: InvoiceProduct[]): string {
  return products
    .map(
      (p) => `
        <tr>
          <td class="td-product">
            <div class="prod-name">${escapeHtml(p.name)}</div>
            ${p.notes ? `<div class="prod-notes">💬 ${escapeHtml(p.notes)}</div>` : ''}
          </td>
          <td class="td-center">
            <span class="qty-badge">${p.quantity}</span>
          </td>
          <td class="td-right">${formatCurrency(p.unitPrice)}</td>
          <td class="td-right td-green">${formatCurrency(p.subtotal)}</td>
        </tr>`,
    )
    .join('')
}

function buildTableBlock(tableNumber?: string): string {
  return tableNumber
    ? `<div class="info-cell">
         <div class="info-lbl">Mesa</div>
         <div class="info-val badge-blue">${escapeHtml(tableNumber)}</div>
       </div>`
    : `<div class="info-cell">
         <div class="info-lbl">Tipo</div>
         <div class="info-val">Para llevar</div>
       </div>`
}

function buildNotesBlock(notes?: string): string {
  if (!notes) return ''
  return `<div class="notes-block">
    <div class="notes-title">📝 Notas de la orden</div>
    <p class="notes-body">${escapeHtml(notes)}</p>
  </div>`
}

// ── Styles ────────────────────────────────────────────────────────────────────

const PRINT_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    color: #1a1a2e;
    background: #fff;
    padding: 0;
  }
  .page { max-width: 720px; margin: 0 auto; padding: 32px 40px 40px; }
  .accent-bar {
    height: 6px;
    background: linear-gradient(90deg, #609abb, #10b981);
    border-radius: 4px 4px 0 0;
    margin-bottom: 32px;
  }
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e4f4fc;
  }
  .logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
  .logo-icon { font-size: 28px; line-height: 1; }
  .restaurant-name { font-size: 22px; font-weight: 800; color: #051b3a; letter-spacing: -0.5px; }
  .restaurant-subtitle { font-size: 11px; color: #5d7a90; letter-spacing: 1px; text-transform: uppercase; }
  .header-right { text-align: right; }
  .invoice-label { font-size: 28px; font-weight: 800; color: #609abb; letter-spacing: 2px; text-transform: uppercase; }
  .invoice-number { font-size: 13px; color: #5d7a90; font-weight: 600; margin-top: 2px; }
  .invoice-status {
    display: inline-block;
    margin-top: 6px;
    background: #d1fae5;
    color: #059669;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    background: #f0f9ff;
    border: 1px solid #e4f4fc;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
  }
  .info-cell { display: flex; flex-direction: column; gap: 4px; }
  .info-lbl { font-size: 9px; font-weight: 700; color: #5d7a90; text-transform: uppercase; letter-spacing: 0.8px; }
  .info-val { font-size: 12px; font-weight: 600; color: #051b3a; }
  .badge-blue {
    display: inline-block;
    background: #609abb;
    color: white;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    width: fit-content;
  }
  .notes-block {
    background: #fef9ec;
    border-left: 3px solid #f59e0b;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
  }
  .notes-title { font-size: 10px; font-weight: 700; color: #92640b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .notes-body { font-size: 12px; color: #78540a; line-height: 1.5; }
  .section-title { font-size: 11px; font-weight: 700; color: #5d7a90; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead { background: #051b3a; color: white; }
  thead th { padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; }
  .th-left { text-align: left; }
  .th-center { text-align: center; }
  .th-right { text-align: right; }
  tbody tr { border-bottom: 1px solid #e4f4fc; }
  tbody tr:nth-child(even) { background: #f8fcff; }
  tbody tr:last-child { border-bottom: none; }
  td { padding: 11px 12px; vertical-align: middle; }
  .td-product { text-align: left; }
  .td-center { text-align: center; }
  .td-right { text-align: right; font-weight: 600; }
  .td-green { color: #059669; font-weight: 700; }
  .prod-name { font-weight: 700; color: #051b3a; font-size: 13px; }
  .prod-notes { font-size: 10px; color: #5d7a90; font-style: italic; margin-top: 3px; }
  .qty-badge {
    display: inline-block;
    background: #609abb;
    color: white;
    padding: 3px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    min-width: 36px;
    text-align: center;
  }
  .totals-wrapper { display: flex; justify-content: flex-end; margin-bottom: 28px; }
  .totals-box { width: 280px; background: #f0f9ff; border: 1px solid #e4f4fc; border-radius: 12px; overflow: hidden; }
  .total-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 16px; border-bottom: 1px solid #e4f4fc; font-size: 13px; }
  .total-row:last-child { border-bottom: none; }
  .total-lbl { color: #5d7a90; font-weight: 500; }
  .total-val { font-weight: 600; color: #051b3a; }
  .tax-val { color: #f59e0b; font-weight: 600; }
  .final-row { background: linear-gradient(135deg, #609abb, #5d7a90); color: white; padding: 13px 16px; }
  .final-row .total-lbl { color: rgba(255,255,255,0.85); font-weight: 600; font-size: 13px; }
  .final-amount { font-size: 20px; font-weight: 800; color: white; }
  .divider { border: none; border-top: 2px dashed #b4cbd8; margin: 0 0 20px; }
  .footer { text-align: center; }
  .footer-thanks { font-size: 15px; font-weight: 700; color: #051b3a; margin-bottom: 4px; }
  .footer-note { font-size: 10px; color: #b4cbd8; font-style: italic; margin-bottom: 12px; }
  .footer-meta { font-size: 9px; color: #b4cbd8; letter-spacing: 0.3px; }
  .accent-bar-bottom { height: 4px; background: linear-gradient(90deg, #10b981, #609abb); border-radius: 0 0 4px 4px; margin-top: 24px; }
  @page { size: A4; margin: 15mm 15mm 20mm 15mm; }
  @media print {
    body { padding: 0; }
    .page { padding: 0; max-width: 100%; }
    .accent-bar, .accent-bar-bottom,
    thead, .final-row, .badge-blue,
    .qty-badge, .invoice-status {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`

// ── Main Export ───────────────────────────────────────────────────────────────

/**
 * Genera el HTML completo del documento de factura para impresión.
 * Se abre en una nueva ventana e imprime automáticamente.
 */
export function generateInvoicePrintHtml(inv: InvoicePrintData): string {
  const printDate = new Intl.DateTimeFormat('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())

  const productRows = buildProductRows(inv.products ?? [])
  const tableBlock = buildTableBlock(inv.tableNumber)
  const notesBlock = buildNotesBlock(inv.notes)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Factura ${escapeHtml(inv.orderNumber)}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <div class="page">
    <div class="accent-bar"></div>

    <div class="header">
      <div class="header-left">
        <div class="logo-row">
          <span class="logo-icon">🍽️</span>
          <span class="restaurant-name">Restaurante</span>
        </div>
        <div class="restaurant-subtitle">Sistema de facturación</div>
      </div>
      <div class="header-right">
        <div class="invoice-label">FACTURA</div>
        <div class="invoice-number">${escapeHtml(inv.orderNumber)}</div>
        <span class="invoice-status">✓ Documento de pago</span>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-cell">
        <div class="info-lbl">Fecha</div>
        <div class="info-val">${escapeHtml(formatDate(inv.orderDate))}</div>
      </div>
      <div class="info-cell">
        <div class="info-lbl">Mesero</div>
        <div class="info-val">${escapeHtml(inv.userName)}</div>
      </div>
      ${tableBlock}
    </div>

    ${notesBlock}

    <div class="section-title">Detalle de productos</div>
    <table>
      <thead>
        <tr>
          <th class="th-left" style="width:45%">Producto</th>
          <th class="th-center" style="width:12%">Cant.</th>
          <th class="th-right" style="width:21%">Precio unit.</th>
          <th class="th-right" style="width:22%">Subtotal</th>
        </tr>
      </thead>
      <tbody>${productRows}</tbody>
    </table>

    <div class="totals-wrapper">
      <div class="totals-box">
        <div class="total-row">
          <span class="total-lbl">Subtotal</span>
          <span class="total-val">${formatCurrency(inv.subtotal)}</span>
        </div>
        <div class="total-row">
          <span class="total-lbl">Impuesto (IVA)</span>
          <span class="tax-val">${formatCurrency(inv.tax)}</span>
        </div>
        <div class="total-row final-row">
          <span class="total-lbl">Total a pagar</span>
          <span class="final-amount">${formatCurrency(inv.total)}</span>
        </div>
      </div>
    </div>

    <hr class="divider" />
    <div class="footer">
      <div class="footer-thanks">¡Gracias por su preferencia!</div>
      <div class="footer-note">Este documento es válido como comprobante de pago</div>
      <div class="footer-meta">Impreso el ${printDate}</div>
    </div>

    <div class="accent-bar-bottom"></div>
  </div>

  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        window.print()
        window.addEventListener('afterprint', function () {
          window.close()
        })
      }, 300)
    })
  <\/script>
</body>
</html>`
}
