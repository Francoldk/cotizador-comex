'use client';

import React, { useState } from 'react';

export default function CotizadorDCAM() {
  // Datos del Cliente y Operación
  const [cliente, setCliente] = useState('');
  const [producto, setProducto] = useState('');
  const [modalidad, setModalidad] = useState('maritimo_lcl'); // maritimo_lcl, aereo, courier
  const [fobValue, setFobValue] = useState(1500);
  const [pesoKg, setPesoKg] = useState(45);
  const [volumenCbm, setVolumenCbm] = useState(0.4);

  // Tarifas configurables
  const [tarifaFlete, setTarifaFlete] = useState(280); // USD por CBM o KG
  const [gastosNacionales, setGastosNacionales] = useState(180);

  // Alícuotas Tributarias (%)
  const [porcentajeDDI, setPorcentajeDDI] = useState(16);
  const [porcentajeIVA, setPorcentajeIVA] = useState(21);
  const [porcentajeIIBB, setPorcentajeIIBB] = useState(3.5);
  const [porcentajeTasaEst, setPorcentajeTasaEst] = useState(3);

  // Checkboxes de visualización / desglose en factura y PDF
  const [showFob, setShowFob] = useState(true);
  const [showFlete, setShowFlete] = useState(true);
  const [showTributos, setShowTributos] = useState(true);
  const [showGastosNac, setShowGastosNac] = useState(true);

  // Cálculos de costos
  const fob = parseFloat(fobValue) || 0;
  const costoFlete = modalidad === 'maritimo_lcl'
    ? Math.max(1, parseFloat(volumenCbm) || 0) * (parseFloat(tarifaFlete) || 0)
    : (parseFloat(pesoKg) || 0) * (parseFloat(tarifaFlete) || 0);

  const baseCif = fob + costoFlete;
  const ddi = (baseCif * (parseFloat(porcentajeDDI) || 0)) / 100;
  const tasaEst = (baseCif * (parseFloat(porcentajeTasaEst) || 0)) / 100;
  const baseIva = baseCif + ddi + tasaEst;
  const iva = (baseIva * (parseFloat(porcentajeIVA) || 0)) / 100;
  const iibb = (baseCif * (parseFloat(porcentajeIIBB) || 0)) / 100;

  const totalTributosCalculados = ddi + tasaEst + iva + iibb;
  const gastosNac = parseFloat(gastosNacionales) || 0;

  // Cálculo del Total Visible según items seleccionados
  const totalVisible = (showFob ? fob : 0) +
                       (showFlete ? costoFlete : 0) +
                       (showTributos ? totalTributosCalculados : 0) +
                       (showGastosNac ? gastosNac : 0);

  const formatUsd = (num) =>
    `USD ${Number(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={styles.container}>
      {/* PANEL DE CONTROL / ENTRADA (Oculto al imprimir) */}
      <div style={styles.controlPanel} className="no-print">
        <div style={styles.cardHeader}>
          <div style={styles.logoBadge}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#881337' }}>DCAM</span>
          </div>
          <div>
            <h2 style={styles.panelTitle}>Cotizador de Importación DCAM</h2>
            <p style={styles.panelSubtitle}>Configurá valores y seleccioná qué conceptos mostrarle al cliente</p>
          </div>
        </div>

        {/* Formulario de Entrada */}
        <div style={styles.gridForm}>
          <div>
            <label style={styles.label}>Cliente:</label>
            <input
              style={styles.input}
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Ej: Distribuidora SRL"
            />
          </div>

          <div>
            <label style={styles.label}>Producto / Mercadería:</label>
            <input
              style={styles.input}
              type="text"
              value={producto}
              onChange={(e) => setProducto(e.target.value)}
              placeholder="Ej: Repuestos de Automotor"
            />
          </div>

          <div>
            <label style={styles.label}>Modalidad de Flete:</label>
            <select
              style={styles.input}
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value)}
            >
              <option value="maritimo_lcl">Marítimo Compartido (LCL / CBM)</option>
              <option value="aereo">Aéreo Comercial (kg)</option>
              <option value="courier">Courier Express (kg)</option>
            </select>
          </div>

          <div>
            <label style={styles.label}>Valor Mercadería (FOB Total USD):</label>
            <input
              style={styles.input}
              type="number"
              value={fobValue}
              onChange={(e) => setFobValue(e.target.value)}
            />
          </div>

          <div>
            <label style={styles.label}>Peso Total (kg):</label>
            <input
              style={styles.input}
              type="number"
              value={pesoKg}
              onChange={(e) => setPesoKg(e.target.value)}
            />
          </div>

          <div>
            <label style={styles.label}>Volumen Total (CBM):</label>
            <input
              style={styles.input}
              type="number"
              step="0.01"
              value={volumenCbm}
              onChange={(e) => setVolumenCbm(e.target.value)}
            />
          </div>
        </div>

        {/* Sección de Checkboxes para mostrar/ocultar en la cotización */}
        <div style={styles.togglesBox}>
          <div style={styles.togglesTitle}>Visibilidad de Conceptos en la Factura / Cotización:</div>
          <div style={styles.togglesGrid}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showFob}
                onChange={(e) => setShowFob(e.target.checked)}
                style={styles.checkbox}
              />
              Mostrar Valor Mercadería (FOB)
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showFlete}
                onChange={(e) => setShowFlete(e.target.checked)}
                style={styles.checkbox}
              />
              Mostrar Flete Internacional
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showTributos}
                onChange={(e) => setShowTributos(e.target.checked)}
                style={styles.checkbox}
              />
              Mostrar Desglose Tributario (IVA / DDI / IIBB)
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showGastosNac}
                onChange={(e) => setShowGastosNac(e.target.checked)}
                style={styles.checkbox}
              />
              Mostrar Gastos Locales / Despacho
            </label>
          </div>
        </div>

        <button style={styles.printBtn} onClick={() => window.print()}>
          🖨️ Imprimir Cotización / Guardar PDF Oficial
        </button>
      </div>

      {/* VISTA FORMAL DE LA COTIZACIÓN / FACTURA (Imprimible) */}
      <div style={styles.invoiceWrapper}>
        <div style={styles.invoiceCard} className="invoice-print-card">
          
          {/* Encabezado Corporativo */}
          <div style={styles.invoiceHeader}>
            <div>
              <div style={styles.brandTitle}>DE CHINA AL MUNDO</div>
              <div style={styles.brandSub}>Soluciones Integrales de Importación & Logística</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={styles.badgeQuote}>COTIZACIÓN FORMAL</div>
              <div style={styles.dateText}>Fecha: {new Date().toLocaleDateString('es-AR')}</div>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Datos del Cliente y Carga */}
          <div style={styles.clientDetailsGrid}>
            <div>
              <div style={styles.detailLabel}>CLIENTE / EMPRESA:</div>
              <div style={styles.detailValue}>{cliente || 'Cliente General'}</div>
            </div>
            <div>
              <div style={styles.detailLabel}>MERCADERÍA:</div>
              <div style={styles.detailValue}>{producto || 'Carga General'}</div>
            </div>
            <div>
              <div style={styles.detailLabel}>MODALIDAD:</div>
              <div style={styles.detailValue}>
                {modalidad === 'maritimo_lcl' ? 'Marítimo LCL' : modalidad === 'aereo' ? 'Aéreo Comercial' : 'Courier Express'}
              </div>
            </div>
            <div>
              <div style={styles.detailLabel}>PESO / VOLUMEN:</div>
              <div style={styles.detailValue}>{pesoKg} kg | {volumenCbm} CBM</div>
            </div>
          </div>

          {/* Tabla Desglose de Costos */}
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Concepto / Descripción del Servicio</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Importe (USD)</th>
              </tr>
            </thead>
            <tbody>
              {showFob && (
                <tr style={styles.tr}>
                  <td style={styles.td}>
                    <strong>Valor de la Mercadería (FOB Origen)</strong>
                    <div style={styles.itemDesc}>Costo de adquisición de productos según factura comercial proforma.</div>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold' }}>{formatUsd(fob)}</td>
                </tr>
              )}

              {showFlete && (
                <tr style={styles.tr}>
                  <td style={styles.td}>
                    <strong>Flete Internacional ({modalidad === 'maritimo_lcl' ? 'Marítimo Compartido' : 'Aéreo'})</strong>
                    <div style={styles.itemDesc}>Tránsito internacional China - Depósito Fiscal Argentina.</div>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold' }}>{formatUsd(costoFlete)}</td>
                </tr>
              )}

              {showTributos && (
                <tr style={styles.tr}>
                  <td style={styles.td}>
                    <strong>Derechos de Importación & Tributos Aduaneros</strong>
                    <div style={styles.itemDesc}>
                      DDI ({porcentajeDDI}%), Tasa Est. ({porcentajeTasaEst}%), IVA ({porcentajeIVA}%) y Percepciones IIBB ({porcentajeIIBB}%).
                    </div>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold' }}>{formatUsd(totalTributosCalculados)}</td>
                </tr>
              )}

              {showGastosNac && (
                <tr style={styles.tr}>
                  <td style={styles.td}>
                    <strong>Gastos de Despacho & Puerto / Almacenaje</strong>
                    <div style={styles.itemDesc}>Honorarios aduaneros, desconsolidación y gestión documental.</div>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold' }}>{formatUsd(gastosNac)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totalizador */}
          <div style={styles.totalSection}>
            <div>
              <div style={styles.termsNote}>* Cotización en Dólares Estadounidenses (USD).</div>
              <div style={styles.termsNote}>* Validez de la cotización: 7 días corridos.</div>
            </div>
            <div style={styles.totalBox}>
              <span style={styles.totalLabel}>TOTAL ESTIMADO:</span>
              <span style={styles.totalAmount}>{formatUsd(totalVisible)}</span>
            </div>
          </div>

          {/* Pie de Página Corporativo */}
          <div style={styles.footerPdf}>
            <span>De China al Mundo | Soluciones en Comercio Exterior</span>
            <span>www.dechinaalmundo.com.ar</span>
          </div>

        </div>
      </div>

      {/* Reglas de Impresión Limpia */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .invoice-print-card {
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 20px !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '24px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  controlPanel: {
    maxWidth: '900px',
    margin: '0 auto 30px auto',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  logoBadge: {
    width: '56px',
    height: '56px',
    borderRadius: '10px',
    backgroundColor: '#fee2e2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
  },
  panelSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: '4px 0 0 0',
  },
  gridForm: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
  },
  togglesBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '20px',
  },
  togglesTitle: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  togglesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '10px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#1e293b',
    fontWeight: '600',
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    accentColor: '#881337',
    cursor: 'pointer',
  },
  printBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#881337',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(136, 19, 55, 0.25)',
  },
  invoiceWrapper: {
    display: 'flex',
    justifyContent: 'center',
  },
  invoiceCard: {
    width: '850px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '36px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
  },
  invoiceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandTitle: {
    fontSize: '22px',
    fontWeight: '900',
    color: '#881337',
    letterSpacing: '1px',
  },
  brandSub: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px',
  },
  badgeQuote: {
    display: 'inline-block',
    backgroundColor: '#fef2f2',
    color: '#881337',
    padding: '4px 10px',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '12px',
    border: '1px solid #fecaca',
  },
  dateText: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#e2e8f0',
    margin: '20px 0',
  },
  clientDetailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    backgroundColor: '#f8fafc',
    padding: '14px',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  detailLabel: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: '2px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '24px',
  },
  thRow: {
    borderBottom: '2px solid #881337',
  },
  th: {
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#881337',
    textAlign: 'left',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '12px',
    fontSize: '13px',
    color: '#334155',
    verticalAlign: 'top',
  },
  itemDesc: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '3px',
  },
  totalSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: '18px 20px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  termsNote: {
    fontSize: '11px',
    color: '#64748b',
  },
  totalBox: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
  },
  totalLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1e293b',
  },
  totalAmount: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#881337',
  },
  footerPdf: {
    marginTop: '30px',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#94a3b8',
  },
};