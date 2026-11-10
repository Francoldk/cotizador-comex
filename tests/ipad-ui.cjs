const fs=require('fs');
const path=require('path');
const vm=require('vm');
const assert=require('node:assert/strict');
const model=require('../public/ipad/calculator.js');
const html=fs.readFileSync(path.join(__dirname,'../public/ipad/index.html'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'../public/ipad/app.js'),'utf8');
class Element {
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.className='';this.value='';this.type='';this._text='';}
 get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}set textContent(v){this._text=String(v);this.children=[];}
 appendChild(n){this.children.push(n);n.parentNode=this;return n;} removeChild(n){this.children.splice(this.children.indexOf(n),1);}
 get firstChild(){return this.children[0]||null;}
 getElementsByTagName(tag){return this.children.flatMap(n=>[(n.tagName===tag.toUpperCase()?n:null),...n.getElementsByTagName(tag)]).filter(Boolean);}
 setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k]||null;}
 focus(){}select(){}setSelectionRange(){}
}
function boot(protocol='https:',earlyInput={}) {
 const elements={},timers=new Map(),requests=[],ctx={deferRate:false,deferSend:false,pendingRate:[],pendingSend:[],rate:{venta:1500,casa:'blue'},send:{success:true},rateStatus:200,sendStatus:200,prints:0};let seq=0;
 for(const m of html.matchAll(/<(\w+)\b([^>]*\bid="([^"]+)"[^>]*)>/g)){const e=elements[m[3]]=new Element(m[1]);const type=/\btype="([^"]+)"/.exec(m[2]);if(type)e.type=type[1];if(/class="([^"]+)"/.test(m[2]))e.className=/class="([^"]+)"/.exec(m[2])[1];}
 for(const m of html.matchAll(/data-mode="([^"]+)"/g)){const b=new Element('button');b.setAttribute('data-mode',m[1]);elements.modes.appendChild(b);}
 for(const [id,value] of Object.entries(earlyInput))elements[id].value=value;
 class XHR{
  open(method,url){this.method=method;this.url=url;this.headers={};}setRequestHeader(k,v){this.headers[k]=v;}abort(){}
  send(body){requests.push({method:this.method,url:this.url,body,headers:this.headers,xhr:this});const rate=this.method==='GET',status=rate?ctx.rateStatus:ctx.sendStatus,reply=rate?ctx.rate:ctx.send;
   const done=()=>{this.readyState=4;this.status=status;this.responseText=JSON.stringify(reply);this.onreadystatechange();};
   if(rate&&ctx.deferRate)ctx.pendingRate.push(done);else if(!rate&&ctx.deferSend)ctx.pendingSend.push(done);else done();
  }
 }
 const document={getElementById:id=>elements[id],createElement:t=>new Element(t),createTextNode:t=>{const n=new Element('#text');n.textContent=t;return n;},addEventListener(){},execCommand(){return false;}};
 const window={DCAMComex:model,location:{protocol},scrollTo(){},print(){ctx.prints++;},setTimeout(fn,ms){timers.set(++seq,{fn,ms});return seq;},clearTimeout(id){timers.delete(id);}};
 vm.runInNewContext(app,{window,document,XMLHttpRequest:XHR,Date,Number,String,Object,isFinite,JSON,encodeURIComponent});
 Object.assign(ctx,{elements,requests,timers});
 ctx.input=(id,value)=>{elements[id].value=value;elements[id].oninput();};
 ctx.check=(id,value)=>{elements[id].checked=value;elements[id].onchange();};
 ctx.select=(id,value)=>{elements[id].value=value;elements[id].onchange();};
 return ctx;
}
let c=boot();assert.equal(c.elements['quick-total'].textContent,'USD 0.00');
c.input('clientName','<script>cliente</script>');c.input('clientPhone','+54 (9) 351 234-5678');
c.input('goodsValue','1000');c.input('weightKg','50');c.input('cbm','.5');c.input('serviceFee','35');c.input('exchangeRate','1500');
const expected=model.calculate({...model.defaults(),goodsValue:1000,weightKg:50,cbm:.5,serviceFee:35,exchangeRate:1500});
assert.equal(c.elements['quick-total'].textContent,'USD '+model.money(expected.grandTotal));
assert(c.elements['quote-details'].textContent.includes('<script>cliente</script>'));
const ref=c.elements['quote-reference'].textContent;c.input('goodsValue','1000');assert.equal(c.elements['quote-reference'].textContent,ref);
c.elements.copy.onclick();assert(!c.elements['copy-dialog'].className.includes('hidden'));assert(c.elements['copy-text'].value.includes(expected.grandTotal.toFixed(2)));
c.elements.print.onclick();assert.equal(c.prints,1);assert(c.elements.main.className.includes('quote-view'));
c.deferSend=true;c.elements.send.onclick();c.elements.send.onclick();assert.equal(c.requests.filter(r=>r.method==='POST').length,1);
const sent=JSON.parse(c.requests.find(r=>r.method==='POST').body);assert.equal(sent.phone,'5493512345678');assert(sent.message.includes(expected.grandTotal.toFixed(2)));
c.input('clientPhone','5493519999999');c.input('goodsValue','2000');c.pendingSend[0]();
assert(c.elements['action-status'].textContent.includes('5493512345678'));assert(c.elements['action-status'].textContent.includes(model.money(expected.grandTotal)));
console.log('PASS: form totals, safe text, stable reference, iOS copy fallback, print action, exact recipient and immutable send snapshot');
c=boot();c.deferRate=true;c.check('useLiveRate',true);assert(c.elements.send.disabled);
c.rate={venta:2000,casa:'cripto'};c.select('liveRateType','cripto');c.pendingRate[1]();c.pendingRate[0]();assert.equal(c.elements.exchangeRate.value,2000);
c.check('useLiveRate',false);assert.equal(c.elements.exchangeRate.value,'');assert.equal(c.elements.exchangeRate.readOnly,false);
c=boot();c.rateStatus=502;c.check('useLiveRate',true);assert.equal(c.elements.useLiveRate.checked,false);assert(c.elements['rate-status'].textContent.includes('manualmente'));
console.log('PASS: live-rate loading, stale-response rejection and manual fallback');
c=boot();c.input('clientPhone','5493512345678');c.sendStatus=503;c.send={error:'down'};c.elements.send.onclick();assert(c.elements['action-status'].textContent.includes('No pudimos confirmar'));assert.equal(c.elements.clientPhone.value,'5493512345678');
assert.equal(c.requests.filter(r=>r.method==='POST').length,1);
c=boot('file:');assert(c.elements.send.disabled);assert(c.elements.useLiveRate.disabled);
c=boot('https:',{clientName:'Nombre ingresado antes de cargar el script'});assert(c.elements['quote-details'].textContent.includes('Nombre ingresado antes de cargar el script'));
assert(!/localStorage|sessionStorage|innerHTML|navigator\.clipboard|\beval\(/.test(app));
console.log('PASS: failures retain quote data, never auto-resend and never persist customer data');
