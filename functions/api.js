const SHEET_ID = '1Z8GftsfaAgwDNuXLMTNrQwCV6V5W-hpHlI893INosSw';
const API_KEY  = 'AIzaSyCTADjNIhq3jXSJiI_WO_jPsp63pTklT_A';
const SHEETS = {
  'switch':       'SWiTCH',
  'osl':          'OSLSWiTCH',
  'pitchSw':      'PITCH SWiTCH',
  'regles':       'REGLES',
  'pitchOsl':     'PITCH ONE SHOT LIVE',
  'inscriptions':    'INSCRIPTIONS',
  'contactSw':       'CONTACT SWiTCH',
  'information':     'INFORMATION',
  'informationLieu': 'INFORMATION LIEU',
  'pitchSwBig':    'PITCH SWiTCH BIG',
  'reglesBig':     'REGLES BIG',
  'proRaceCafe':   'PRO RACE CAFE',
  'reservation':   'RESERVATION',
  'promoSw':       'PROMO SWiTCH',
  'pitchMesPrestas': 'PITCH MES PRESTAS'
};
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzRxLRh2URcPDRhMKC9mQwDsToEBTGCkrRrULgAFqYSvaldTh2wWRZGP7vbZa9eMYWP/exec';
const FB_APP_ID = '3170724703113870';
const VIDEOS_SHEET = 'VIDEOS';

const R2_PUBLIC_BASE = 'https://www.laswitch.net/photos/switch';

async function getHiddenRows(sheetTitle) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}&fields=sheets(properties(title),data(rowMetadata(hiddenByUser)))&includeGridData=false`;
  const r = await fetch(url);
  const data = await r.json();
  if (data.error) return [];
  const sheet = (data.sheets || []).find(s => s.properties && s.properties.title === sheetTitle);
  if (!sheet || !sheet.data || !sheet.data[0] || !sheet.data[0].rowMetadata) return [];
  return sheet.data[0].rowMetadata.map(m => m.hiddenByUser === true);
}

async function readSheet(name) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(name)}?key=${API_KEY}`;
  const r = await fetch(url);
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  const allRows = (data.values || []).map(row => row.map(cell => String(cell || '').trim().replace(/[`\u2018\u2019\u201A\u201B]/g, "'")));
  const hiddenRows = await getHiddenRows(name);
  return { rows: allRows.filter((_, i) => !hiddenRows[i]), sheetName: name };
}

// Lecture SWiTCH : garde les lignes header (i<4) + celles dont col B (index 1) = FALSE
// Lecture SWiTCH : renvoie TOUTES les lignes sans filtrage.
// Le front filtre selon le mode (admin = tout afficher, user = seulement col B FALSE)
async function readSwitchSheet() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent('SWiTCH')}?key=${API_KEY}`;
  const r = await fetch(url);
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  const allRows = (data.values || []).map(row => row.map(cell => String(cell || '').trim().replace(/[`\u2018\u2019\u201A\u201B]/g, "'")));
  return { rows: allRows, sheetName: 'SWiTCH' };
}

// Lecture OSLSWiTCH :
//   - Lit I1 (ligne 0, col 8) pour determiner le mode
//   - Si I1 = false/vide -> garde header (i<4) + col B (index 1) = FALSE
//   - Si I1 = true       -> garde header (i<4) + col D (index 3) = TRUE
async function readOslSheet() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent('OSLSWiTCH')}?key=${API_KEY}`;
  const r = await fetch(url);
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  const allRows = (data.values || []).map(row => row.map(cell => String(cell || '').trim().replace(/[`\u2018\u2019\u201A\u201B]/g, "'")));
  const i1val = (allRows[0] && allRows[0][8]) ? allRows[0][8].trim().toLowerCase() : '';
  const i1IsTrue = (i1val === 'true' || i1val === 'vrai');
  const isFalse = v => { const s = v.trim().toLowerCase(); return s === 'false' || s === 'faux'; };
  const isTrue  = v => { const s = v.trim().toLowerCase(); return s === 'true'  || s === 'vrai'; };
  let filtered;
  if (i1IsTrue) {
    // Mode I1=TRUE : afficher celles dont col D (index 3) = TRUE
    filtered = allRows.filter((row, i) => i < 4 || isTrue(row[3] || ''));
  } else {
    // Mode I1=FALSE : afficher celles dont col B (index 1) = FALSE
    filtered = allRows.filter((row, i) => i < 4 || isFalse(row[1] || ''));
  }
  return { rows: filtered, sheetName: 'OSLSWiTCH' };
}

async function handleRequest(request, env) {
  const url = new URL(request.url);

  if (url.pathname === '/marco-switch-ajoutnomfb') {
    return new Response(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Ajouter Nom">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#0a0a0f">
<title>Ajouter un nom</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{
  --bg:#0a0a0f;
  --card:#13131f;
  --border:#1e1e30;
  --gold:#f2c94c;
  --gglo:rgba(242,201,76,.25);
  --cyan:#34d1c0;
  --white:#ece9e0;
  --muted:#5a5a78;
  --r:14px;
}
html,body{height:100%;overscroll-behavior:none}
body{
  background:var(--bg);
  color:var(--white);
  font-family:'DM Sans',sans-serif;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  min-height:100vh;
  padding:24px 20px;
  padding-top:max(24px,env(safe-area-inset-top));
  padding-bottom:max(24px,env(safe-area-inset-bottom));
}
body::before{
  content:'';position:fixed;inset:0;z-index:0;
  background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(242,201,76,.08) 0%,transparent 70%);
  pointer-events:none;
}
.wrap{position:relative;z-index:1;width:100%;max-width:420px;display:flex;flex-direction:column;align-items:center;gap:0}

/* Titre */
.title{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(42px,12vw,64px);
  letter-spacing:4px;
  color:var(--gold);
  text-shadow:0 0 40px var(--gglo);
  text-align:center;
  margin-bottom:6px;
}
.subtitle{
  font-family:'DM Sans',sans-serif;
  font-size:13px;
  color:var(--muted);
  letter-spacing:2px;
  text-transform:uppercase;
  text-align:center;
  margin-bottom:36px;
}

/* Champ */
.field{
  width:100%;
  background:var(--card);
  border:1px solid var(--border);
  border-radius:var(--r);
  padding:16px 20px;
  font-family:'DM Sans',sans-serif;
  font-size:18px;
  font-weight:600;
  color:var(--white);
  outline:none;
  -webkit-appearance:none;
  transition:border-color .2s, box-shadow .2s;
  caret-color:var(--gold);
  margin-bottom:14px;
}
.field:focus{
  border-color:var(--gold);
  box-shadow:0 0 0 3px rgba(242,201,76,.12);
}
.field::placeholder{color:var(--muted);font-weight:400}

/* Aperçu du nom saisi */
.preview{
  width:100%;
  min-height:28px;
  text-align:center;
  font-size:15px;
  font-weight:600;
  color:var(--cyan);
  letter-spacing:.5px;
  margin-bottom:20px;
  opacity:0;
  transition:opacity .2s;
}
.preview.visible{opacity:1}

/* Bouton */
.btn{
  width:100%;
  background:var(--gold);
  color:#000;
  border:none;
  border-radius:var(--r);
  padding:18px;
  font-family:'Bebas Neue',sans-serif;
  font-size:22px;
  letter-spacing:3px;
  cursor:pointer;
  transition:opacity .15s, transform .1s;
  -webkit-appearance:none;
}
.btn:disabled{opacity:.35;cursor:default}
.btn:not(:disabled):active{transform:scale(0.98);opacity:.9}

/* État résultat */
.result{
  display:none;
  flex-direction:column;
  align-items:center;
  gap:14px;
  text-align:center;
  padding:10px 0;
}
.result.visible{display:flex}
.result-icon{font-size:52px;line-height:1}
.result-title{
  font-family:'Bebas Neue',sans-serif;
  font-size:28px;
  letter-spacing:2px;
}
.result-name{
  font-size:17px;
  font-weight:700;
  color:var(--cyan);
}
.result-msg{font-size:14px;color:var(--muted);line-height:1.5}
.btn-again{
  margin-top:8px;
  background:none;
  border:1px solid var(--border);
  border-radius:var(--r);
  padding:14px 28px;
  font-family:'DM Sans',sans-serif;
  font-size:15px;
  font-weight:700;
  color:var(--white);
  cursor:pointer;
  -webkit-appearance:none;
}

/* Spinner */
@keyframes spin{to{transform:rotate(360deg)}}
.spinner{
  display:none;
  width:24px;height:24px;
  border:3px solid rgba(0,0,0,.2);
  border-top-color:#000;
  border-radius:50%;
  animation:spin .7s linear infinite;
  margin:0 auto;
}
.btn.loading .btn-label{display:none}
.btn.loading .spinner{display:block}
</style>
</head>
<body>
<div class="wrap">

  <!-- FORMULAIRE -->
  <div id="form-view">
    <div class="title">SWiTCH</div>
    <div class="subtitle">Ajouter un nom Facebook</div>

    <input
      class="field"
      id="nom-input"
      type="text"
      placeholder="Prénom Nom exact Facebook…"
      autocomplete="off"
      autocorrect="off"
      spellcheck="false"
      oninput="onInput(this.value)"
    >

    <div class="preview" id="preview"></div>

    <button class="btn" id="submit-btn" disabled onclick="submit()">
      <span class="btn-label">AJOUTER</span>
      <div class="spinner"></div>
    </button>
  </div>

  <!-- RÉSULTAT -->
  <div class="result" id="result-view">
    <div class="result-icon" id="result-icon">✅</div>
    <div class="result-title" id="result-title">AJOUTÉ !</div>
    <div class="result-name" id="result-name"></div>
    <div class="result-msg" id="result-msg"></div>
    <button class="btn-again" onclick="reset()">Ajouter un autre nom</button>
  </div>

</div>

<script>
var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz-6BtAXoKEx2oWbfFt8u3N6XuKMjfZ7f7ReGDn7wbkbz9JlJnRv0fR5Zqm8JWyDpM1/exec';

function onInput(val) {
  var preview = document.getElementById('preview');
  var btn = document.getElementById('submit-btn');
  var trimmed = val.trim();
  if (trimmed) {
    preview.textContent = '→ "' + trimmed + '"';
    preview.classList.add('visible');
    btn.disabled = false;
  } else {
    preview.textContent = '';
    preview.classList.remove('visible');
    btn.disabled = true;
  }
}

function submit() {
  var input = document.getElementById('nom-input');
  var nom = input.value.trim();
  if (!nom) return;

  var btn = document.getElementById('submit-btn');
  btn.classList.add('loading');
  btn.disabled = true;

  var url = APPS_SCRIPT_URL + '?action=addAppliName&name=' + encodeURIComponent(nom);

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      btn.classList.remove('loading');
      if (data.ok) {
        showResult(true, nom, data.ligne ? 'Ligne ' + data.ligne + ' de IDS_APPLI' : '');
      } else if (data.duplicate) {
        showResult(false, nom, 'Ce nom existe déjà dans la liste.');
      } else {
        showResult(false, nom, data.error || 'Erreur inconnue.');
      }
    })
    .catch(function(e) {
      btn.classList.remove('loading');
      showResult(false, nom, 'Erreur réseau. Vérifie ta connexion.');
    });
}

function showResult(ok, nom, msg) {
  document.getElementById('form-view').style.display = 'none';
  var rv = document.getElementById('result-view');
  rv.classList.add('visible');
  document.getElementById('result-icon').textContent = ok ? '✅' : '⚠️';
  document.getElementById('result-title').textContent = ok ? 'AJOUTÉ !' : 'PROBLÈME';
  document.getElementById('result-title').style.color = ok ? 'var(--gold)' : '#e8407a';
  document.getElementById('result-name').textContent = '"' + nom + '"';
  document.getElementById('result-msg').textContent = msg || '';
}

function reset() {
  document.getElementById('form-view').style.display = '';
  var rv = document.getElementById('result-view');
  rv.classList.remove('visible');
  var input = document.getElementById('nom-input');
  input.value = '';
  document.getElementById('preview').classList.remove('visible');
  document.getElementById('preview').textContent = '';
  var btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.classList.remove('loading');
  setTimeout(function(){ input.focus(); }, 100);
}

// Focus auto au chargement
window.addEventListener('load', function() {
  setTimeout(function(){ document.getElementById('nom-input').focus(); }, 300);
});

// Entrée clavier = soumettre
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    var btn = document.getElementById('submit-btn');
    if (!btn.disabled) submit();
  }
});
</script>
</body>
</html>
`, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }
    });
  }

  if (url.pathname !== '/api') {
    return env.ASSETS.fetch(request);
  }

  const action = url.searchParams.get('action');

  if (request.method === 'POST' && action === 'setMode') {
    try {
      const body = await request.json();
      const mode = ['gif','video','photos','alternance'].includes(body.mode) ? body.mode : 'video';
      await env.LASWITCH_KV.put('home_mode', mode);
      return new Response(JSON.stringify({ ok: true, mode }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (request.method === 'POST' && action === 'setResa') {
    try {
      const body = await request.json();
      const mode = body.mode === 'off' ? 'off' : 'on';
      await env.LASWITCH_KV.put('resa_mode', mode);
      return new Response(JSON.stringify({ ok: true, mode }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (request.method === 'POST' && action === 'inscrire') {
    try {
      const body = await request.json();
      const r = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre: body.titre, nom: body.nom })
      });
      const data = await r.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (request.method === 'POST' && action === 'setVideo') {
    try {
      const body = await request.json();
      await env.LASWITCH_KV.put('video_url', body.url || '');
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (request.method === 'POST' && action === 'setGifIndex') {
    try {
      const body = await request.json();
      const index = parseInt(body.index) || 0;
      await env.LASWITCH_KV.put('gif_index', String(index));
      return new Response(JSON.stringify({ ok: true, index }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (request.method === 'POST' && action === 'setPitchMode') {
    try {
      const body = await request.json();
      const mode = body.mode === 'gif' ? 'gif' : 'normal';
      await env.LASWITCH_KV.put('pitch_mode', mode);
      return new Response(JSON.stringify({ ok: true, mode }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // GET assets : photos listées depuis R2 directement via env.R2_BUCKET, videos/gifs depuis GitHub
  if (request.method === 'GET' && action === 'getAssets') {
    try {
      // Photos : R2 si dispo, fallback GitHub
      let photos = [];
      if (env.R2_BUCKET) {
        try {
          const listed = await env.R2_BUCKET.list({ prefix: 'photos/switch/', delimiter: '/' });
          photos = listed.objects
            .filter(obj => obj.key.match(/\.(jpg|jpeg|png|webp)$/i))
            .map(obj => {
              const name = obj.key.split('/').pop();
              const fullUrl = `${R2_PUBLIC_BASE}/${encodeURIComponent(name)}`;
              return { name, url: fullUrl, full: fullUrl };
            });
        } catch(e) { photos = []; }
      }
      if (!photos.length) {
        try {
          const ghRes = await fetch('https://api.github.com/repos/switchlivefr/laswitch/contents/assets/photos', { headers: { 'User-Agent': 'laswitch-app' } });
          const ghData = await ghRes.json();
          if (Array.isArray(ghData)) photos = ghData.filter(f => f.name.match(/\.(jpg|jpeg|png|webp)$/i) && f.name !== '.gitkeep').map(f => ({ name: f.name, url: f.download_url, full: f.download_url }));
        } catch(e) { photos = []; }
      }

      // Videos : R2 videos/switch/events/ en priorité, fallback GitHub
      let videosData = [];
      if (env.R2_BUCKET) {
        try {
          const videosListed = await env.R2_BUCKET.list({ prefix: 'videos/switch/events/', delimiter: '/' });
          videosData = videosListed.objects
            .filter(obj => obj.key.match(/\.(mp4|webm|ogg)$/i))
            .map(obj => {
              const name = obj.key.split('/').pop();
              return { name, url: `https://www.laswitch.net/videos/switch/events/${encodeURIComponent(name)}` };
            });
        } catch(e) { videosData = []; }
      }
      // Fallback GitHub si R2 vide
      let assetsData = null;
      if (!videosData.length) {
        try {
          const videosRes = await fetch('https://api.github.com/repos/switchlivefr/laswitch/contents/assets', {
            headers: { 'User-Agent': 'laswitch-app' }
          });
          assetsData = await videosRes.json();
        } catch(e) { assetsData = null; }
      }

      // Gifs depuis R2
      let gifsData = [];
      if (env.R2_BUCKET) {
        try {
          const gifsListed = await env.R2_BUCKET.list({ prefix: 'gifs/', delimiter: '/' });
          gifsData = gifsListed.objects
            .filter(obj => obj.key.match(/\.(gif|jpg|jpeg|png|webp)$/i))
            .map(obj => ({
              name: obj.key.split('/').pop(),
              url: `https://www.laswitch.net/gifs/${encodeURIComponent(obj.key.split('/').pop())}`
            }));
        } catch(e) { gifsData = []; }
      }
      // Fallback GitHub si R2 vide
      if (!gifsData.length) {
        try {
          const gifsRes = await fetch('https://api.github.com/repos/switchlivefr/laswitch/contents/assets/Gif', {
            headers: { 'User-Agent': 'laswitch-app' }
          });
          const gifsRaw = await gifsRes.json();
          if (Array.isArray(gifsRaw)) gifsData = gifsRaw.filter(f => f.name.match(/\.(gif|jpg|jpeg|png|webp)$/i) && f.name !== '.gitkeep').map(f => ({ name: f.name, url: f.download_url }));
        } catch(e) { gifsData = []; }
      }

      const videos = videosData.length
        ? videosData
        : (Array.isArray(assetsData)
            ? assetsData.filter(f => f.name.match(/\.mp4$/i))
                .map(f => ({ name: f.name, url: f.download_url }))
            : []);
      const gifs = Array.isArray(gifsData)
        ? gifsData.filter(f => f.name && f.name.match(/\.(gif|jpg|jpeg|png|webp)$/i) && f.name !== '.gitkeep')
            .map(f => ({ name: f.name, url: f.url || f.download_url }))
        : [];

      return new Response(JSON.stringify({ photos, videos, gifs }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'max-age=300'
        }
      });
    } catch(e) {
      return new Response(JSON.stringify({ photos: [], videos: [], gifs: [], error: e.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // GET photos Pro Race Cafe depuis R2
  if (request.method === 'GET' && action === 'getPrcPhotos') {
    try {
      let photos = [];
      if (env.R2_BUCKET) {
        const listed = await env.R2_BUCKET.list({ prefix: 'photos/proracecafe/reservation/', delimiter: '/' });
        photos = listed.objects
          .filter(obj => obj.key.match(/\.(jpg|jpeg|png|webp)$/i))
          .map(obj => {
            const name = obj.key.split('/').pop();
            return { name, url: `https://www.laswitch.net/photos/proracecafe/reservation/${encodeURIComponent(name)}` };
          });
      }
      return new Response(JSON.stringify({ photos }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'max-age=300' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ photos: [], error: e.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // GET photos depuis Google Drive
  if (request.method === 'GET' && action === 'getPhotos') {
    try {
      const folderId = '1UCSMq48CuBEFWWgTUB7QoxY7Fzgf2xW2';
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent("'" + folderId + "' in parents and mimeType contains 'image/' and trashed=false")}&key=${API_KEY}&fields=${encodeURIComponent('files(id,name,imageMediaMetadata(width,height))')}&pageSize=50&orderBy=name`;
      const r = await fetch(url);
      if (!r.ok) throw new Error('Drive API error: ' + r.status);
      const data = await r.json();
      if (data.error) throw new Error('Drive: ' + data.error.message);
      const photos = (data.files || []).map(f => ({
        id: f.id,
        name: f.name,
        landscape: f.imageMediaMetadata ? f.imageMediaMetadata.width > f.imageMediaMetadata.height : false,
        thumb: `https://lh3.googleusercontent.com/d/${f.id}=w220`,
        full:  `https://lh3.googleusercontent.com/d/${f.id}=w1200`
      }));
      return new Response(JSON.stringify({ photos }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'max-age=300' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ photos: [], error: e.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // GET fbId depuis un nom (pour Accès SWiTCH sans Facebook)
  if (request.method === 'GET' && action === 'getFbIdFromName') {
    try {
      const name = (url.searchParams.get('name') || '').trim().toLowerCase();
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/IDS_FBK?key=${API_KEY}`;
      const r = await fetch(sheetUrl);
      const data = await r.json();
      const rows = (data.values || []).slice(1);
      for (const row of rows) {
        if ((row[1] || '').trim().toLowerCase() === name) {
          return new Response(JSON.stringify({ fbId: row[0] }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      }
      return new Response(JSON.stringify({ fbId: '' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ fbId: '' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // GET videos par ID Facebook
  if (request.method === 'GET' && action === 'getVideos') {
    try {
      const fbId = (url.searchParams.get('fbid') || '').trim();
      const nom = (url.searchParams.get('nom') || '').trim().toLowerCase();
      const fullname = (url.searchParams.get('fullname') || '').trim().toLowerCase();

      // fbid=ALL = mode admin → toutes les vidéos
      const isAdmin = fbId === 'ALL';

      if (!fbId) return new Response(JSON.stringify({ videos: [] }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });

      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(VIDEOS_SHEET)}?key=${API_KEY}`;
      const r = await fetch(sheetUrl);
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);

      const rows = (data.values || []).slice(1);
      const videos = [];
      for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx];
        const youtube = (row[0] || '').trim();
        const phrase  = (row[1] || '').trim();
        const personnes = (row[2] || '').trim();
        const date    = (row[3] || '').trim();
        const fb_ids  = (row[4] || '').trim();
        const ids_facebook = (row[5] || '').trim();
        const titre   = (row[6] || '').trim();
        const phrase2 = (row[7] || '').trim();
        const lieu    = (row[8] || '').trim();
        const rowIndex = rowIdx + 2; // +1 pour header, +1 pour 1-based
        if (!youtube) continue;

        if (!isAdmin) {
          // Chercher l'ID Facebook dans la colonne fb_ids
          const ids = fb_ids.split('|').map(i => i.trim());
          if (!ids.includes(fbId)) continue;
        }

        videos.push({ youtube, phrase, personnes, date, fb_ids, ids_facebook, titre, phrase2, lieu, rowIndex });
      }

      // Tri du plus récent au plus ancien
      videos.sort((a, b) => {
        const parseDate = d => {
          if (!d) return 0;
          const p = d.split('/');
          if (p.length === 3) return new Date(p[2], p[1]-1, p[0]).getTime();
          return 0;
        };
        return parseDate(b.date) - parseDate(a.date);
      });

      return new Response(JSON.stringify({ videos }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        }
      });
    } catch(e) {
      return new Response(JSON.stringify({ videos: [], error: e.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }


  // GET getFbLink : lien Facebook d'un utilisateur depuis IDS_APPLI (col A=nom, H=fb_id, I=lien)
  if (request.method === 'GET' && action === 'getFbLink') {
    try {
      const fbId = (url.searchParams.get('fbid') || '').trim();
      const name = (url.searchParams.get('name') || '').trim().toLowerCase();
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/IDS_APPLI?key=${API_KEY}`;
      const r = await fetch(sheetUrl);
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const rows = (data.values || []).slice(1);
      for (const row of rows) {
        const rowName = (row[0] || '').trim().toLowerCase();
        const rowFbId = (row[7] || '').trim();
        const rowLink = (row[8] || '').trim();
        if (rowLink && ((fbId && rowFbId === fbId) || (name && rowName === name))) {
          return new Response(JSON.stringify({ link: rowLink }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      }
      return new Response(JSON.stringify({ link: '' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ link: '', error: e.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // GET getPrenom — cherche dans IDS_APPLI col A (nom) → col G (index 6) = prénom
  if (request.method === 'GET' && action === 'getPrenom') {
    try {
      const name = (url.searchParams.get('name') || '').trim().toLowerCase();
      if (!name) return new Response(JSON.stringify({ prenom: '' }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent('IDS_APPLI')}?key=${API_KEY}`;
      const r = await fetch(sheetUrl);
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const rows = (data.values || []).slice(1);
      const match = rows.find(row => (row[0]||'').trim().toLowerCase() === name);
      const prenom = match ? (match[6]||'').trim() : '';
      return new Response(JSON.stringify({ prenom }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch(e) {
      return new Response(JSON.stringify({ prenom: '', error: e.message }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
  }

  // GET IDS_FBK : liste des IDs Facebook pour la recherche admin
  if (request.method === 'GET' && action === 'getIdsFbk') {
    try {
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent('IDS_FBK')}?key=${API_KEY}`;
      const r = await fetch(sheetUrl);
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const rows = (data.values || []).slice(1);
      const ids = rows
        .filter(row => row[0] && row[1])
        .map(row => ({ fb_id: row[0].trim(), name: row[1].trim(), nb: parseInt(row[2]||0) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
      return new Response(JSON.stringify({ ids }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'max-age=300' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ ids: [], error: e.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // GET searchVideos : recherche par phrase (mode texte libre)
  if (request.method === 'GET' && action === 'searchVideos') {
    try {
      const query = (url.searchParams.get('q') || '').trim().toLowerCase();
      if (!query) return new Response(JSON.stringify({ videos: [] }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });

      // Normalisation identique au front (swNormalize) : minuscules + suppression des accents
      const swNormalize = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      // swMatchTokens : chaque token du mot saisi doit commencer un mot distinct du nom candidat
      const swMatchTokens = (candidate, input) => {
        const inputTokens = swNormalize(input).trim().split(/\s+/).filter(t => t.length > 0);
        const nameWords   = swNormalize(candidate).split(/\s+/).filter(w => w.length > 0);
        const used = [];
        return inputTokens.every(token => {
          for (let i = 0; i < nameWords.length; i++) {
            if (!used.includes(i) && nameWords[i].startsWith(token)) {
              used.push(i);
              return true;
            }
          }
          return false;
        });
      };

      // Charger VIDEOS et IDS_APPLI en parallèle
      const [rVideos, rIdsAppli] = await Promise.all([
        fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(VIDEOS_SHEET)}?key=${API_KEY}`),
        fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent('IDS_APPLI')}?key=${API_KEY}`)
      ]);
      const [dataVideos, dataIdsAppli] = await Promise.all([rVideos.json(), rIdsAppli.json()]);
      if (dataVideos.error) throw new Error(dataVideos.error.message);

      // Construire la liste des noms Facebook (col A de IDS_APPLI, sans la ligne d'en-tête)
      // qui correspondent au mot cherché → ces noms seront exclus des résultats
      const idsAppliRows = (dataIdsAppli.values || []).slice(1);
      const matchingFbNames = new Set(
        idsAppliRows
          .map(row => (row[0] || '').trim())
          .filter(name => name && swMatchTokens(name, query))
          .map(name => swNormalize(name))
      );

      const rows = (dataVideos.values || []).slice(1);
      const videos = [];
      for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx];
        const youtube = (row[0] || '').trim();
        const phrase  = (row[1] || '').trim();
        const personnes = (row[2] || '').trim();
        const date    = (row[3] || '').trim();
        const fb_ids  = (row[4] || '').trim();
        const ids_facebook = (row[5] || '').trim();
        const titre   = (row[6] || '').trim();
        const phrase2 = (row[7] || '').trim();
        const lieu    = (row[8] || '').trim();
        const rowIndex = rowIdx + 2;
        if (!youtube) continue;
        if (!phrase.toLowerCase().includes(query) && !personnes.toLowerCase().includes(query) && !titre.toLowerCase().includes(query) && !phrase2.toLowerCase().includes(query)) continue;

        // Exclure la vidéo si un de ses noms Facebook associés (ids_facebook, séparateur |)
        // correspond au mot cherché (même logique swMatchTokens)
        if (matchingFbNames.size > 0 && ids_facebook) {
          const videoFbNames = ids_facebook.split('|').map(n => n.trim()).filter(Boolean);
          const hasMatchingFbName = videoFbNames.some(n => matchingFbNames.has(swNormalize(n)));
          if (hasMatchingFbName) continue;
        }

        videos.push({ youtube, phrase, personnes, date, fb_ids, ids_facebook, titre, phrase2, lieu, rowIndex });
      }
      videos.sort((a, b) => {
        const parseDate = d => { if (!d) return 0; const p = d.split('/'); if (p.length === 3) return new Date(p[2], p[1]-1, p[0]).getTime(); return 0; };
        return parseDate(b.date) - parseDate(a.date);
      });
      return new Response(JSON.stringify({ videos }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ videos: [], error: e.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // POST setVideoMeta — écrit phrase2 (col H), fb_ids (col E), ids_facebook (col F) dans VIDEOS
  if (request.method === 'POST' && action === 'setVideoMeta') {
    try {
      const body = await request.json();
      const rowIndex    = parseInt(body.rowIndex || 0);
      const phrase2     = String(body.phrase2 || '');
      const fb_ids      = String(body.fb_ids || '');
      const ids_facebook = String(body.ids_facebook || '');
      if (!rowIndex) return new Response(JSON.stringify({ error: 'rowIndex manquant' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      const scriptUrl = APPS_SCRIPT_URL + '?action=setVideoMeta&rowIndex=' + rowIndex +
        '&phrase2=' + encodeURIComponent(phrase2) +
        '&fb_ids=' + encodeURIComponent(fb_ids) +
        '&ids_facebook=' + encodeURIComponent(ids_facebook);
      const r = await fetch(scriptUrl);
      const data = await r.json();
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
  }

  // POST setPrenom — écrit le prénom en colonne G de IDS_APPLI via Apps Script
  if (request.method === 'POST' && action === 'setPrenom') {
    try {
      const body = await request.json();
      const name   = (body.name   || '').trim();
      const prenom = (body.prenom || '').trim();
      if (!name || !prenom) return new Response(JSON.stringify({ error: 'Paramètres manquants' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      const scriptUrl = APPS_SCRIPT_URL + '?action=setPrenom&name=' + encodeURIComponent(name) + '&prenom=' + encodeURIComponent(prenom);
      const r = await fetch(scriptUrl);
      const data = await r.json();
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
  }

  // GET : lecture des sheets
  try {
    const result = {};
    for (const [key, name] of Object.entries(SHEETS)) {
      try {
        if (key === 'switch') {
          result[key] = await readSwitchSheet();
        } else if (key === 'osl') {
          result[key] = await readOslSheet();
        } else {
          result[key] = await readSheet(name);
        }
      }
      catch(e) { result[key] = { error: e.message }; }
    }
    const homeMode = await env.LASWITCH_KV.get('home_mode');
    const resaMode = await env.LASWITCH_KV.get('resa_mode');
    const videoUrl = await env.LASWITCH_KV.get('video_url');
    result.homeMode = homeMode || 'video';
    const gifIndex = await env.LASWITCH_KV.get('gif_index');
    result.gifIndex = parseInt(gifIndex) || 0;
    result.resaMode = resaMode || 'on';
    const pitchMode = await env.LASWITCH_KV.get('pitch_mode');
    result.pitchMode = pitchMode || 'normal';
    if (videoUrl) result.videoUrl = videoUrl;
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });
  } catch(err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export default {
  fetch: handleRequest
};
