const SHEET_ID = '1Z8GftsfaAgwDNuXLMTNrQwCV6V5W-hpHlI893INosSw';
const API_KEY  = 'AIzaSyCTADjNIhq3jXSJiI_WO_jPsp63pTklT_A';

const SHEETS = {
  'switch':   'SWiTCH',
  'osl':      'OSLSWiTCH',
  'pitchSw':  'PITCH SWiTCH',
  'regles':   'REGLES',
  'pitchOsl': 'PITCH ONE SHOT LIVE'
};

async function readSheet(name) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(name)}?key=${API_KEY}`;
  const r = await fetch(url);
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  const rows = (data.values || []).map(row => row.map(cell => String(cell || '').trim()));
  return { rows, sheetName: name };
}

exports.handler = async function() {
  try {
    const result = {};
    for (const [key, name] of Object.entries(SHEETS)) {
      try { result[key] = await readSheet(name); }
      catch(e) { result[key] = { error: e.message }; }
    }
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch(err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};


