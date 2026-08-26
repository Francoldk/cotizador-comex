'use client';

import { useState } from 'react';

export default function Cotizador() {
  // Datos del Cliente y Mercadería
  const [clientName, setClientName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [hscode, setHscode] = useState('');
  const [fobValue, setFobValue] = useState(1000);
  
  // Medidas y Pesos
  const [weightKg, setWeightKg] = useState(50);
  const [cbm, setCbm] = useState(0.5);

  // Modalidad y Tarifas
  const [shippingMode, setShippingMode] = useState('maritimo_compartido');
  const [unitFreightRate, setUnitFreightRate] = useState(8.5);

  // Alícuotas Impositivas
  const [ddiRate, setDdiRate] = useState(16);
  const [statRate, setStatRate] = useState(3);
  const [ivaRate, setIvaRate] = useState(21);
  const [ivaAdicRate, setIvaAdicRate] = useState(20);
  const [gananciasRate, setGananciasRate] = useState(6);
  const [iibbRate, setIibbRate] = useState(2.5);

  // Gastos Locales y Gestión
  const [localExpenses, setLocalExpenses] = useState(250);
  const [serviceFee, setServiceFee] = useState(150);
  const [copiado, setCopiado] = useState(false);

  // Cambiar tarifas base según la modalidad
  const handleModeChange = (mode) => {
    setShippingMode(mode);
    switch (mode) {
      case 'maritimo_compartido':
        setUnitFreightRate(8.5); // USD por Peso Volumétrico
        break;
      case 'maritimo_cbm':
        setUnitFreightRate(350); // USD por CBM (300-400)
        break;
      case 'courier_aereo':
        setUnitFreightRate(16.5); // USD por Kg (15-18)
        break;
      case 'all_in_aereo':
        setUnitFreightRate(48); // USD por Kg (45-50)
        break;
    }
  };

  // Cálculos
  const volumetricWeight = Number((cbm * 167).toFixed(2));
  const chargeableWeight = Math.max(weightKg, volumetricWeight);

  let internationalFreight = 0;
  if (shippingMode === 'maritimo_compartido') {
    internationalFreight = chargeableWeight * unitFreightRate;
  } else if (shippingMode === 'maritimo_cbm') {
    internationalFreight = cbm * unitFreightRate;
  } else if (shippingMode === 'courier_aereo' || shippingMode === 'all_in_aereo') {
    internationalFreight = Math.max(weightKg, volumetricWeight) * unitFreightRate;
  }

  const insurance = Number(((fobValue + internationalFreight) * 0.01).toFixed(2));
  const cifValue = fobValue + internationalFreight + insurance;
  const isAllIn = shippingMode === 'all_in_aereo';

  const ddiAmount = isAllIn ? 0 : Number((cifValue * (ddiRate / 100)).toFixed(2));
  const statAmount = isAllIn ? 0 : Number((cifValue * (statRate / 100)).toFixed(2));
  const taxBase = isAllIn ? 0 : cifValue + ddiAmount + statAmount;

  const ivaAmount = isAllIn ? 0 : Number((taxBase * (ivaRate / 100)).toFixed(2));
  const ivaAdicAmount = isAllIn ? 0 : Number((taxBase * (ivaAdicRate / 100)).toFixed(2));
  const gananciasAmount = isAllIn ? 0 : Number((taxBase * (gananciasRate / 100)).toFixed(2));
  const iibbAmount = isAllIn ? 0 : Number((taxBase * (iibbRate / 100)).toFixed(2));

  const totalTaxes = ddiAmount + statAmount + ivaAmount + ivaAdicAmount + gananciasAmount + iibbAmount;
  const grandTotal = cifValue + totalTaxes + (isAllIn ? 0 : localExpenses) + serviceFee;

  // Texto para WhatsApp
  const generarTextoResumen = () => {
    return `*COTIZACIÓN DE IMPORTACIÓN - DE CHINA AL MUNDO*
----------------------------------------
👤 *Cliente:* ${clientName || 'Consumidor Final'}
📦 *Producto:* ${productDesc || 'Mercadería General'}
📑 *Posición Arancelaria:* ${hscode || 'A clasificar'}
🚢 *Modalidad:* ${
      shippingMode === 'maritimo_compartido' ? 'Carga Compartida Marítimo (LCL)' :
      shippingMode === 'maritimo_cbm' ? 'Carga Marítima por CBM' :
      shippingMode === 'courier_aereo' ? 'Courier Aéreo Express' : 'All In Aéreo'
    }
----------------------------------------
💵 *Valor FOB:* $${fobValue.toFixed(2)} USD
✈️ *Flete Internacional:* $${internationalFreight.toFixed(2)} USD
🛡️ *Seguro Estimado:* $${insurance.toFixed(2)} USD
🏛️ *Impuestos y Aduana:* $${totalTaxes.toFixed(2)} USD
🏢 *Gastos y Gestión:* $${((isAllIn ? 0 : localExpenses) + serviceFee).toFixed(2)} USD
----------------------------------------
💰 *TOTAL ESTIMADO:* $${grandTotal.toFixed(2)} USD`;
  };

  const copiarAlPortapapeles = () => {
    navigator.clipboard.writeText(generarTextoResumen());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const enviarWhatsApp = () => {
    const texto = encodeURIComponent(generarTextoResumen());
    window.open(`https://wa.me/?text=${texto}`, '_blank');
  };

  return (
    <div style={styles.container}>
      <style>{`
        @media print {
          body { background: #fff !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .print-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* PANEL DE FORMULARIO */}
      <div style={styles.panel} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '36px', objectFit: 'contain' }} />
          <div>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>Cotizador Comex - De China al Mundo</h2>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Cálculo rápido de fletes, cascada impositiva y honorarios</p>
          </div>
        </div>

        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>Cliente / Razón Social:</label>
            <input style={styles.input} type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ej: Transportes SRL" />
          </div>
          <div>
            <label style={styles.label}>Producto / Descripción:</label>
            <input style={styles.input} type="text" value={productDesc} onChange={(e) => setProductDesc(e.target.value)} placeholder="Ej: Repuestos de autos" />
          </div>
          <div>
            <label style={styles.label}>Posición Arancelaria (NCM):</label>
            <input style={styles.input} type="text" value={hscode} onChange={(e) => setHscode(e.target.value)} placeholder="Ej: 8708.99.90" />
          </div>
          <div>
            <label style={styles.label}>Valor FOB Total (USD):</label>
            <input style={styles.input} type="number" value={fobValue} onChange={(e) => setFobValue(Number(e.target.value))} />
          </div>
          <div>
            <label style={styles.label}>Peso Real (Kg):</label>
            <input style={styles.input} type="number" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} />
          </div>
          <div>
            <label style={styles.label}>Volumen ($m^3$ / CBM):</label>
            <input style={styles.input} type="number" step="0.01" value={cbm} onChange={(e) => setCbm(Number(e.target.value))} />
          </div>
        </div>

        {/* MODALIDAD */}
        <div style={{ marginTop: '16px' }}>
          <label style={styles.label}>Seleccionar Modalidad de Envío:</label>
          <div style={styles.modeGrid}>
            <button type="button" style={shippingMode === 'maritimo_compartido' ? styles.modeBtnActive : styles.modeBtn} onClick={() => handleModeChange('maritimo_compartido')}>
              🚢 Compartido Marítimo
              <span style={styles.subtext}>8.5 USD / Peso Vol.</span>
            </button>
            <button type="button" style={shippingMode === 'maritimo_cbm' ? styles.modeBtnActive : styles.modeBtn} onClick={() => handleModeChange('maritimo_cbm')}>
              📦 Marítimo ($m^3$)
              <span style={styles.subtext}>300 - 400 USD / CBM</span>
            </button>
            <button type="button" style={shippingMode === 'courier_aereo' ? styles.modeBtnActive : styles.modeBtn} onClick={() => handleModeChange('courier_aereo')}>
              ✈️ Courier Aéreo
              <span style={styles.subtext}>15 - 18 USD / Kg</span>
            </button>
            <button type="button" style={shippingMode === 'all_in_aereo' ? styles.modeBtnActive : styles.modeBtn} onClick={() => handleModeChange('all_in_aereo')}>
              🚀 All In Aéreo
              <span style={styles.subtext}>45 - 50 USD / Kg</span>
            </button>
          </div>
        </div>

        {/* ALÍCUOTAS Y TARIFA */}
        <div style={{ ...styles.formGrid, marginTop: '16px' }}>
          <div>
            <label style={styles.label}>Tarifa USD Unidad:</label>
            <input style={styles.input} type="number" step="0.1" value={unitFreightRate} onChange={(e) => setUnitFreightRate(Number(e.target.value))} />
          </div>
          {!isAllIn && (
            <>
              <div>
                <label style={styles.label}>% DDI:</label>
                <input style={styles.input} type="number" value={ddiRate} onChange={(e) => setDdiRate(Number(e.target.value))} />
              </div>
              <div>
                <label style={styles.label}>% Tasa Estadística:</label>
                <input style={styles.input} type="number" value={statRate} onChange={(e) => setStatRate(Number(e.target.value))} />
              </div>
              <div>
                <label style={styles.label}>Gastos Locales (USD):</label>
                <input style={styles.input} type="number" value={localExpenses} onChange={(e) => setLocalExpenses(Number(e.target.value))} />
              </div>
            </>
          )}
          <div>
            <label style={styles.label}>Gestión / Fee (USD):</label>
            <input style={styles.input} type="number" value={serviceFee} onChange={(e) => setServiceFee(Number(e.target.value))} />
          </div>
        </div>

        {/* ACCIONES */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button style={styles.printBtn} onClick={() => window.print()}>
            🖨️ Imprimir / Guardar PDF
          </button>
          <button style={styles.waBtn} onClick={enviarWhatsApp}>
            💬 Enviar por WhatsApp
          </button>
          <button style={styles.copyBtn} onClick={copiarAlPortapapeles}>
            {copiado ? '✅ Copiado' : '📋 Copiar Resumen'}
          </button>
        </div>
      </div>

      {/* PLANILLA EJECUTIVA IMPRIMIBLE */}
      <div style={styles.quoteCard} className="print-sheet">
        <div style={styles.quoteHeader}>
          <img src="/logo.png" alt="De China Al Mundo" style={{ maxHeight: '55px', objectFit: 'contain' }} />
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ margin: 0, fontSize: '18px', color: '#881337', fontWeight: '900' }}>COTIZACIÓN DE IMPORTACIÓN</h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
              Fecha: {new Date().toLocaleDateString('es-AR')} | Ref: DCAM-{Math.floor(1000 + Math.random() * 9000)}
            </p>
          </div>
        </div>

        <hr style={styles.hrDivider} />

        <div style={styles.twoColGrid}>
          <div>
            <h3 style={styles.sectionHeading}>DATOS DEL CLIENTE</h3>
            <p style={styles.dataRow}><strong>Cliente:</strong> {clientName || 'Consumidor Final'}</p>
            <p style={styles.dataRow}><strong>Producto:</strong> {productDesc || 'Mercadería General'}</p>
            <p style={styles.dataRow}><strong>Posición:</strong> {hscode || 'A clasificar'}</p>
          </div>
          <div>
            <h3 style={styles.sectionHeading}>DETALLE LOGÍSTICO</h3>
            <p style={styles.dataRow}>
              <strong>Modalidad:</strong> {
                shippingMode === 'maritimo_compartido' ? 'Carga Compartida Marítimo' :
                shippingMode === 'maritimo_cbm' ? 'Carga Marítima por CBM' :
                shippingMode === 'courier_aereo' ? 'Courier Aéreo Express' : 'All In Aéreo'
              }
            </p>
            <p style={styles.dataRow}><strong>Peso / Vol.:</strong> {weightKg} kg | {cbm} $m^3$</p>
            <p style={styles.dataRow}><strong>Peso Facturable:</strong> {chargeableWeight} kg</p>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>CONCEPTO</th>
              <th style={styles.thCenter}>BASE / ALÍCUOTA</th>
              <th style={styles.thRight}>TOTAL (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>Valor FOB Mercadería</td>
              <td style={styles.tdCenter}>-</td>
              <td style={styles.tdRight}>${fobValue.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={styles.td}>Flete Internacional</td>
              <td style={styles.tdCenter}>Tarifa: ${unitFreightRate}</td>
              <td style={styles.tdRight}>${internationalFreight.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={styles.td}>Seguro Internacional Estimado</td>
              <td style={styles.tdCenter}>1.00%</td>
              <td style={styles.tdRight}>${insurance.toFixed(2)}</td>
            </tr>
            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
              <td style={styles.td}>VALOR CIF ADUANA</td>
              <td style={styles.tdCenter}>FOB + Flete + Seguro</td>
              <td style={styles.tdRight}>${cifValue.toFixed(2)}</td>
            </tr>

            {!isAllIn ? (
              <>
                <tr>
                  <td style={styles.td}>Derechos de Importación (DDI)</td>
                  <td style={styles.tdCenter}>{ddiRate}%</td>
                  <td style={styles.tdRight}>${ddiAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={styles.td}>Tasa de Estadística</td>
                  <td style={styles.tdCenter}>{statRate}%</td>
                  <td style={styles.tdRight}>${statAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={styles.td}>IVA General</td>
                  <td style={styles.tdCenter}>{ivaRate}%</td>
                  <td style={styles.tdRight}>${ivaAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={styles.td}>IVA Adicional</td>
                  <td style={styles.tdCenter}>{ivaAdicRate}%</td>
                  <td style={styles.tdRight}>${ivaAdicAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={styles.td}>Percepción Ganancias</td>
                  <td style={styles.tdCenter}>{gananciasRate}%</td>
                  <td style={styles.tdRight}>${gananciasAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={styles.td}>Percepción IIBB</td>
                  <td style={styles.tdCenter}>{iibbRate}%</td>
                  <td style={styles.tdRight}>${iibbAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={styles.td}>Gastos Locales / Puerto / Despacho</td>
                  <td style={styles.tdCenter}>Fijo estimado</td>
                  <td style={styles.tdRight}>${localExpenses.toFixed(2)}</td>
                </tr>
              </>
            ) : (
              <tr>
                <td style={styles.td}>Servicio Integral Aduanero / Impuestos</td>
                <td style={styles.tdCenter}>Incluido en modalidad All In</td>
                <td style={styles.tdRight}>$0.00</td>
              </tr>
            )}

            <tr>
              <td style={styles.td}>Gestión Integral & Coordinación DCAM</td>
              <td style={styles.tdCenter}>Honorarios</td>
              <td style={styles.tdRight}>${serviceFee.toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={styles.tfootRow}>
              <td colSpan={2} style={styles.tdTotalLabel}>TOTAL ESTIMADO DE LA OPERACIÓN (USD):</td>
              <td style={styles.tdTotalValue}>${grandTotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div style={styles.notesBox}>
          <strong>Términos & Condiciones:</strong>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', fontSize: '11px', color: '#475569' }}>
            <li>Cotización válida por 7 días hábiles sujeta a variación de fletes.</li>
            <li>Valores tributarios definitivos sujetos a oficialización ante DGA.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#0f172a', padding: '24px', fontFamily: 'sans-serif' },
  panel: { background: '#1e293b', borderRadius: '12px', padding: '24px', maxWidth: '900px', margin: '0 auto 30px auto', border: '1px solid #334155' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' },
  label: { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px' },
  input: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: '#0f172a', border: '1px solid #475569', borderRadius: '6px', color: '#fff', fontSize: '13px' },
  modeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' },
  modeBtn: { background: '#0f172a', border: '1px solid #475569', borderRadius: '8px', padding: '10px', color: '#cbd5e1', cursor: 'pointer', textAlign: 'left' },
  modeBtnActive: { background: '#881337', border: '1px solid #f43f5e', borderRadius: '8px', padding: '10px', color: '#fff', cursor: 'pointer', textAlign: 'left' },
  subtext: { display: 'block', fontSize: '10px', color: '#fbbf24', marginTop: '2px' },
  printBtn: { flex: 1, background: '#b91c1c', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  waBtn: { flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  copyBtn: { flex: 1, background: '#334155', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  quoteCard: { background: '#ffffff', borderRadius: '12px', padding: '30px', maxWidth: '850px', margin: '0 auto', color: '#1e293b' },
  quoteHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  hrDivider: { border: 'none', borderTop: '2px solid #881337', margin: '14px 0' },
  twoColGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' },
  sectionHeading: { fontSize: '11px', fontWeight: '900', color: '#881337', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '6px' },
  dataRow: { fontSize: '11px', margin: '2px 0', color: '#334155' },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: '16px' },
  thRow: { background: '#881337', color: '#fff' },
  th: { padding: '6px 8px', fontSize: '11px', textAlign: 'left' },
  thCenter: { padding: '6px 8px', fontSize: '11px', textAlign: 'center' },
  thRight: { padding: '6px 8px', fontSize: '11px', textAlign: 'right' },
  td: { padding: '6px 8px', fontSize: '11px', borderBottom: '1px solid #f1f5f9' },
  tdCenter: { padding: '6px 8px', fontSize: '11px', textAlign: 'center', borderBottom: '1px solid #f1f5f9', color: '#64748b' },
  tdRight: { padding: '6px 8px', fontSize: '11px', textAlign: 'right', borderBottom: '1px solid #f1f5f9' },
  tfootRow: { background: '#f8fafc', borderTop: '2px solid #881337' },
  tdTotalLabel: { padding: '8px', fontSize: '12px', fontWeight: 'bold', textAlign: 'right', color: '#881337' },
  tdTotalValue: { padding: '8px', fontSize: '15px', fontWeight: '900', textAlign: 'right', color: '#881337' },
  notesBox: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px' }
};