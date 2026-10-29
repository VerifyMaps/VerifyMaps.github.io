(function(){
var d=document.documentElement;d.classList.add('js');
document.querySelectorAll('[data-stagger]').forEach(function(g){
  Array.prototype.forEach.call(g.querySelectorAll('.rv'),function(el,i){el.style.setProperty('--d',(i*90)+'ms')});
});
var items=document.querySelectorAll('.rv');
if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
  },{threshold:.15,rootMargin:'0px 0px -6% 0px'});
  items.forEach(function(el){io.observe(el)});
}else{items.forEach(function(el){el.classList.add('in')})}
var top=document.getElementById('top'),bar=document.getElementById('bar'),tick=false;
function upd(){
  var y=window.scrollY||0,h=document.documentElement.scrollHeight-window.innerHeight;
  top.classList.toggle('on',y>window.innerHeight*.5);
  bar.style.transform='scaleX('+(h>0?Math.min(1,y/h):0)+')';
  tick=false;
}
window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});
upd();
})();
