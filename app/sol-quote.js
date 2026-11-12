import { useEffect, useState } from 'react';
import { calculateSol, solDefaults, solModes } from './sol-pricing.mjs';

const format = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const settingsKey = 'cotizador-comex:sol-rates';
const usd = value => `USD ${format.format(value)}`;

function Field({ label, value, onChange, styles, numeric = false }) {
  return (
    <label style={styles.label}>
      {label}
      <input style={{ ...styles.input, marginTop: 4 }} type={numeric ? 'number' : 'text'}
        min={numeric ? '0' : undefined} step={numeric ? 'any' : undefined}
        value={value} onChange={event => onChange(event.target.value)} />
    </label>
  );
}

export default function SolQuote({
  active, styles, clientName, clientPhone, product, hscode, weight, volume, goods,
  exchangeRate, exchangeRateLabel, sending, send
}) {
  const [mode, setMode] = useState('courier');
  const [settings, setSettings] = useState(solDefaults);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(settingsKey));
      if (stored) setSettings({ ...solDefaults, ...stored, rates: { ...solDefaults.rates, ...stored.rates } });
    } catch {
      // Browser storage may be unavailable.
    }
    setSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    try {
      window.localStorage.setItem(settingsKey, JSON.stringify({
        ...Object.fromEntries(Object.entries(settings).filter(([, value]) => value !== '')),
        rates: Object.fromEntries(Object.entries(settings.rates).filter(([, value]) => value !== ''))
      }));
    } catch {
      // Keep edits usable in the current session.
    }
  }, [settings, settingsLoaded]);
  const [showFob, setShowFob] = useState(true);
  const [proforma, setProforma] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [document, setDocument] = useState({
    reference: '', issuer: 'De China al Mundo', issuerId: '', issuerAddress: '',
    buyerId: '', buyerAddress: '', quantity: '1', place: '', terms: '', validity: '7'
  });

  const fixed = mode === 'all';
  const quote = calculateSol({ mode, settings, goods, weight, volume });
  const error = quote.error || (!product.trim() ? 'Ingresá la descripción del producto.' : '');
  const invoiceError = proforma && (
    ![document.reference, document.issuer, document.issuerId, document.issuerAddress, clientName,
      document.buyerId, document.buyerAddress, document.place, document.terms].every(value => value.trim()) ||
    !(Number(document.quantity) > 0)
  );
  const title = proforma ? 'Factura proforma' : 'Cotización de importación';
  const rate = settings.rates[mode];
  const conversionLabel = showFob ? 'Equivalente con mercadería' : 'Equivalente del servicio';
  const convertedAmount = (showFob ? quote.total : quote.service) * exchangeRate;
  const date = new Date().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
  const setOption = (key, value) => setSettings(current => ({ ...current, [key]: value }));
  const setDocumentField = (key, value) => setDocument(current => ({ ...current, [key]: value }));

  const summary = () => [
    '*COTIZACIÓN DE IMPORTACIÓN - DE CHINA AL MUNDO*',
    `Cliente: ${clientName || 'Consumidor Final'}`,
    `Producto: ${product}`,
    `Modalidad: ${solModes[mode].label}`,
    weight ? `Peso real: ${weight} kg` : '',
    volume ? `Volumen: ${volume} m³` : '',
    showFob && `Mercadería FOB: ${usd(quote.fob)}`,
    ...quote.lines.map(line => `${line.label}: ${usd(line.amount)}`),
    `*Total del servicio: ${usd(quote.service)}*`,
    showFob && `*Total con mercadería: ${usd(quote.total)}*`,
    exchangeRate > 0 ? `${conversionLabel}: ARS ${format.format(convertedAmount)} (${exchangeRateLabel} ${exchangeRate})` : ''
  ].filter(Boolean).join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary());
      setCopyStatus('Resumen copiado.');
    } catch {
      setCopyStatus('No se pudo copiar el resumen.');
    }
  };

  return (
    <>
      <div className="no-print" style={{ ...styles.panel, display: active ? undefined : 'none' }}>
        <div style={styles.modeGrid} role="group" aria-label="Modalidad de envío">
          {Object.entries(solModes).map(([key, item]) => (
            <button key={key} type="button" aria-pressed={mode === key}
              style={mode === key ? styles.modeBtnActive : styles.modeBtn} onClick={() => setMode(key)}>
              {item.label}
              <span style={styles.subtext}>{settings.rates[key]} USD / {item.unit}</span>
            </button>
          ))}
        </div>
        <div style={{ ...styles.formGrid, marginTop: 16 }}>
          <Field label={fixed ? 'Precio cerrado (USD)' : `Tarifa (USD / ${solModes[mode].unit})`}
            styles={styles} numeric value={rate} onChange={value => setSettings(current => ({
              ...current, rates: { ...current.rates, [mode]: value }
            }))} />
          {(fixed ? [
            ['minKg', 'Peso mínimo (kg)'], ['maxKg', 'Peso máximo (kg)'], ['maxCbm', 'Volumen máximo (m³)']
          ] : [
            ['insurance', 'Seguro (% del FOB)'], ['taxes', 'Impuestos estimados (% del FOB)'], ['fee', 'Honorarios (USD)']
          ]).map(([key, label]) => (
            <Field key={key} label={label} styles={styles} numeric value={settings[key]}
              onChange={value => setOption(key, value)} />
          ))}
        </div>

        <div style={{ ...styles.formGrid, marginTop: 16 }}>
          <label style={styles.label}>
            Documento
            <select style={{ ...styles.select, marginTop: 4 }} value={proforma ? 'proforma' : 'quote'}
              onChange={event => setProforma(event.target.value === 'proforma')}>
              <option value="quote">Cotización comercial</option>
              <option value="proforma">Factura proforma</option>
            </select>
          </label>
          <Field label="Referencia" styles={styles} value={document.reference}
            onChange={value => setDocumentField('reference', value)} />
          <Field label="Validez (días hábiles)" styles={styles} numeric value={document.validity}
            onChange={value => setDocumentField('validity', value)} />
        </div>

        <label style={{ ...styles.checkboxLabel, marginTop: 12 }}>
          <input type="checkbox" checked={showFob} onChange={event => setShowFob(event.target.checked)} />
          Mostrar valor FOB al cliente
        </label>

        {proforma && (
          <div style={{ ...styles.formGrid, marginTop: 12 }}>
            {[
              ['issuer', 'Emisor / Razón social'], ['issuerId', 'Identificación fiscal del emisor'],
              ['issuerAddress', 'Domicilio del emisor'], ['buyerId', 'Identificación fiscal del cliente'],
              ['buyerAddress', 'Domicilio del cliente'], ['quantity', 'Cantidad de unidades'],
              ['place', 'Puerto o lugar acordado (FOB)'], ['terms', 'Condiciones de pago']
            ].map(([key, label]) => (
              <Field key={key} label={label} styles={styles} numeric={key === 'quantity'}
                value={document[key]} onChange={value => setDocumentField(key, value)} />
            ))}
          </div>
        )}

        <p role="status" style={{ color: '#fcd34d', marginTop: 12, fontSize: 13 }}>
          {error || (invoiceError ? 'Completá la referencia, los datos de ambas partes, la cantidad, el lugar FOB y las condiciones de pago para imprimir la proforma.' : copyStatus)}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
          <button type="button" style={styles.printBtn} disabled={Boolean(error || invoiceError)}
            onClick={() => window.print()}>Imprimir / Guardar PDF</button>
          <button type="button" style={styles.waBtn} disabled={Boolean(error || sending)}
            onClick={() => send(summary())}>{sending ? 'Enviando…' : 'Enviar por WhatsApp'}</button>
          <button type="button" style={styles.copyBtn} disabled={Boolean(error)}
            onClick={copy}>Copiar resumen</button>
        </div>
      </div>

      {active && !error && !invoiceError && (
        <article className="print-sheet sol-sheet" style={{ ...styles.quoteCard, overflowWrap: 'anywhere' }}>
          <header style={styles.quoteHeader}>
            <img src="/logo.png" alt="De China al Mundo" style={{ maxHeight: 55, objectFit: 'contain' }} />
            <div style={{ textAlign: 'right' }}>
              <h1 style={{ color: '#881337', fontSize: 19, fontWeight: 900 }}>{title.toUpperCase()}</h1>
              <p style={styles.dataRow}>{date}{document.reference.trim() && ` · Ref. ${document.reference}`}</p>
            </div>
          </header>
          <hr style={styles.hrDivider} />
          <div style={styles.twoColGrid}>
            <div>
              <h3 style={styles.sectionHeading}>{proforma ? 'COMPRADOR' : 'CLIENTE'}</h3>
              <p style={styles.dataRow}>{clientName || 'Consumidor Final'}</p>
              {clientPhone && <p style={styles.dataRow}>{clientPhone}</p>}
              {proforma && <p style={styles.dataRow}>{document.buyerId} · {document.buyerAddress}</p>}
            </div>
            <div>
              <h3 style={styles.sectionHeading}>EMISOR</h3>
              <p style={styles.dataRow}>{proforma ? document.issuer : 'De China al Mundo'}</p>
              {proforma && <p style={styles.dataRow}>{document.issuerId} · {document.issuerAddress}</p>}
            </div>
          </div>
          <div style={{ ...styles.twoColGrid, marginBottom: 12 }}>
            <div>
              <h3 style={styles.sectionHeading}>MERCADERÍA</h3>
              <p style={styles.dataRow}>{product}{hscode && ` · Posición ${hscode}`}</p>
              {proforma && <p style={styles.dataRow}>Cantidad: {document.quantity} · FOB {document.place}</p>}
            </div>
            <div>
              <h3 style={styles.sectionHeading}>ENVÍO</h3>
              <p style={styles.dataRow}>{solModes[mode].label}</p>
              <p style={styles.dataRow}>{weight && `${weight} kg reales`}{weight && volume && ' · '}{volume && `${volume} m³`}</p>
            </div>
          </div>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th scope="col" style={styles.th}>CONCEPTO</th>
                <th scope="col" style={styles.thCenter}>DETALLE</th>
                <th scope="col" style={styles.thRight}>IMPORTE (USD)</th>
              </tr>
            </thead>
            <tbody>
              {showFob && <tr>
                <td style={styles.td}>Mercadería FOB</td>
                <td style={styles.tdCenter}>{proforma ? `${document.quantity} u. · ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 8 }).format(quote.fob / Number(document.quantity))} USD/u.` : product}</td>
                <td style={styles.tdRight}>{format.format(quote.fob)}</td>
              </tr>}
              {quote.lines.map(line => (
                <tr key={line.label}>
                  <td style={styles.td}>{line.label}</td>
                  <td style={styles.tdCenter}>{!showFob && line.detail.endsWith('% del FOB') ? 'Estimado' : line.detail}</td>
                  <td style={styles.tdRight}>{format.format(line.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={styles.tdTotalLabel}>Total del servicio</td>
                <td style={styles.tdTotalValue}>{usd(quote.service)}</td>
              </tr>
              {showFob && <tr style={styles.tfootRow}>
                <td colSpan={2} style={styles.tdTotalLabel}>Total con mercadería</td>
                <td style={styles.tdTotalValue}>{usd(quote.total)}</td>
              </tr>}
              {exchangeRate > 0 && (
                <tr>
                  <td colSpan={2} style={styles.tdTotalLabel}>{conversionLabel} ({exchangeRateLabel} {exchangeRate})</td>
                  <td style={styles.tdTotalValue}>ARS {format.format(convertedAmount)}</td>
                </tr>
              )}
            </tfoot>
          </table>
          <div style={styles.notesBox}>
            {proforma && <p style={styles.dataRow}>Condiciones de pago: {document.terms}</p>}
            {Number(document.validity) > 0 && <p style={styles.dataRow}>Validez: {document.validity} días hábiles.</p>}
            <p style={styles.dataRow}>Importes estimados sujetos a confirmación de la mercadería y del embarque.</p>
            {fixed && <p style={styles.dataRow}>Servicio hasta Sarandí.</p>}
          </div>
        </article>
      )}
    </>
  );
}
