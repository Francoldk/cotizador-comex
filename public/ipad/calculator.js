/* ES5 calculation model. Formulas mirror app/page.js at 677c663. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.DCAMComex = factory(); }
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var modes = {
    maritimo_compartido: { label: 'Carga Compartida Marítimo (LCL)', rate: 8.5, unit: 'kg facturable' },
    maritimo_cbm: { label: 'Carga Marítima por CBM', rate: 350, unit: 'm³' },
    courier_aereo: { label: 'Courier Aéreo Express', rate: 16.5, unit: 'kg facturable' },
    all_in_aereo: { label: 'All In Aéreo', rate: 48, unit: 'kg facturable' }
  };
  function defaults() {
    return { clientName: '', clientPhone: '', productDesc: '', hscode: '', incoterm: 'FOB',
      goodsValue: '', weightKg: '', cbm: '', exchangeRate: '', useLiveRate: false,
      liveRateType: 'blue', shippingMode: 'maritimo_compartido', unitFreightRate: 8.5,
      enableGoodsValue: true, enableDdi: true, ddiRate: 16, enableStat: true, statRate: 3,
      enableIva: true, ivaRate: 21, enableIvaAdic: true, ivaAdicRate: 20,
      enableGanancias: true, gananciasRate: 6, enableIibb: true, iibbRate: 2.5,
      enableLocalExpenses: true, localExpenses: '', enableInsurance: true, serviceFee: '' };
  }
  function number(value) { var n = Number(value); return isFinite(n) ? n : 0; }
  function round(value) { return Number(value.toFixed(2)); }
  function money(value, argentina) {
    var parts = number(value).toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, argentina ? '.' : ',');
    return parts[0] + (argentina ? ',' : '.') + parts[1];
  }
  function calculate(d) {
    var c = {}, included = d.incoterm === 'CIF' || d.incoterm === 'DDP';
    c.valGoods = number(d.goodsValue); c.valWeight = number(d.weightKg); c.valCbm = number(d.cbm);
    c.valFreightRate = number(d.unitFreightRate); c.valLocalExpenses = number(d.localExpenses);
    c.valServiceFee = number(d.serviceFee); c.valExchangeRate = number(d.exchangeRate);
    c.volumetricWeight = round(c.valCbm * 167);
    c.chargeableWeight = Math.max(c.valWeight, c.volumetricWeight);
    c.internationalFreight = included ? 0 : d.shippingMode === 'maritimo_cbm' ? c.valCbm * c.valFreightRate : c.chargeableWeight * c.valFreightRate;
    c.insurance = d.enableInsurance && !included ? round((c.valGoods + c.internationalFreight) * 0.01) : 0;
    c.legalCifValue = included ? c.valGoods : c.valGoods + c.internationalFreight + c.insurance;
    c.displayedBaseValue = d.enableGoodsValue ? c.legalCifValue : c.internationalFreight + c.insurance;
    c.isAllInOrDdp = d.shippingMode === 'all_in_aereo' || d.incoterm === 'DDP';
    c.ddiAmount = !c.isAllInOrDdp && d.enableDdi ? round(c.legalCifValue * (number(d.ddiRate) / 100)) : 0;
    c.statAmount = !c.isAllInOrDdp && d.enableStat ? round(c.legalCifValue * (number(d.statRate) / 100)) : 0;
    c.taxBase = c.isAllInOrDdp ? 0 : c.legalCifValue + c.ddiAmount + c.statAmount;
    c.ivaAmount = !c.isAllInOrDdp && d.enableIva ? round(c.taxBase * (number(d.ivaRate) / 100)) : 0;
    c.ivaAdicAmount = !c.isAllInOrDdp && d.enableIvaAdic ? round(c.taxBase * (number(d.ivaAdicRate) / 100)) : 0;
    c.gananciasAmount = !c.isAllInOrDdp && d.enableGanancias ? round(c.taxBase * (number(d.gananciasRate) / 100)) : 0;
    c.iibbAmount = !c.isAllInOrDdp && d.enableIibb ? round(c.taxBase * (number(d.iibbRate) / 100)) : 0;
    c.totalTaxes = c.ddiAmount + c.statAmount + c.ivaAmount + c.ivaAdicAmount + c.gananciasAmount + c.iibbAmount;
    c.activeLocalExpenses = !c.isAllInOrDdp && d.enableLocalExpenses ? c.valLocalExpenses : 0;
    c.grandTotal = (d.enableGoodsValue ? c.valGoods : 0) + c.internationalFreight + c.insurance + c.totalTaxes + c.activeLocalExpenses + c.valServiceFee;
    c.grandTotalARS = c.grandTotal * c.valExchangeRate;
    c.exchangeRateLabel = d.useLiveRate ? 'T.C. ' + d.liveRateType.charAt(0).toUpperCase() + d.liveRateType.slice(1) : 'T.C. Manual';
    return c;
  }
  function summary(d, c) {
    var lines = ['*COTIZACIÓN DE IMPORTACIÓN - DE CHINA AL MUNDO*', '----------------------------------------',
      '👤 *Cliente:* ' + (d.clientName || 'Consumidor Final'),
      '📦 *Producto:* ' + (d.productDesc || 'Mercadería General'),
      '📑 *Posición Arancelaria:* ' + (d.hscode || 'A clasificar'),
      '🌐 *Término:* ' + d.incoterm, '🚢 *Modalidad:* ' + modes[d.shippingMode].label,
      '----------------------------------------'];
    if (d.enableGoodsValue) { lines.push('💵 *Valor Mercadería (' + d.incoterm + '):*$' + c.valGoods.toFixed(2) + ' USD'); }
    lines.push('✈️ *Flete Internacional:* $' + c.internationalFreight.toFixed(2) + ' USD');
    if (d.enableInsurance) { lines.push('🛡️ *Seguro Estimado:* $' + c.insurance.toFixed(2) + ' USD'); }
    lines.push('🏛️ *Impuestos y Aduana:* $' + c.totalTaxes.toFixed(2) + ' USD');
    if (c.activeLocalExpenses > 0) { lines.push('🏢 *Gastos Locales:* $' + c.activeLocalExpenses.toFixed(2) + ' USD'); }
    lines.push('🤝 *Honorarios DCAM:* $' + c.valServiceFee.toFixed(2) + ' USD', '----------------------------------------', '💰 *TOTAL USD:* $' + c.grandTotal.toFixed(2) + ' USD');
    if (c.valExchangeRate > 0) { lines.push('🇦🇷 *TOTAL EN PESOS (' + c.exchangeRateLabel + ' $' + c.valExchangeRate + '):*$' + money(c.grandTotalARS, true) + ' ARS'); }
    return lines.join('\n');
  }
  return { defaults: defaults, calculate: calculate, summary: summary, modes: modes, money: money };
}));
