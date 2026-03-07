const API = 'https://script.google.com/macros/s/AKfycbz2XSC4nTEgfvTI7MVyAYCnn1SRf2dLX7DI0fBTLATl3Tb09z43JkvBmgPV8PjIvLBK/exec';

exports.handler = async function(event, context) {
  try {
    const response = await fetch(API, { redirect: 'follow' });
    const data = await response.text();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: data
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
