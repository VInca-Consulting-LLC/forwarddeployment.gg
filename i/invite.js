// Invite landing page logic (https://forwarddeployment.gg/i/<code>). Shared by /i/index.html and /404.html (GitHub Pages serves 404.html for
// /i/<code>, which has no file of its own). Plain old-browser JS, no dependencies.
(function () {
  'use strict';
  // ---- TODO (user): fill these in. Until then the buttons say so and the page still works (copy link, open in the app).
  var APP_STORE_URL = '';      // TODO: https://apps.apple.com/app/idXXXXXXXXXX
  var PLAY_STORE_URL = '';     // TODO: https://play.google.com/store/apps/details?id=com.vincaconsult.fwddeployment
  var API = 'https://play.forwarddeployment.gg';
  var HTTP_KEY = '';           // TODO (optional): the Nakama runtime http_key, so the page can show "<name> challenged you". Empty = "A friend challenged you".
  var ANDROID_PACKAGE = 'com.vincaconsult.fwddeployment';
  var HOST = 'https://forwarddeployment.gg';

  var m = /^\/i\/([A-Za-z0-9]{6,12})\/?$/.exec(location.pathname) || /[?&]c=([A-Za-z0-9]{6,12})/.exec(location.search);
  var code = m ? m[1].toUpperCase() : '';
  var $ = function (id) { return document.getElementById(id); };
  var link = code ? HOST + '/i/' + code : HOST + '/';

  function copy(text) {
    function legacy() {
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-1000px;top:0;opacity:0';
        document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
        var ok = document.execCommand('copy'); document.body.removeChild(ta); return ok;
      } catch (e) { return false; }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacy(); });
    return Promise.resolve(legacy());
  }
  function note(ok) {
    var n = $('copied'); if (!n) return;
    n.textContent = ok ? 'Invite link copied. After installing, open the game, tap Play online, then New game, and paste it into the code box.' : 'Could not copy automatically. Link: ' + link;
    n.hidden = false;
  }
  function store(url) { return function (e) { if (!url) { e.preventDefault(); } copy(link).then(note); }; }
  function wire(id, url) {
    var a = $(id); if (!a) return;
    if (url) { a.href = url; a.removeAttribute('data-todo'); } else { a.setAttribute('data-todo', 'TODO: store URL not set yet'); a.title = 'Store link coming soon'; }
    a.addEventListener('click', store(url));
  }

  if (!code) {
    // /404.html for any other missing path
    if ($('who')) { document.title = 'Page not found · Forward Deployment'; $('who').textContent = 'Page not found'; if ($('sub')) $('sub').textContent = 'That link does not lead anywhere. If a friend sent you an invite, ask them to send it again.'; }
    var acts = $('actions'); if (acts) acts.hidden = true;
    return;
  }
  document.title = 'You have been challenged · Forward Deployment';
  if ($('code')) $('code').textContent = code;
  wire('ios', APP_STORE_URL); wire('android', PLAY_STORE_URL);
  var open = $('open');
  if (open) {
    var isAndroid = /Android/i.test(navigator.userAgent);
    // Android: an intent URL opens the installed app (or the Play listing). iOS/desktop: the https link itself; with the app installed iOS hands it to the app.
    open.href = isAndroid ? 'intent://forwarddeployment.gg/i/' + code + '#Intent;scheme=https;package=' + ANDROID_PACKAGE + ';' + (PLAY_STORE_URL ? 'S.browser_fallback_url=' + encodeURIComponent(PLAY_STORE_URL) + ';' : '') + 'end' : link;
    open.addEventListener('click', function () { copy(link).then(note); });
  }
  var both = $('copy'); if (both) both.addEventListener('click', function () { copy(link).then(note); });

  // "<name> challenged you": ask the game server (rpc fd_invite_peek). Best effort; the generic line stays when it fails.
  if (HTTP_KEY && window.fetch) {
    fetch(API + '/v2/rpc/fd_invite_peek?http_key=' + encodeURIComponent(HTTP_KEY) + '&unwrap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.ok && j.inviterName && j.state === 'open') $('who').textContent = String(j.inviterName).slice(0, 40) + ' challenged you';
        else if (j && (j.state === 'expired' || j.error === 'invalid')) { $('who').textContent = j.state === 'expired' ? 'This invite has expired' : 'This invite is not valid'; $('sub').textContent = 'Ask your friend to send a new one.'; }
        else if (j && j.state === 'claimed') { $('sub').textContent = 'This invite was already used. Ask your friend for a new one.'; }
      })
      .catch(function () { /* keep the generic text */ });
  }
})();
