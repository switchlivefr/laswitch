const API = 'https://script.google.com/macros/s/AKfycbz2XSC4nTEgfvTI7MVyAYCnn1SRf2dLX7DI0fBTLATl3Tb09z43JkvBmgPV8PjIvLBK/exec';

exports.handler = async function(event, context) {
  try {
    // Follow all redirects manually to get final JSON response
    let url = API;
    let response;
    let maxRedirects = 10;
    
    while (maxRedirects-- > 0) {
      response = await fetch(url, { 
        redirect: 'manual',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0'
        }
      });
      
      if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
        url = response.headers.get('location');
        if (!url) break;
        continue;
      }
      break;
    }

    const text = await response.text();
    
    // Extract JSON from response (Apps Script may wrap it)
    let json = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      // Validate it's real JSON
      try {
        JSON.parse(jsonMatch[0]);
        json = jsonMatch[0];
      } catch(e) {}
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: json
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};


