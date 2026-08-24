'use client';

import { useState, useEffect } from 'react';

export default function Cotizador() {
  // Estado principal
  const [cliente, setCliente] = useState('');
  const [producto, setProducto] = useState('');
  const [palabraBusqueda, setPalabraBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [hsCode, setHsCode] = useState('');
  const [modalidad, setModalidad] = useState('maritimo_formal');
  const [fob, setFob] = useState('');
  const [cbm, setCbm] = useState('');
  const [pesoKg, setPesoKg] = useState('');

  // Impuestos y Aranceles
  const [ddiPorc, setDdiPorc] = useState(20);
  const [tasaEstPorc, setTasaEstPorc] = useState(3);
  const [ivaPorc, setIvaPorc] = useState(21);
  const [ivaAddPorc, setIvaAddPorc] = useState(20);
  const [gananciaPorc, setGananciaPorc] = useState(6);
  const [iibbPorc, setIibbPorc] = useState(2.5);
  const [seguroPorc, setSeguroPorc] = useState(1);

  // Teléfono
  const [telefono, setTelefono] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [descripcionSeleccionada, setDescripcionSeleccionada] = useState('');

  // Buscar en API
  const buscarEnVUCE = async () => {
    if (palabraBusqueda.length < 3) return;

    setBuscando(true);
    setMostrarResultados(true);

    try {
      const response = await fetch('/api/vuce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ palabra: palabraBusqueda }),
      });

      if (!response.ok) throw new Error('Error en la búsqueda');

      const data = await response.json();
      if (data.resultados && data.resultados.length > 0) {
        setResultadosBusqueda(data.resultados);
      } else {
        setResultadosBusqueda([]);
      }
    } catch (error) {
      console.error('Error al buscar:', error);
      setResultadosBusqueda([]);
    } finally {
      setBuscando(false);
    }
  };

  // Seleccionar posición arancelaria
  const seleccionarArancel = (resultado) => {
    setHsCode(resultado.ncm);
    setDescripcionSeleccionada(resultado.descripcion);

    if (resultado.aranceles) {
      setDdiPorc(resultado.aranceles.ddi || 20);
      setTasaEstPorc(resultado.aranceles.tasaEst || 3);
      setIvaPorc(resultado.aranceles.iva || 21);
      setIvaAddPorc(resultado.aranceles.ivaAdd || 20);
      setGananciaPorc(resultado.aranceles.ganancias || 6);
      setIibbPorc(resultado.aranceles.iibb || 2.5);
    }

    setMostrarResultados(false);
    setPalabraBusqueda('');
  };

  // Efecto debounce para búsqueda al tipear
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (palabraBusqueda.length >= 3) {
        buscarEnVUCE();
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [palabraBusqueda]);

  // Cálculos matemáticos
  const valorFob = parseFloat(fob) || 0;
  const valorCbm = parseFloat(cbm) || 0;
  const valorKg = parseFloat(pesoKg) || 0;

  let flete = 0;
  let detalleFlete = '';

  if (modalidad === 'maritimo_formal') {
    const cbmFacturable = Math.max(valorCbm, 0.5);
    flete = cbmFacturable * 300;
    detalleFlete = `USD 300 x ${cbmFacturable} CBM (Mín. 0.5 CBM)`;
  } else if (modalidad === 'maritimo_grupal') {
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

  const seguro = valorFob * (parseFloat(seguroPorc) / 100);
  const valorAduanaCIF = valorFob + flete + seguro;
  const ddiUsd = valorAduanaCIF * (parseFloat(ddiPorc) / 100);
  const tasaEstUsd = valorFob * (parseFloat(tasaEstPorc) / 100);
  const baseImponibleIVA = valorAduanaCIF + ddiUsd + tasaEstUsd;
  const ivaUsd = baseImponibleIVA * (parseFloat(ivaPorc) / 100);
  const ivaAddUsd = baseImponibleIVA * (parseFloat(ivaAddPorc) / 100);
  const gananciaUsd = baseImponibleIVA * (parseFloat(gananciaPorc) / 100);
  const iibbUsd = baseImponibleIVA * (parseFloat(iibbPorc) / 100);
  const subtotalTributos = ivaUsd + ivaAddUsd + gananciaUsd + iibbUsd;

  const esAllIn = modalidad === 'maritimo_grupal' || modalidad === 'allin_aereo';
  const inversionTotal = esAllIn
    ? valorFob + flete
    : valorAduanaCIF + ddiUsd + tasaEstUsd + subtotalTributos;
  const gastosLogisticos = inversionTotal - valorFob;

  // Generar mensaje comercial
  const generarTextoWhatsApp = () => {
    const tituloModalidad =
      modalidad === 'maritimo_formal' ? 'Marítimo LCL' :
      modalidad === 'maritimo_grupal' ? 'Marítimo Grupal All In' :
      modalidad === 'aereo_courier' ? 'Aéreo Courier' : 'All In Aéreo';

    let msg = `📦 COTIZACIÓN — ${tituloModalidad}\n`;
    if (cliente) msg += `👤 Cliente: ${cliente}\n`;
    if (producto) msg += `🏷️ Producto: ${producto}\n`;
    if (hsCode) msg += `📑 Posición Arancelaria: ${hsCode}\n`;
    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `🚢 Flete internacional: USD ${flete.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;

    if (!esAllIn) {
      msg += `🛡️ Seguro (${seguroPorc}%): USD ${seguro.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      msg += `🧾 Impuestos de importación (estimados):\n`;
      msg += `   • Derechos (DI): USD ${ddiUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      msg += `   • Tasa estadística (TE): USD ${tasaEstPorc > 0 ? tasaEstUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Exenta'}\n`;
      msg += `   • IVA (${ivaPorc}%): USD ${ivaUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      msg += `   • IVA adicional (${ivaAddPorc}%): USD ${ivaAddUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      msg += `   • Percepción Ganancias (${gananciaPorc}%): USD ${gananciaUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      msg += `   • Percepción IIBB (${iibbPorc}%): USD ${iibbUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    }

    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `💰 TOTAL estimado: USD ${gastosLogisticos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `Incluye coordinación con tu proveedor, consolidación, flete, firma importadora y despacho aduanero.\n`;
    if (valorFob > 0) {
      msg += `ℹ️ No incluye el valor de la mercadería (USD ${valorFob.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}), que le pagás al proveedor.\n`;
    }
    msg += `⚠️ Los impuestos son una estimación automática según el producto, sujeta a confirmación del despachante antes de cerrar la operación.`;

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
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">Generador de Cotizaciones COMEX</h1>
            <p className="text-xs text-slate-400">Búsqueda automática de Aranceles - Marítimo, Aéreo y All In</p>
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
          {/* Formulario */}
          <div className="md:col-span-5 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
              1. Datos de la Operación
            </h2>

            {/* Búsqueda arancelaria */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">🔍 Buscar por Producto o NCM</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: repuestos, smartphones, 8708..."
                  value={palabraBusqueda}
                  onChange={(e) => setPalabraBusqueda(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 pr-10"
                />
                {buscando && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-400 border-t-transparent"></div>
                  </div>
                )}
              </div>

              {mostrarResultados && resultadosBusqueda.length > 0 && (
                <div className="bg-slate-800 rounded-lg border border-slate-700 max-h-48 overflow-y-auto mt-1 shadow-lg">
                  {resultadosBusqueda.map((resultado, index) => (
                    <div
                      key={index}
                      onClick={() => seleccionarArancel(resultado)}
                      className="p-2.5 hover:bg-slate-700 cursor-pointer border-b border-slate-700/60 last:border-0"
                    >
                      <div className="text-xs">
                        <span className="text-emerald-400 font-mono font-bold">{resultado.ncm}</span>
                        <p className="text-slate-300 truncate">{resultado.descripcion}</p>
                        <div className="flex gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                          <span>DDI: {resultado.aranceles?.ddi}%</span>
                          <span>IVA: {resultado.aranceles?.iva}%</span>
                          <span>IIBB: {resultado.aranceles?.iibb}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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

            {descripcionSeleccionada && (
              <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-2">
                <p className="text-[10px] text-emerald-400 font-semibold uppercase">NCM Seleccionada:</p>
                <p className="text-xs text-slate-300">{descripcionSeleccionada}</p>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 font-semibold">Posición Arancelaria (NCM)</label>
              <input
                type="text"
                placeholder="Ej: 8708.99.90"
                value={hsCode}
                onChange={(e) => setHsCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono outline-none focus:border-emerald-500"
              />
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

            {/* Impuestos editables */}
            {!esAllIn && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Alícuotas e Impuestos (%)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    {hsCode ? '✓ Actualizado' : 'Valores por defecto'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">DDI</span>
                    <input
                      type="number"
                      value={ddiPorc}
                      onChange={(e) => setDdiPorc(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1 font-mono text-emerald-400"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">T. Estad.</span>
                    <input
                      type="number"
                      value={tasaEstPorc}
                      onChange={(e) => setTasaEstPorc(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1 font-mono text-emerald-400"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">IVA</span>
                    <input
                      type="number"
                      value={ivaPorc}
                      onChange={(e) => setIvaPorc(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1 font-mono text-emerald-400"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">IVA Adic.</span>
                    <input
                      type="number"
                      value={ivaAddPorc}
                      onChange={(e) => setIvaAddPorc(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1 font-mono text-emerald-400"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">Ganancias</span>
                    <input
                      type="number"
                      value={gananciaPorc}
                      onChange={(e) => setGananciaPorc(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1 font-mono text-emerald-400"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">IIBB</span>
                    <input
                      type="number"
                      value={iibbPorc}
                      onChange={(e) => setIibbPorc(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1 font-mono text-emerald-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Liquidación */}
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
                      <span className="text-emerald-400">USD {ddiUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5 text-slate-300">
                      <span>Tasa de Estadística ({tasaEstPorc}%):</span>
                      <span className="text-emerald-400">USD {tasaEstPorc > 0 ? tasaEstUsd.toFixed(2) : '0.00 (Exenta)'}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5 text-slate-300">
                      <span>IVA ({ivaPorc}%):</span>
                      <span className="text-emerald-400">USD {ivaUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5 text-slate-300">
                      <span>IVA Adicional ({ivaAddPorc}%):</span>
                      <span className="text-emerald-400">USD {ivaAddUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5 text-slate-300">
                      <span>Ganancias ({gananciaPorc}%):</span>
                      <span className="text-emerald-400">USD {gananciaUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5 text-slate-300">
                      <span>IIBB ({iibbPorc}%):</span>
                      <span className="text-emerald-400">USD {iibbUsd.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Totales y Acciones */}
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