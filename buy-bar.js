/* Sticky bar on the service pages (#buyBar): shown only after the hero button has scrolled above the
   viewport. Hidden while the bottom card's button is on screen or the Razorpay modal is open. */
(function(){
var bar=document.getElementById('buyBar');
var hero=document.querySelector('.detail-cta .buy-btn, .detail-cta .btn-main');
var foot=document.querySelector('.detail-foot-card .buy-btn, .detail-foot-card .btn-main');
if(!bar || !hero || !('IntersectionObserver' in window)) return;
var heroGone=false, footVisible=false;
function updateBar(){
  var show=heroGone && !footVisible && !document.body.classList.contains('rzp-open');
  bar.classList.toggle('show',show);
  bar.setAttribute('aria-hidden',show?'false':'true');
  if(show) bar.removeAttribute('inert'); else bar.setAttribute('inert','');
}
document.addEventListener('rzpchange',updateBar);
new IntersectionObserver(function(es){ es.forEach(function(e){ heroGone=!e.isIntersecting && e.boundingClientRect.top<0; }); updateBar(); }).observe(hero);
if(foot) new IntersectionObserver(function(es){ es.forEach(function(e){ footVisible=e.isIntersecting; }); updateBar(); }).observe(foot);
})();
