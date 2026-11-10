const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const model = require('../public/ipad/calculator.js');
const page = fs.readFileSync(path.join(__dirname, '../app/page.js'), 'utf8');
const start = page.indexOf('  const valGoods = Number(goodsValue)');
const end = page.indexOf('  // Formato para WhatsApp');
assert(start > 0 && end > start, 'Original calculator block must remain identifiable');
const fields = Object.keys(model.defaults());
const outputs = Object.keys(model.calculate(model.defaults()));
const original = new Function(...fields, page.slice(start, end) + '\nreturn {' + outputs.map(k => k + ':' + k).join(',') + '};');
function compare(data) {
  assert.deepEqual(model.calculate(data), original(...fields.map(k=>data[k])), 'iPad calculation must match the current main page');
}
compare(model.defaults());
const modes = Object.keys(model.modes);
const incoterms = ['EXW','FOB','CIF','DDP'];
const toggles = fields.filter(k=>k.startsWith('enable'));
let seed=17;
function random(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}
for(let i=0;i<1600;i++) {
  const d=model.defaults();
  d.shippingMode=modes[i%4];d.incoterm=incoterms[Math.floor(i/4)%4];
  d.goodsValue=String(Math.round(random()*10000000)/100);
  d.weightKg=String(Math.round(random()*100000)/100);
  d.cbm=String(Math.round(random()*100000)/10000);
  d.unitFreightRate=String(Math.round(random()*100000)/100);
  d.localExpenses=String(Math.round(random()*100000)/100);
  d.serviceFee=String(Math.round(random()*100000)/100);
  d.exchangeRate=String(Math.round(random()*300000)/100);
  for(const key of toggles)d[key]=random()>.4;
  for(const key of ['ddiRate','statRate','ivaRate','ivaAdicRate','gananciasRate','iibbRate'])d[key]=Math.round(random()*4000)/100;
  d.useLiveRate=i%2===0;d.liveRateType=['blue','oficial','cripto'][i%3];
  compare(d);
}
for(const mode of modes)for(const incoterm of incoterms) {
  const d={...model.defaults(),shippingMode:mode,incoterm,goodsValue:'0',weightKg:'0',cbm:'0',unitFreightRate:'0'};
  compare(d);assert.equal(model.calculate(d).grandTotal,0);
}
const d={...model.defaults(),clientName:'Cliente de prueba',goodsValue:1000,weightKg:50,cbm:.5,serviceFee:35,exchangeRate:1500};
const c=model.calculate(d);assert.equal(c.volumetricWeight,83.5);assert.equal(c.chargeableWeight,83.5);
assert.equal(model.modes.maritimo_compartido.rate,8.5);assert.equal(model.modes.maritimo_cbm.rate,350);assert.equal(model.modes.courier_aereo.rate,16.5);assert.equal(model.modes.all_in_aereo.rate,48);
assert(model.summary(d,c).includes('*TOTAL USD:* $'+c.grandTotal.toFixed(2)));
assert(model.summary(d,c).includes('T.C. Manual'));
assert.equal(model.money(1234567.89,true),'1.234.567,89');
console.log('PASS: 1,617 calculations match app/page.js exactly, including all modes, incoterms, toggles, rates, zero values and rounding');
console.log('PASS: mode defaults and quote summary totals');
