(function(){
var WA="5491123165367";
var D=[
{t:"Tu negocio",f:[
{k:"nombre",l:"Nombre exacto",h:"Como figura en el cartel, sin eslóganes ni teléfonos",r:1},
{k:"rubro",l:"Rubro principal",h:"Por ejemplo: peluquería, taller, veterinaria",r:1},
{k:"otras",l:"Otras categorías o servicios",h:"Hasta 2 o 3"},
{k:"tipo",l:"Tipo de atención",c:["Local al público","A domicilio","Ambas"]},
{k:"desde",l:"Abierto desde",h:"Mes y año"}]},
{t:"Ubicación",f:[
{k:"dir",l:"Dirección completa",h:"Calle, número, piso o local, barrio, localidad y código postal",r:1},
{k:"ref",l:"Referencias para llegar",h:"Entre calles, frente a, dentro de una galería"},
{k:"zona",l:"Zona que cubrís",h:"Solo si vas a domicilio"}]},
{t:"Contacto",f:[
{k:"tel",v:"tel",l:"Teléfono del negocio",h:"Con característica",r:1},
{k:"wa",v:"tel",l:"WhatsApp del negocio"},
{k:"web",v:"web",l:"Sitio web o redes"},
{k:"mail",v:"mail",l:"Email"}]},
{t:"Horarios",f:[
{k:"hor",l:"Horarios de cada día",h:"Si cerrás al mediodía, anotá los dos tramos",a:1},
{k:"fer",l:"Feriados",c:["Abro","Cierro","Depende del feriado"]},
{k:"esp",l:"Fechas especiales",h:"Navidad, Año Nuevo, Día de la Madre, Hot Sale",a:1},
{k:"cie",l:"Cierres próximos",h:"Vacaciones, obras, balance"}]},
{t:"Qué ofrecés",f:[
{k:"desc",l:"Qué hacés y qué te diferencia",h:"Dos o tres frases",a:1},
{k:"busca",l:"Cómo te buscan tus clientes",h:"Las palabras que usan"},
{k:"serv",l:"Servicios o productos principales",h:"Con precio o rango",a:1}]},
{t:"Atributos",f:[
{k:"acc",l:"Accesibilidad",m:["Entrada accesible","Baño accesible","Estacionamiento accesible","Rampa o ascensor"]},
{k:"ins",l:"Instalaciones",m:["Wi-Fi","Baño para clientes","Estacionamiento","Aire acondicionado","Espacio al aire libre","Acepta mascotas"]},
{k:"aten",l:"Atención",m:["Con turno","Sin turno","Delivery","Retiro en el local","A domicilio"]},
{k:"pago",l:"Medios de pago",m:["Efectivo","Débito","Crédito","Transferencia","QR o Mercado Pago"]}]},
{t:"Fotos",f:[
{k:"fot",l:"Lo que ya tenés",h:"Alcanzan unas 6 fotos buenas. Las mandás por el chat.",m:["Logo","Fachada","Interior","Equipo","Productos o trabajos","Entrada","Video corto"]}]},
{t:"Verificación",f:[
{k:"gm",v:"mail",l:"Tu Gmail",h:"Va a ser el dueño de la ficha"},
{k:"llam",l:"Podés recibir una llamada o SMS al verificar",c:["Sí","No"]},
{k:"vid",l:"Podés hacer una videollamada mostrando el local",c:["Sí","No"]},
{k:"cart",l:"El cartel coincide con el nombre",c:["Sí","No","No sé"]},
{k:"comp",l:"Comprobante a nombre del negocio",h:"Factura, habilitación, constancia de ARCA o alquiler"}]},
{t:"Algo más",f:[{k:"obs",l:"Algo más que quieras contarme",a:1}]}
];
var K="vm-relevamiento-v2",OLD="vm-relevamiento-v1",TTL=2*3600*1000,MAXI=200,MAXT=500,MAXMSG=3500,S={};
var F={};D.forEach(function(s){s.f.forEach(function(f){F[f.k]=f})});
function clean(x,max){return String(x==null?"":x).normalize("NFC").replace(/\r\n?/g,"\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g,"").replace(/[ \t]+/g," ").trim().slice(0,max)}
/* Privacidad: borrador solo en sessionStorage (muere al cerrar la pestaña) y con vencimiento de 2 h. */
var st=null;try{st=window.sessionStorage}catch(e){}
function purge(){try{localStorage.removeItem(OLD)}catch(e){}try{if(st)st.removeItem(K)}catch(e){}}
function load(){
try{localStorage.removeItem(OLD)}catch(e){}
try{
var r=JSON.parse(st.getItem(K)||"null"),age=r&&Date.now()-r.t;
if(!r||typeof r!=="object"||!(age>=0&&age<TTL)||!r.d||typeof r.d!=="object")return;
Object.keys(F).forEach(function(k){var v=r.d[k],f=F[k];
if(f.m){if(Array.isArray(v)){var a=v.filter(function(o){return f.m.indexOf(o)>-1});if(a.length)S[k]=a}}
else if(f.c){if(f.c.indexOf(v)>-1)S[k]=v}
else if(typeof v==="string"&&v)S[k]=v.slice(0,f.a?MAXT:MAXI)});
}catch(e){S={}}
}
function sv(){try{if(st)st.setItem(K,JSON.stringify({t:Date.now(),d:S}))}catch(e){}}
function val(f){var v=S[f.k];if(Array.isArray(v))return v.join(", ");return clean(v,f.a?MAXT:MAXI).replace(/\s*\n+\s*/g," / ")}
/* Validación de usabilidad y de higiene del mensaje; NO es una barrera de seguridad (el navegador y el cliente son controlables). */
var RX={
tel:function(v){var d=v.replace(/\D/g,"");return /^[+\d\s().\-]+$/.test(v)&&d.length>=8&&d.length<=15},
mail:function(v){return v.length<=254&&/^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[^\s@<>"]{2,}$/.test(v)},
web:function(v){return !/^(javascript|data|vbscript|file):/i.test(v)&&!/[<>]/.test(v)}
};
function missing(){var m=[];D.forEach(function(s){s.f.forEach(function(f){if(f.r&&!val(f))m.push(f)})});return m}
function invalid(){var m=[];D.forEach(function(s){s.f.forEach(function(f){var x=f.v&&val(f);if(x&&!RX[f.v](x))m.push(f)})});return m}
function build(){
var t="Hola Lucio, quiero que mi negocio aparezca en Google Maps. Estos son los datos de mi negocio:\n";
D.forEach(function(s){
var l="";
s.f.forEach(function(f){var x=val(f);if(x)l+="• "+f.l+": "+x+"\n"});
if(l)t+="\n*"+s.t+"*\n"+l;
});
return t+"\nTe mando las fotos por acá.";
}
/* Render con DOM (sin innerHTML): ningún dato pasa por el parser HTML. */
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
load();
var app=document.getElementById("q-app");
D.forEach(function(s,i){
var sec=el("div","q-s");sec.dataset.s=i;
var hd=el("div","q-h");hd.appendChild(el("span","q-bd"));hd.appendChild(document.createTextNode(s.t));sec.appendChild(hd);
s.f.forEach(function(f){
var w=el("div","q-f"),ch=f.c||f.m,lab;
if(ch){lab=el("span","q-l",f.l)}else{lab=el("label",null,f.l);lab.htmlFor="q-"+f.k}
if(f.h)lab.appendChild(el("small",null,f.h));
w.appendChild(lab);
if(ch){
var cs=el("div","q-chs");
ch.forEach(function(o){var b=el("button","q-ch",o);b.type="button";b.dataset.k=f.k;b.dataset.v=o;b.dataset.m=f.m?"1":"0";b.setAttribute("aria-pressed","false");cs.appendChild(b)});
w.appendChild(cs);
}else{
var inp=el(f.a?"textarea":"input");inp.id="q-"+f.k;inp.dataset.k=f.k;inp.maxLength=f.a?MAXT:MAXI;inp.autocomplete="off";
if(!f.a){inp.type=f.v==="mail"?"email":(f.v==="tel"?"tel":"text");if(f.v==="tel")inp.inputMode="tel";if(f.v==="mail")inp.inputMode="email"}
inp.value=S[f.k]||"";w.appendChild(inp);
}
sec.appendChild(w);
});
app.appendChild(sec);
});
var end=el("div","q-end"),clr=el("button","q-x","Borrar mis datos");clr.type="button";clr.id="q-clear";
end.appendChild(clr);end.appendChild(el("p","mute","Borra lo que escribiste en este formulario y lo guardado en este navegador."));
app.appendChild(end);
var send=document.getElementById("q-send"),msg=document.getElementById("q-msg"),base=msg.textContent;
function ui(){
Array.prototype.forEach.call(app.querySelectorAll(".q-ch"),function(b){
var v=S[b.dataset.k];b.setAttribute("aria-pressed",String(b.dataset.m==="1"?(v||[]).indexOf(b.dataset.v)>-1:v===b.dataset.v))});
D.forEach(function(s,i){
var req=s.f.filter(function(f){return f.r}),done=req.length?req.every(function(f){return val(f)}):s.f.some(function(f){return val(f)});
app.querySelector('[data-s="'+i+'"]').classList.toggle("q-done",done);
});
send.href="https://wa.me/"+WA+"?text="+encodeURIComponent(build());
}
app.addEventListener("input",function(e){var k=e.target.dataset&&e.target.dataset.k,f=k&&F[k];if(f&&!f.c&&!f.m){S[k]=String(e.target.value).slice(0,f.a?MAXT:MAXI);sv();ui()}});
app.addEventListener("click",function(e){
var b=e.target.closest(".q-ch");if(!b)return;
var k=b.dataset.k,v=b.dataset.v,f=F[k];if(!f||(f.m||f.c).indexOf(v)<0)return;
if(f.m){var a=S[k]||[],j=a.indexOf(v);if(j>-1)a.splice(j,1);else a.push(v);S[k]=a}
else S[k]=(S[k]===v?"":v);
sv();ui();
});
clr.addEventListener("click",function(){
S={};purge();
Array.prototype.forEach.call(app.querySelectorAll("input,textarea"),function(x){x.value=""});
ui();msg.textContent="Listo: se borraron tus respuestas de este navegador.";
});
send.addEventListener("click",function(e){
var m=missing(),bad=invalid(),over=build().length>MAXMSG;
function names(a){return a.map(function(f){return f.l.toLowerCase()}).join(", ")}
if(m.length||bad.length||over){
e.preventDefault();
msg.textContent=m.length?"Antes de enviar, completá: "+names(m)+".":bad.length?"Revisá el formato de: "+names(bad)+".":"El mensaje quedó demasiado largo para WhatsApp. Acortá las respuestas más extensas.";
var t=m[0]||bad[0],x=t&&document.getElementById("q-"+t.k);
if(x){x.scrollIntoView({block:"center"});x.focus({preventScroll:true})}
}else{msg.textContent=base}
});
ui();
})();
