(function(){
var sh=document.getElementById("q-sheet"),opener=null;
var bg=document.querySelectorAll("body>header,body>section,body>footer");
function setBg(v){Array.prototype.forEach.call(bg,function(e){e.inert=v})}
function open(el){
if(sh.classList.contains("on"))return;
opener=el||null;sh.classList.add("on");sh.setAttribute("aria-hidden","false");
document.documentElement.classList.add("q-lock");setBg(true);
try{history.pushState({q:1},"")}catch(e){}
setTimeout(function(){document.getElementById("q-x").focus({preventScroll:true})},60);
}
function hide(){
if(!sh.classList.contains("on"))return;
sh.classList.remove("on");sh.setAttribute("aria-hidden","true");
document.documentElement.classList.remove("q-lock");setBg(false);
if(opener&&opener.focus)opener.focus({preventScroll:true});
}
function close(){if(history.state&&history.state.q){history.back()}else{hide()}}
document.addEventListener("click",function(e){var a=e.target.closest("[data-q]");if(a){e.preventDefault();open(a)}});
document.getElementById("q-x").addEventListener("click",close);
document.addEventListener("keydown",function(e){if(e.key==="Escape")close()});
window.addEventListener("popstate",hide);
})();
