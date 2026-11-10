const fs=require('fs');
const vm=require('vm');
const assert=require('node:assert/strict');
const code=fs.readFileSync(require('path').join(__dirname,'../app/api/ipad/exchange-rate/route.js'),'utf8').replace(/^import[^\n]+\n/,'').replace('export async function GET','async function GET')+'\nthis.GET=GET;';
async function run(type,reply,status=200) {
 const calls=[];
 const sandbox={URL,AbortController,Number,setTimeout,clearTimeout,NextResponse:{json:(data,options={})=>({data,status:options.status||200,headers:options.headers})},fetch:async(url,options)=>{calls.push({url,options});return{ok:status>=200&&status<300,json:async()=>reply};}};
 vm.runInNewContext(code,sandbox);
 const response=await sandbox.GET({url:'https://test.invalid/api/ipad/exchange-rate?type='+encodeURIComponent(type)});
 return {response,calls};
}
(async()=>{
 for(const type of ['oficial','blue','cripto']) {
  const {response,calls}=await run(type,{venta:1500,fechaActualizacion:'2026-11-10T12:00:00Z'});
  assert.equal(response.status,200);assert.equal(response.data.venta,1500);assert.equal(response.data.casa,type);
  assert.equal(calls[0].url,'https://dolarapi.com/v1/dolares/'+type);assert.equal(calls[0].options.cache,'no-store');
  assert.equal(response.headers['Cache-Control'],'no-store');
 }
 for(const type of ['unknown','https://example.invalid','../blue']){const r=await run(type,{venta:1500});assert.equal(r.response.status,400);assert.equal(r.calls.length,0);}
 for(const reply of [{venta:0},{venta:'NaN'},{}])assert.equal((await run('blue',reply)).response.status,502);
 assert.equal((await run('blue',{error:'down'},503)).response.status,502);
 console.log('PASS: live-rate route uses only approved providers, rejects invalid values, handles errors and disables caching');
})().catch(e=>{console.error(e);process.exitCode=1;});
