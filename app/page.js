'use client';

import { useState } from 'react';

export default function Cotizador() {
  // Datos del Cliente y Carga
  const [cliente, setCliente] = useState('');
  const [producto, setProducto] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [modalidad, setModalidad] = useState('maritimo_formal'); // 'maritimo_formal' | 'maritimo_grupal' | 'aereo_courier' | 'allin_aereo'
  
  // Medidas y Pesos
  const [fob, setFob] = useState('');
  const [cbm, setCbm] = useState('');
  const [pesoKg, setPesoKg] = useState('');

  // Impuestos y Aranceles (Editables con valores por defecto)
  const [ddiPorc, setDdiPorc] = useState(20);
  const [tasaEstPorc, setTasaEstPorc] = useState(3);
  const [ivaPorc, setIvaPorc] = useState(21);
  const [ivaAddPorc, setIvaAddPorc] = useState(20);
  const [gananciaPorc, setGananciaPorc] = useState(6);
  const [iibbPorc, setIibbPorc] = useState(2.5);
  const [seguroPorc, setSeguroPorc] = useState(1);

  // Teléfono para envío
  const [telefono, setTelefono] = useState('');
  const [copiado, setCopiado] = useState(false);

  // Cálculos numéricos
  const valorFob = parseFloat(fob) || 0;
  const valorCbm = parseFloat(cbm) || 0;
  const valorKg = parseFloat(pesoKg) || 0;

  // 1. Cálculo de Flete según modalidad
  let flete = 0;
  let detalleFlete = '';

  if (modalidad === 'maritimo_formal') {
    const cbmFacturable = Math.max(valorCbm, 0.5); // Mínimo 0.5 CBM
    flete = cbmFacturable * 300;
    detalleFlete = `USD 300 x ${cbmFacturable} CBM (Mín. 0.5 CBM)`;
  } else if (modalidad === 'maritimo_grupal') {
    // 8.5 USD / kg volumétrico o real (1 CBM = 167 kg aprox o peso real)
    const pesoVolumetrico = valorCbm > 0 ? valorCbm * 167 : 0;
    const pesoFacturable = Math.max(valorKg, pesoVolumetrico);
    flete = pesoFacturable * 8.5;
    detalleFlete = `USD 8.50 x ${pesoFacturable.toFixed(1)} kg (All In Grupal)`;
  } else if (modalidad === 'aereo_courier') {
    flete = valorKg * 10;
    detalleFlete = `USD 10.00 x ${valorKg} kg (Courier)`;
  } else if (modalidad === 'allin_aereo') {
    flete = valorKg * 45;
    detalleFlete = `USD 45.00 x ${valorKg} kg (All In Aéreo)`;
  }

  // 2. Esquema Formal (Fórmula exacta de tu Excel)
  const seguro = valorFob * (parseFloat(seguroPorc) / 100);
  const valorAduanaCIF = valorFob + flete + seguro;

  // Aranceles
  const ddiUsd = valorAduanaCIF * (parseFloat(ddiPorc) / 100);
  const tasaEstUsd = valorFob * (parseFloat(tasaEstPorc) / 100);
  const baseImponibleIVA = valorAduanaCIF + ddiUsd + tasaEstUsd;

  // Tributos
  const ivaUsd = baseImponibleIVA * (parseFloat(ivaPorc) / 100);
  const ivaAddUsd = baseImponibleIVA * (parseFloat(ivaAddPorc) / 100);
  const gananciaUsd = baseImponibleIVA * (parseFloat(gananciaPorc) / 100);
  const iibbUsd = baseImponibleIVA * (parseFloat(iibbPorc) / 100);
  const subtotalTributos = ivaUsd + ivaAddUsd + gananciaUsd + iibbUsd;

  // Totales
  const esAllIn = modalidad === 'maritimo_grupal' || modalidad === 'allin_aereo';
  
  const inversionTotal = esAllIn 
    ? valorFob + flete 
    : valorAduanaCIF + ddiUsd + tasaEstUsd + subtotalTributos;

  const gastosLogisticos = inversionTotal - valorFob;

  // Mensaje para exportar a WhatsApp
  const generarTextoWhatsApp = () => {
    let msg = `*COTIZACIÓN COMEX - ${cliente ? cliente.toUpperCase() : 'CLIENTE'}*\n`;
    if (producto) msg += `📦 *Producto:* ${producto}\n`;
    if (hsCode) msg += `🏷 *Posición Arancelaria:* ${hsCode}\n`;
    msg += `🚢 *Modalidad:* ${
      modalidad === 'maritimo_formal' ? 'Marítimo LCL Formal' :
      modalidad === 'maritimo_grupal' ? 'Marítimo Grupal All In' :
      modalidad === 'aereo_courier' ? 'Aéreo Courier' : 'All In Aéreo'
    }\n\n`;

    msg += `💵 *Valor FOB:* USD ${valorFob.toFixed(2)}\n`;
    msg += `🚚 *Flete Internacional:* USD ${flete.toFixed(2)} (${detalleFlete})\n`;

    if (!esAllIn) {
      msg += `🛡 *Seguro (1%):* USD ${seguro.toFixed(2)}\n`;
      msg += `🏛 *Valor Aduana (CIF):* USD ${valorAduanaCIF.toFixed(2)}\n`;
      msg += `\n*Desglose Impuestos y Aranceles:*\n`;
      msg += `• DDI (${ddiPorc}%): USD ${ddiUsd.toFixed(2)}\n`;
      msg += `• Tasa Estad. (${tasaEstPorc}%): USD ${tasaEstUsd.toFixed(2)}\n`;
      msg += `• IVA (${ivaPorc}%): USD ${ivaUsd.toFixed(2)}\n`;
      msg += `• IVA Adic. (${ivaAddPorc}%): USD ${ivaAddUsd.toFixed(2)}\n`;
      msg += `• Ganancias (${gananciaPorc}%): USD ${gananciaUsd.toFixed(2)}\n`;
      msg += `• IIBB (${iibbPorc}%): USD ${iibbUsd.toFixed(2)}\n`;
    }

    msg += `\n═══════════════════════\n`;
    msg += `📊 *GASTOS LOGÍSTICOS / NACIONALIZACIÓN:* USD ${gastosLogisticos.toFixed(2)}\n`;
    msg += `💰 *INVERSIÓN TOTAL ESTIMADA:* USD ${inversionTotal.toFixed(2)}\n`;
    msg += `═══════════════════════\n`;
    msg += `\n_Cotización sujeta a verificación de documentación y aforo aduanero._`;
    return msg;
  };

  const copiarAlPortapapeles = () => {
    navigator.clipboard.writeText(generarTextoWhatsApp());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const enviarWhatsApp = () => {
    const num = telefono.replace(/\D/g, '');
    const texto = encodeURIComponent(generarTextoWhatsApp());
    const url = num ? `https://wa.me/${num}?text=${texto}` : `https://wa.me/?text=${texto}`;
    window.open(url, '_blank');
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-5xl space-y-6">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg gap-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">Generador de Cotizaciones COMEX</h1>
            <p className="text-xs text-slate-400">Marítimo, Aéreo, Importación Grupal y Desglose Arancelario</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Modalidad:</span>
            <select
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-emerald-400 text-sm font-semibold rounded-lg px-3 py-2 outline-none"
            >
              <option value="maritimo_formal">Marítimo LCL Formal ($300/CBM)</option>
              <option value="maritimo_grupal">Marítimo Grupal All In ($8.5/kg)</option>
              <option value="aereo_courier">Aéreo Courier ($10/kg)</option>
              <option value="allin_aereo">All In Aéreo ($45/kg)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Panel Izquierdo: Formulario de Entrada */}
          <div className="md:col-span-5 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
              1. Datos de la Operación
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold">Cliente</label>
                <input
                  type="text"
                  placeholder="Ej: Adrián"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold">Producto</label>
                <input
                  type="text"
                  placeholder="Ej: Repuestos"
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold">Valor FOB ($)</label>
                <input
                  type="number"
                  placeholder="380"
                  value={fob}
                  onChange={(e) => setFob(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold">Volumen (M3)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.38"
                  value={cbm}
                  onChange={(e) => setCbm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold">Peso (Kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="50"
                  value={pesoKg}
                  onChange={(e) => setPesoKg(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold">Posición Arancelaria (NCM / HS Code)</label>
              <input
                type="text"
                placeholder="Ej: 8409.91.90"
                value={hsCode}
                onChange={(e) => setHsCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono outline-none focus:border-emerald-500"
              />
            </div>

            {/* Impuestos editables si es modalidad formal */}
            {!esAllIn && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Alícuotas e Impuestos (%)
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">DDI %</span>
                    <input
                      type="number"
                      value={ddiPorc}
                      onChange={(e) => setDdiPorc(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">T. Estad. %</span>
                    <input
                      type="number"
                      value={tasaEstPorc}
                      onChange={(e) => setTasaEstPorc(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">IVA %</span>
                    <input
                      type="number"
                      value={ivaPorc}
                      onChange={(e) => setIvaPorc(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">IVA Adic. %</span>
                    <input
                      type="number"
                      value={ivaAddPorc}
                      onChange={(e) => setIvaAddPorc(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">Ganancias %</span>
                    <input
                      type="number"
                      value={gananciaPorc}
                      onChange={(e) => setGananciaPorc(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">IIBB %</span>
                    <input
                      type="number"
                      value={iibbPorc}
                      onChange={(e) => setIibbPorc(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Panel Derecho: Planilla Desglosada y Totales */}
          <div className="md:col-span-7 bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2 mb-3">
                2. Liquidación y Cuadro Tributario
              </h2>

              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Valor FOB Declarado:</span>
                  <span>USD {valorFob.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Flete Internacional:</span>
                  <span>USD {flete.toFixed(2)}</span>
                </div>

                {!esAllIn && (
                  <>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Seguro ({seguroPorc}%):</span>
                      <span>USD {seguro.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 bg-slate-800/40 px-2 rounded font-semibold text-emerald-300">
                      <span>Valor de Aduana (CIF):</span>
                      <span>USD {valorAduanaCIF.toFixed(2)}</span>
                    </div>

                    <div className="pt-2 text-xs text-slate-400 font-sans font-semibold uppercase">Aranceles y Tributos</div>
                    <div className="flex justify-between text-xs py-0.5 text-slate-300">
                      <span>Derecho de Importación ({ddiPorc}%):</span>
                      <span>USD {ddiUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5 text-slate-300">
                      <span>Tasa de Estadística ({tasaEstPorc}%):</span>
                      <span>USD {tasaEstUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5 text-slate-300">
                      <span>IVA ({ivaPorc}%):</span>
                      <span>USD {ivaUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5 text-slate-300">
                      <span>IVA Adicional ({ivaAddPorc}%):</span>
                      <span>USD {ivaAddUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5 text-slate-300">
                      <span>Ganancias ({gananciaPorc}%):</span>
                      <span>USD {gananciaUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5 text-slate-300">
                      <span>IIBB ({iibbPorc}%):</span>
                      <span>USD {iibbUsd.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Totales Resaltados */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-950/40 border border-amber-800/60 p-3 rounded-xl">
                  <span className="text-xs font-semibold text-amber-400 uppercase">Gastos Logísticos</span>
                  <p className="text-xl font-bold text-amber-200">USD {gastosLogisticos.toFixed(2)}</p>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl">
                  <span className="text-xs font-semibold text-emerald-400 uppercase">Inversión Total</span>
                  <p className="text-2xl font-bold text-emerald-300">USD {inversionTotal.toFixed(2)}</p>
                </div>
              </div>

              {/* Acciones para WhatsApp */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <input
                  type="tel"
                  placeholder="Teléfono cliente (Ej: 549351...)"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs flex-1 outline-none"
                />
                <button
                  onClick={enviarWhatsApp}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md"
                >
                  Enviar WhatsApp →
                </button>
                <button
                  onClick={copiarAlPortapapeles}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl text-xs border border-slate-700"
                >
                  {copiado ? '✓ Copiado' : 'Copiar Texto'}
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}