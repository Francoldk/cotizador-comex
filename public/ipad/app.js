/* Safari / iOS 9 controller. No React, fetch, modules or clipboard dependency. */
(function () {
  'use strict';
  var model = window.DCAMComex;
  if (!model) { document.getElementById('action-status').textContent = 'No se pudo iniciar el cotizador. Recargá la página.'; return; }
  var data = model.defaults(), controls = {}, key, result, rateBusy = false,
    rateGeneration = 0, sendBusy = false, quoteView = false,
    now = new Date(), reference = 'DCAM-' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + pad(now.getHours()) + pad(now.getMinutes());
  var main = el('main'), rateStatus = el('rate-status'), status = el('action-status');
  function el(id) { return document.getElementById(id); }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function text(node, value) { node.textContent = value === null || value === undefined ? '' : String(value); }
  function show(node, visible) { node.className = node.className.replace(/\s*hidden\b/g, '') + (visible ? '' : ' hidden'); }
  function clear(node) { while (node.firstChild) { node.removeChild(node.firstChild); } }
  function node(tag, value, className) { var n = document.createElement(tag); if (value !== undefined) { text(n, value); } if (className) { n.className = className; } return n; }
  function message(value, error) { text(status, value); status.className = 'action-status' + (error ? ' error' : ''); }
  function setView(quote) {
    quoteView = quote; main.className = 'layout' + (quote ? ' quote-view' : '');
    el('edit-tab').className = quote ? '' : 'active'; el('quote-tab').className = quote ? 'active' : '';
    el('edit-tab').setAttribute('aria-pressed', quote ? 'false' : 'true');
    el('quote-tab').setAttribute('aria-pressed', quote ? 'true' : 'false');
    window.scrollTo(0, 0);
  }
  function http(method, path, payload, timeout, callback) {
    var xhr = new XMLHttpRequest(), ended = false, watchdog;
    function done(error, response) { if (!ended) { ended = true; window.clearTimeout(watchdog); callback(error, response); } }
    xhr.open(method, path, true); xhr.timeout = timeout;
    xhr.setRequestHeader('Accept', 'application/json');
    if (payload !== null) { xhr.setRequestHeader('Content-Type', 'application/json'); }
    xhr.onreadystatechange = function () {
      var response;
      if (xhr.readyState !== 4) { return; }
      try { response = JSON.parse(xhr.responseText); } catch (ignore) { done({ uncertain: method === 'POST' }); return; }
      if (xhr.status < 200 || xhr.status >= 300) { done({ uncertain: xhr.status >= 500 }); return; }
      done(null, response);
    };
    xhr.onerror = xhr.ontimeout = function () { done({ uncertain: true }); };
    watchdog = window.setTimeout(function () { done({ uncertain: true }); xhr.abort(); }, timeout + 1000);
    xhr.send(payload === null ? null : JSON.stringify(payload));
  }
  for (key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key) && el(key)) {
      controls[key] = el(key);
      if (typeof data[key] === 'boolean') { controls[key].checked = data[key]; }
      else if (data[key] === '' && controls[key].value !== '') { data[key] = controls[key].value; }
      else { controls[key].value = data[key]; }
      bind(key);
    }
  }
  function bind(name) {
    var control = controls[name];
    function update() {
      data[name] = control.type === 'checkbox' ? control.checked : control.value;
      if (!sendBusy) { message(''); }
      if (name === 'useLiveRate') {
        rateGeneration += 1; rateBusy = false;
        data.exchangeRate = ''; controls.exchangeRate.value = '';
        if (data.useLiveRate) { updateRate(); }
        else { text(rateStatus, 'Ingresá un tipo de cambio para ver el total en pesos.'); rateStatus.className = 'hint'; }
      } else if (name === 'liveRateType' && data.useLiveRate) { updateRate(); }
      render();
    }
    if (control.type === 'checkbox' || control.tagName.toLowerCase() === 'select') { control.onchange = update; }
    else { control.oninput = update; control.onchange = update; }
  }
  function updateRate() {
    var generation = ++rateGeneration, type = data.liveRateType;
    rateBusy = true; data.exchangeRate = ''; controls.exchangeRate.value = '';
    text(rateStatus, 'Consultando el dólar ' + type + '…'); rateStatus.className = 'hint'; render();
    http('GET', '/api/ipad/exchange-rate?type=' + encodeURIComponent(type) + '&_=' + new Date().getTime(), null, 15000, function (error, response) {
      var date;
      if (generation !== rateGeneration || !data.useLiveRate) { return; }
      rateBusy = false;
      if (error || !response || !isFinite(Number(response.venta)) || Number(response.venta) <= 0) {
        data.useLiveRate = false; controls.useLiveRate.checked = false;
        text(rateStatus, 'No se pudo actualizar. Ingresá el tipo de cambio manualmente.'); rateStatus.className = 'hint error';
      } else {
        data.exchangeRate = Number(response.venta); controls.exchangeRate.value = data.exchangeRate;
        date = response.fechaActualizacion ? new Date(response.fechaActualizacion) : null;
        text(rateStatus, 'Dólar ' + type + ' · Venta' + (date && !isNaN(date.getTime()) ? ' · ' + pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) : ''));
        rateStatus.className = 'hint';
      }
      render();
    });
  }
  function detail(label, value) { var p = node('p'); p.appendChild(node('strong', label + ': ')); p.appendChild(document.createTextNode(String(value))); el('quote-details').appendChild(p); }
  function row(label, base, value, className) {
    var tr = node('tr', undefined, className); tr.appendChild(node('td', label)); tr.appendChild(node('td', base)); tr.appendChild(node('td', '$' + model.money(value), 'amount')); el('quote-rows').appendChild(tr);
  }
  function render() {
    var c = result = model.calculate(data), mode = model.modes[data.shippingMode], buttons = el('modes').getElementsByTagName('button'), i, active,
      pairs = [['enableDdi', 'ddiRate'], ['enableStat', 'statRate'], ['enableIva', 'ivaRate'], ['enableIvaAdic', 'ivaAdicRate'], ['enableGanancias', 'gananciasRate'], ['enableIibb', 'iibbRate']];
    for (i = 0; i < buttons.length; i += 1) {
      active = buttons[i].getAttribute('data-mode') === data.shippingMode; buttons[i].className = active ? 'active' : ''; buttons[i].setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    text(el('freight-label'), 'Tarifa de flete · USD / ' + mode.unit);
    text(el('weight-hint'), 'Peso volumétrico: ' + c.volumetricWeight + ' kg · Peso facturable: ' + c.chargeableWeight + ' kg.');
    controls.localExpenses.disabled = !data.enableLocalExpenses || c.isAllInOrDdp;
    for (i = 0; i < pairs.length; i += 1) { controls[pairs[i][1]].disabled = !data[pairs[i][0]] || c.isAllInOrDdp; }
    text(el('tax-hint'), c.isAllInOrDdp ? 'Los impuestos y gastos locales están incluidos en la modalidad seleccionada.' : 'Las alícuotas se aplican sobre las mismas bases del cotizador principal.');
    controls.exchangeRate.readOnly = data.useLiveRate;
    show(el('rate-type-field'), data.useLiveRate); show(el('refresh-rate'), data.useLiveRate);
    el('refresh-rate').disabled = rateBusy; el('send').disabled = sendBusy || rateBusy || window.location.protocol === 'file:';
    el('print').disabled = rateBusy; el('copy').disabled = rateBusy;
    text(el('send'), sendBusy ? 'Enviando…' : 'Enviar por WhatsApp');
    text(el('quick-total'), 'USD ' + model.money(c.grandTotal));
    text(el('quick-ars'), c.valExchangeRate > 0 ? 'ARS ' + model.money(c.grandTotalARS, true) : '');
    clear(el('quote-details'));
    detail('Cliente', data.clientName || 'Consumidor Final');
    if (data.clientPhone) { detail('Contacto', '+' + data.clientPhone.replace(/\D/g, '')); }
    detail('Producto', data.productDesc || 'Mercadería General'); detail('Posición', data.hscode || 'A clasificar');
    detail('Término de compra', data.incoterm); detail('Modalidad', mode.label);
    detail('Peso / Volumen', c.valWeight + ' kg | ' + c.valCbm + ' m³'); detail('Peso facturable', c.chargeableWeight + ' kg');
    clear(el('quote-rows'));
    if (data.enableGoodsValue) { row('Valor de mercadería (' + data.incoterm + ')', '—', c.valGoods); }
    if (c.internationalFreight > 0) { row('Flete internacional', 'USD ' + c.valFreightRate + ' / ' + mode.unit, c.internationalFreight); }
    if (data.enableInsurance) { row('Seguro estimado', '1.00%', c.insurance); }
    row(data.enableGoodsValue ? 'Valor en aduana / Base tributaria' : 'Subtotal flete y seguro', data.enableGoodsValue ? (data.incoterm === 'CIF' || data.incoterm === 'DDP' ? 'Valor ' + data.incoterm : data.incoterm + ' + Flete + Seguro') : 'Flete + Seguro', c.displayedBaseValue, 'subtotal');
    if (!c.isAllInOrDdp) {
      if (data.enableDdi) { row('Derechos de importación', data.ddiRate + '%', c.ddiAmount); }
      if (data.enableStat) { row('Tasa de estadística', data.statRate + '%', c.statAmount); }
      if (data.enableIva) { row('IVA general', data.ivaRate + '%', c.ivaAmount); }
      if (data.enableIvaAdic) { row('IVA adicional', data.ivaAdicRate + '%', c.ivaAdicAmount); }
      if (data.enableGanancias) { row('Percepción Ganancias', data.gananciasRate + '%', c.gananciasAmount); }
      if (data.enableIibb) { row('Percepción IIBB', data.iibbRate + '%', c.iibbAmount); }
      if (data.enableLocalExpenses) { row('Gastos locales / Puerto / Despacho', 'Fijo estimado', c.activeLocalExpenses); }
    } else { row('Servicio integral aduanero / Impuestos', 'Incluido', 0); }
    row('Honorarios y gestión DCAM', 'Coordinación integral', c.valServiceFee);
    text(el('total-label'), data.enableGoodsValue ? 'TOTAL ESTIMADO DE LA OPERACIÓN · USD' : 'TOTAL SERVICIO LOGÍSTICO E IMPUESTOS · USD');
    text(el('quote-total'), '$' + model.money(c.grandTotal)); show(el('ars-total'), c.valExchangeRate > 0); show(el('exchange-term'), c.valExchangeRate > 0);
    text(el('ars-label'), 'TOTAL EN PESOS · ' + c.exchangeRateLabel + ' $' + c.valExchangeRate);
    text(el('quote-ars'), '$' + model.money(c.grandTotalARS, true) + ' ARS');
  }
  el('quote-form').onsubmit = function (event) { event.preventDefault(); };
  el('modes').onclick = function (event) {
    var target = event.target, mode;
    while (target && target !== el('modes')) {
      mode = target.getAttribute && target.getAttribute('data-mode');
      if (mode && model.modes[mode]) { data.shippingMode = mode; data.unitFreightRate = model.modes[mode].rate; controls.unitFreightRate.value = data.unitFreightRate; render(); return; }
      target = target.parentNode;
    }
  };
  el('refresh-rate').onclick = updateRate;
  el('edit-tab').onclick = function () { setView(false); };
  el('quote-tab').onclick = el('view-quote').onclick = function () { setView(true); };
  el('tax-toggle').onclick = function () {
    var open = el('taxes').className.indexOf('hidden') !== -1;
    show(el('taxes'), open); this.setAttribute('aria-expanded', open ? 'true' : 'false');
    text(this, 'Ajustar alícuotas impositivas ' + (open ? '−' : '+'));
  };
  el('copy').onclick = function () {
    var copied = false, area = el('copy-text');
    area.value = model.summary(data, result); show(el('copy-dialog'), true);
    area.focus(); area.select();
    try { area.setSelectionRange(0, area.value.length); copied = document.execCommand('copy'); } catch (ignore) {}
    if (copied) { show(el('copy-dialog'), false); message('Resumen copiado.'); }
    else { text(el('copy-help'), 'Mantené presionado el texto, elegí Seleccionar todo y después Copiar.'); }
  };
  el('close-copy').onclick = function () { show(el('copy-dialog'), false); el('copy').focus(); };
  el('print').onclick = function () {
    setView(true);
    if (typeof window.print === 'function') { window.print(); }
    else { message('Abrí esta cotización en Safari para acceder a las opciones de impresión.', true); }
  };
  el('send').onclick = function () {
    var phone = data.clientPhone.replace(/\D/g, ''), summary, total;
    if (sendBusy || rateBusy) { return; }
    if (phone.length < 8 || phone.length > 15) { message('Ingresá el WhatsApp completo del cliente, con código de país.', true); return; }
    summary = model.summary(data, result); total = result.grandTotal;
    sendBusy = true; message('Enviando la cotización por WhatsApp…'); render();
    http('POST', '/api/send-quote', { phone: phone, message: summary }, 45000, function (error, response) {
      sendBusy = false; render();
      if (error || !response || response.success !== true) {
        message(error && error.uncertain ? 'No pudimos confirmar el envío. Revisá el chat antes de reenviar.' : 'No se pudo enviar. Revisá la conexión de WhatsApp y reintentá. Los datos siguen en el formulario.', true);
      } else { message('Cotización de USD ' + model.money(total) + ' enviada a +' + phone + '.'); }
    });
  };
  el('install').onclick = function () { show(el('install-dialog'), true); el('close-install').focus(); };
  el('close-install').onclick = function () { show(el('install-dialog'), false); el('install').focus(); };
  document.addEventListener('keydown', function (event) { if (event.keyCode === 27) { show(el('copy-dialog'), false); show(el('install-dialog'), false); } }, false);
  text(el('quote-reference'), 'Fecha: ' + pad(now.getDate()) + '/' + pad(now.getMonth() + 1) + '/' + now.getFullYear() + ' · Ref: ' + reference);
  if (window.location.protocol === 'file:') {
    controls.useLiveRate.disabled = true;
    el('send').disabled = true;
    text(rateStatus, 'Para usar dólar en vivo y WhatsApp, abrí el cotizador desde su sitio web.');
  }
  render();
}());
