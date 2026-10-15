/* Razorpay checkout for every "Get the Tracker" button (any element with data-buy).
   Our own buttons are in the HTML from first paint. Razorpay's payment-button.js (same button id,
   amount locked on Razorpay's side) is mounted once into a hidden form, and a click on a [data-buy]
   button clicks Razorpay's own link, which opens their checkout modal.
   Adds body.rzp-open while the modal is open and fires a "rzpchange" event on document. */
(function(){
var SRC='https://checkout.razorpay.com/v1/payment-button.js', ID='pl_TcM0KU9bvbuici', WAIT_MS=10000;
var MAIL='mailto:rohansurana45@gmail.com?subject='+encodeURIComponent("Startup Operator Roles Tracker: checkout didn't load");
var btns=document.querySelectorAll('[data-buy]');
if(!btns.length) return;
var mount=document.createElement('form');
mount.className='rzp-mount'; mount.setAttribute('aria-hidden','true');
document.body.appendChild(mount);
var state='idle', pendingBtn=null, timer=null;
function rzpLink(){ return mount.querySelector('a.PaymentButton'); }
function statusFor(btn){ return btn.parentElement.querySelector('.buy-status'); }
function setStatus(btn,html){ var s=statusFor(btn); if(!s) return; s.innerHTML=html||''; s.classList.toggle('on',!!html); }
function clearStatuses(){ document.querySelectorAll('.buy-status').forEach(function(s){ s.innerHTML=''; s.classList.remove('on'); }); }
function busy(btn,on){ btn.classList.toggle('is-loading',on); btn.setAttribute('aria-busy',on?'true':'false'); }
function setOpen(on){ document.body.classList.toggle('rzp-open',on); document.dispatchEvent(new Event('rzpchange')); }
/* A load error allows a fresh retry on the next click. A timeout keeps waiting on the same script
   (re-adding it could run Razorpay twice) and clears the message if it turns up later. */
function fail(isError){
  if(isError) state='failed'; clearTimeout(timer);
  if(pendingBtn){ busy(pendingBtn,false); setStatus(pendingBtn,'Checkout couldn\'t load. A slow connection or an ad blocker can cause this. <a href="'+MAIL+'">Email Me</a> and I\'ll help you get access.'); pendingBtn=null; }
}
function ready(){
  state='ready'; clearTimeout(timer);
  rzpLink().setAttribute('tabindex','-1');
  if(pendingBtn){ var b=pendingBtn; pendingBtn=null; busy(b,false); clearStatuses(); open(); }
  else clearStatuses();
}
function load(){
  if(state==='loading'||state==='ready') return;
  state='loading'; mount.innerHTML='';
  var s=document.createElement('script');
  s.async=true; s.src=SRC; s.setAttribute('data-payment_button_id',ID);
  s.onerror=function(){ fail(true); };
  new MutationObserver(function(m,obs){ if(rzpLink()){ obs.disconnect(); ready(); } }).observe(mount,{childList:true,subtree:true});
  mount.appendChild(s);
}
function open(){ setOpen(true); rzpLink().click(); watchModal(); }
function watchModal(){
  var t=setInterval(function(){
    var c=document.querySelector('.razorpay-payment-form-container');
    if(!c || c.style.display==='none'){ clearInterval(t); setOpen(false); }
  },400);
}
btns.forEach(function(btn){
  ['pointerenter','touchstart','focus'].forEach(function(ev){ btn.addEventListener(ev,load,{passive:true}); });
  btn.addEventListener('click',function(){
    if(state==='ready'){ open(); return; }
    pendingBtn=btn; busy(btn,true); clearStatuses(); setStatus(btn,'Opening secure checkout…');
    if(state==='failed') state='idle';
    load();
    clearTimeout(timer); timer=setTimeout(function(){ if(state!=='ready') fail(false); },WAIT_MS);
  });
});
/* Load once the page is idle, so checkout is usually ready before the first click. */
function idle(){ (window.requestIdleCallback||function(f){ setTimeout(f,1); })(load,{timeout:3000}); }
if(document.readyState==='complete') idle(); else window.addEventListener('load',idle);
})();
