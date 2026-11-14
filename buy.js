/* Razorpay checkout for every tracker buy button (any element with data-buy).
   data-buy="quarterly" opens the 3-month button, data-buy="monthly" (or an empty data-buy) the 1-month one.
   Our own buttons are in the HTML from first paint. Each plan's Razorpay payment-button.js (amount locked
   on Razorpay's side) is mounted once into its own hidden form (form.rzp-mount[data-plan]), and a click on
   a [data-buy] button clicks that plan's Razorpay link, which opens their checkout modal.
   Adds body.rzp-open while the modal is open and fires a "rzpchange" event on document. */
(function(){
var SRC='https://checkout.razorpay.com/v1/payment-button.js', WAIT_MS=10000;
var IDS={ monthly:'pl_TcM0KU9bvbuici', quarterly:'pl_U01ytptPSJ23tW' };
var MAIL='mailto:rohansurana45@gmail.com?subject='+encodeURIComponent("Startup Operator Roles Tracker: checkout didn't load");
var btns=document.querySelectorAll('[data-buy]');
if(!btns.length) return;
function planOf(btn){ return IDS[btn.getAttribute('data-buy')] ? btn.getAttribute('data-buy') : 'monthly'; }
var plans={};
function plan(name){
  if(plans[name]) return plans[name];
  var mount=document.createElement('form');
  mount.className='rzp-mount'; mount.setAttribute('aria-hidden','true'); mount.setAttribute('data-plan',name);
  document.body.appendChild(mount);
  return plans[name]={ name:name, id:IDS[name], mount:mount, state:'idle', pendingBtn:null, timer:null };
}
function rzpLink(p){ return p.mount.querySelector('a.PaymentButton'); }
function statusFor(btn){ return btn.parentElement.querySelector('.buy-status'); }
function setStatus(btn,html){ var s=statusFor(btn); if(!s) return; s.innerHTML=html||''; s.classList.toggle('on',!!html); }
function clearStatuses(){ document.querySelectorAll('.buy-status').forEach(function(s){ s.innerHTML=''; s.classList.remove('on'); }); }
function busy(btn,on){ btn.classList.toggle('is-loading',on); btn.setAttribute('aria-busy',on?'true':'false'); }
function setOpen(on){ document.body.classList.toggle('rzp-open',on); document.dispatchEvent(new Event('rzpchange')); }
/* A load error allows a fresh retry on the next click. A timeout keeps waiting on the same script
   (re-adding it could run Razorpay twice) and clears the message if it turns up later. */
function fail(p,isError){
  if(isError) p.state='failed'; clearTimeout(p.timer);
  if(p.pendingBtn){ busy(p.pendingBtn,false); setStatus(p.pendingBtn,'Checkout couldn\'t load. A slow connection or an ad blocker can cause this. <a href="'+MAIL+'">Email Me</a> and I\'ll help you get access.'); p.pendingBtn=null; }
}
function ready(p){
  p.state='ready'; clearTimeout(p.timer);
  rzpLink(p).setAttribute('tabindex','-1');
  if(p.pendingBtn){ var b=p.pendingBtn; p.pendingBtn=null; busy(b,false); clearStatuses(); open(p); }
  else clearStatuses();
}
function load(p){
  if(p.state==='loading'||p.state==='ready') return;
  p.state='loading'; p.mount.innerHTML='';
  var s=document.createElement('script');
  s.async=true; s.src=SRC; s.setAttribute('data-payment_button_id',p.id);
  s.onerror=function(){ fail(p,true); };
  new MutationObserver(function(m,obs){ if(rzpLink(p)){ obs.disconnect(); ready(p); } }).observe(p.mount,{childList:true,subtree:true});
  p.mount.appendChild(s);
}
function open(p){ setOpen(true); rzpLink(p).click(); watchModal(); }
/* With two plans on the page there can be two Razorpay containers: the modal is open while any is visible. */
function watchModal(){
  var t=setInterval(function(){
    var open=Array.prototype.some.call(document.querySelectorAll('.razorpay-payment-form-container'),function(c){ return c.style.display!=='none'; });
    if(!open){ clearInterval(t); setOpen(false); }
  },400);
}
btns.forEach(function(btn){
  var p=plan(planOf(btn));
  ['pointerenter','touchstart','focus'].forEach(function(ev){ btn.addEventListener(ev,function(){ load(p); },{passive:true}); });
  btn.addEventListener('click',function(){
    if(p.state==='ready'){ open(p); return; }
    p.pendingBtn=btn; busy(btn,true); clearStatuses(); setStatus(btn,'Opening secure checkout…');
    if(p.state==='failed') p.state='idle';
    load(p);
    clearTimeout(p.timer); p.timer=setTimeout(function(){ if(p.state!=='ready') fail(p,false); },WAIT_MS);
  });
});
/* Load every plan once the page is idle, so checkout is usually ready before the first click. */
function idle(){ (window.requestIdleCallback||function(f){ setTimeout(f,1); })(function(){ Object.keys(plans).forEach(function(n){ load(plans[n]); }); },{timeout:3000}); }
if(document.readyState==='complete') idle(); else window.addEventListener('load',idle);
})();
