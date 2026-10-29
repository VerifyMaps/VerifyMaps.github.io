const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("fs"),path=require("path"),{JSDOM,ResourceLoader}=require("jsdom");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("index.html"),js=["reveal","form","sheet"].map(n=>read(`js/${n}.js`)).join("\n");
const OLD="vm-relevamiento-v1",KEY="vm-relevamiento-v2";

/* ---------- Comprobaciones estáticas ---------- */
test("CSP: existe, es restrictiva y no permite código inline ni eval",()=>{
  const m=html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/);assert.ok(m,"falta la meta CSP");
  const d=Object.fromEntries(m[1].split(";").map(s=>s.trim().split(/\s+/)).filter(a=>a[0]).map(a=>[a[0],a.slice(1)]));
  assert.deepEqual(d["default-src"],["'none'"]);
  assert.deepEqual(d["script-src"],["'self'"]);
  for(const k of ["connect-src","object-src","base-uri","form-action"])assert.deepEqual(d[k],["'none'"],k);
  assert.ok(!/unsafe-eval/.test(m[1]));
  assert.ok(!(d["style-src"]||[]).includes("'unsafe-inline'"));
  assert.ok(html.indexOf("Content-Security-Policy")<html.indexOf("<script"),"la CSP debe ir antes de cualquier script");
});
test("HTML: sin <script> ni <style> inline, sin manejadores on*= y sin recursos externos",()=>{
  assert.ok(!/<script(?![^>]*\ssrc=)[^>]*>/i.test(html));
  assert.ok(!/<style[\s>]/i.test(html));
  assert.ok(!/\son[a-z]+\s*=/i.test(html.replace(/data:[^"']+/g,"")));
  const res=[...html.matchAll(/\b(?:src|href)="(https?:)?\/\/[^"]+/g)].map(x=>x[0]).filter(x=>!/wa\.me/.test(x));
  assert.deepEqual(res,[],"recursos externos no previstos");
});
test("Enlaces target=_blank llevan noopener noreferrer",()=>{
  for(const t of html.match(/<a [^>]*target="_blank"[^>]*>/g)||[])assert.match(t,/rel="noopener noreferrer"/);
});
test("JS: sin sumideros peligrosos y sin localStorage persistente",()=>{
  for(const p of [/\.innerHTML\s*=/,/outerHTML/,/insertAdjacentHTML/,/\beval\(/,/new Function/,/document\.write/,/localStorage\.(set|get)Item/])assert.ok(!p.test(js),String(p));
});

/* ---------- Comportamiento (jsdom) ---------- */
class Loader extends ResourceLoader{fetch(u){const p=new URL(u).pathname.slice(1);return Promise.resolve(fs.readFileSync(path.join(root,p)))}}
async function page(seed){
  const dom=new JSDOM(html,{url:"http://localhost/",runScripts:"dangerously",resources:new Loader(),pretendToBeVisual:true,
    beforeParse(w){w.HTMLElement.prototype.scrollIntoView=()=>{};seed&&seed(w)}});
  await new Promise(r=>dom.window.addEventListener("load",r));return dom.window;
}
const type=(w,k,v)=>{const e=w.document.getElementById("q-"+k);e.value=v;e.dispatchEvent(new w.Event("input",{bubbles:true}))};
const click=w=>{const e=new w.MouseEvent("click",{bubbles:true,cancelable:true});w.document.getElementById("q-send").dispatchEvent(e);return e};
const text=w=>new URL(w.document.getElementById("q-send").href).searchParams.get("text");
const fill=w=>{type(w,"nombre","Café Luna");type(w,"rubro","Cafetería");type(w,"dir","Calle 1 234, CABA");type(w,"tel","11 2345-6789")};

test("Con los datos obligatorios correctos el enlace de WhatsApp se arma y no se bloquea",async()=>{
  const w=await page();fill(w);
  const u=new URL(w.document.getElementById("q-send").href);
  assert.equal(u.origin+u.pathname,"https://wa.me/5491123165367");assert.deepEqual([...u.searchParams.keys()],["text"]);
  assert.match(text(w),/Nombre exacto: Café Luna/);assert.equal(click(w).defaultPrevented,false);
});
test("Faltan obligatorios → se bloquea el envío",async()=>{
  const w=await page();type(w,"nombre","Solo nombre");assert.equal(click(w).defaultPrevented,true);
});
test("Formatos inválidos (teléfono, email) bloquean el envío",async()=>{
  const w=await page();fill(w);type(w,"tel","abc");assert.equal(click(w).defaultPrevented,true);
  type(w,"tel","11 2345-6789");type(w,"mail","no-es-mail");assert.equal(click(w).defaultPrevented,true);
  type(w,"mail","hola@ejemplo.com");type(w,"web","javascript:alert(1)");assert.equal(click(w).defaultPrevented,true);
  type(w,"web","https://ejemplo.com");assert.equal(click(w).defaultPrevented,false);
});
test("Inyección: HTML, '&text=', saltos de línea y caracteres de control quedan como texto inerte",async()=>{
  const w=await page();fill(w);
  type(w,"nombre",'<img src=x onerror=alert(1)>&text=X&phone=1');
  type(w,"obs","línea1\n• Teléfono: 000\u202Eoculto\u0000fin");
  assert.equal(w.document.querySelector("#q-app img"),null);
  const t=text(w);assert.ok(t.includes("<img src=x onerror=alert(1)>&text=X&phone=1"));
  assert.ok(!/\u202E|\u0000/.test(t));assert.ok(!t.includes("\n• Teléfono: 000"),"un salto de línea no debe poder simular otro campo");
  assert.deepEqual([...new URL(w.document.getElementById("q-send").href).searchParams.keys()],["text"]);
});
test("Mensaje demasiado largo → se bloquea con aviso",async()=>{
  const w=await page();fill(w);
  for(const k of ["hor","esp","desc","serv","obs","ref"])type(w,k,"x ".repeat(400));
  for(const k of ["otras","zona","busca","cie","web","comp"])type(w,k,"y".repeat(200));
  assert.equal(click(w).defaultPrevented,true);assert.match(w.document.getElementById("q-msg").textContent,/demasiado largo/);
});
test("Privacidad: no usa localStorage, el borrador va a sessionStorage y 'Borrar mis datos' lo elimina",async()=>{
  const w=await page();fill(w);
  assert.equal(w.localStorage.length,0);assert.ok(w.sessionStorage.getItem(KEY));
  w.document.getElementById("q-clear").click();
  assert.equal(w.sessionStorage.getItem(KEY),null);assert.equal(w.document.getElementById("q-nombre").value,"");
  assert.ok(!/Café Luna/.test(text(w)));
});
test("Privacidad: al cargar se elimina el dato viejo que quedó en localStorage",async()=>{
  const w=await page(w=>w.localStorage.setItem(OLD,JSON.stringify({nombre:"Dato viejo",tel:"1111"})));
  assert.equal(w.localStorage.getItem(OLD),null);assert.equal(w.document.getElementById("q-nombre").value,"");
});
test("Privacidad: el borrador vence a las 2 h y el contenido manipulado se ignora sin romper la página",async()=>{
  let w=await page(w=>w.sessionStorage.setItem(KEY,JSON.stringify({t:Date.now()-3*3600e3,d:{nombre:"Viejo"}})));
  assert.equal(w.document.getElementById("q-nombre").value,"");
  w=await page(w=>w.sessionStorage.setItem(KEY,JSON.stringify({t:Date.now(),d:{nombre:{x:1},acc:"texto",ins:["Wi-Fi","<b>x</b>"],tipo:"Otro",__proto__:{p:1}}})));
  assert.equal(w.document.getElementById("q-nombre").value,"");
  const pressed=[...w.document.querySelectorAll('.q-ch[aria-pressed="true"]')].map(b=>b.textContent);assert.deepEqual(pressed,["Wi-Fi"]);
  w=await page(w=>w.sessionStorage.setItem(KEY,"{no-json"));assert.ok(w.document.getElementById("q-app").children.length>5);
  w=await page(w=>w.sessionStorage.setItem(KEY,JSON.stringify({t:Date.now()-1000,d:{nombre:"Reciente"}})));
  assert.equal(w.document.getElementById("q-nombre").value,"Reciente");
});
