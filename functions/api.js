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
  'reglesBig':     'REGLES BIG'
};
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzRxLRh2URcPDRhMKC9mQwDsToEBTGCkrRrULgAFqYSvaldTh2wWRZGP7vbZa9eMYWP/exec';

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

async function handleRequest(request, env) {
  const url = new URL(request.url);

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

      // Videos et Gifs depuis GitHub (inchangé)
      const [videosRes] = await Promise.all([
        fetch('https://api.github.com/repos/switchlivefr/laswitch/contents/assets', {
          headers: { 'User-Agent': 'laswitch-app' }
        })
      ]);
      const assetsData = await videosRes.json();

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

      const videos = Array.isArray(assetsData)
        ? assetsData.filter(f => f.name.match(/\.mp4$/i))
            .map(f => ({ name: f.name, url: f.download_url }))
        : [];
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

  // GET : lecture des sheets
  try {
    const result = {};
    for (const [key, name] of Object.entries(SHEETS)) {
      try { result[key] = await readSheet(name); }
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
