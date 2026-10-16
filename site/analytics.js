// Google Analytics 4 with Consent Mode v2.
// Visitors from the EEA, the UK and Switzerland are not tracked with cookies until they press "Accept".
// Everyone else is tracked by default and can still decline in the banner.
(function () {
  var GA_ID = ''; // 'G-XXXXXXXXXX' from GA4 → Admin → Data streams. Empty = analytics off.
  if (!GA_ID) return;

  var KEY = 'tzs-consent';
  var EEA = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV',
    'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'CH'];
  var DENIED = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' };
  var GRANTED_ANALYTICS = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' };

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('consent', 'default', Object.assign({ region: EEA }, DENIED));
  gtag('consent', 'default', GRANTED_ANALYTICS);

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved === 'granted') gtag('consent', 'update', GRANTED_ANALYTICS);
  if (saved === 'denied') gtag('consent', 'update', DENIED);

  gtag('js', new Date());
  gtag('config', GA_ID);
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  if (saved) return;
  function banner() {
    var b = document.createElement('div');
    b.setAttribute('role', 'region');
    b.setAttribute('aria-label', 'Cookie consent');
    b.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:50;max-width:560px;margin:0 auto;' +
      'padding:14px 16px;border-radius:10px;background:var(--ink,#1F1D1A);color:var(--paper,#F6F3EC);' +
      'font:400 15px/1.5 "Source Sans 3",system-ui,sans-serif;display:flex;gap:12px;align-items:center;flex-wrap:wrap';
    b.innerHTML = '<span style="flex:1 1 240px">We use cookies to understand how visitors find us. ' +
      '<a href="/legal.html" style="color:inherit">Details</a></span>' +
      '<button data-v="denied">Decline</button><button data-v="granted">Accept</button>';
    Array.prototype.forEach.call(b.querySelectorAll('button'), function (btn) {
      btn.style.cssText = 'font:inherit;padding:6px 14px;border-radius:6px;cursor:pointer;border:1px solid currentColor;' +
        (btn.dataset.v === 'granted' ? 'background:var(--paper,#F6F3EC);color:var(--ink,#1F1D1A)' : 'background:transparent;color:inherit');
      btn.addEventListener('click', function () {
        var v = btn.dataset.v;
        gtag('consent', 'update', v === 'granted' ? GRANTED_ANALYTICS : DENIED);
        try { localStorage.setItem(KEY, v); } catch (e) {}
        b.remove();
      });
    });
    document.body.appendChild(b);
  }
  if (document.body) banner(); else document.addEventListener('DOMContentLoaded', banner);
})();
