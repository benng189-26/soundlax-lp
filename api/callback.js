// Decap CMS GitHub OAuth - Step 2: exchange code for token, post back to CMS window
module.exports = async function handler(req, res) {
  var code  = req.query.code;
  var error = req.query.error;

  if (error || !code) {
    return sendScript(res, 'error', error || 'missing code');
  }

  try {
    var tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id:     process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        code:          code,
      }),
    });
    var data = await tokenRes.json();
    if (data.error) throw new Error(data.error_description || data.error);
    sendScript(res, 'success', data.access_token);
  } catch (err) {
    sendScript(res, 'error', err.message || 'unknown error');
  }
};

function sendScript(res, status, value) {
  var msg = status === 'success'
    ? 'authorization:github:success:' + JSON.stringify({ token: value, provider: 'github' })
    : 'authorization:github:error:'   + JSON.stringify(String(value));

  // Post immediately AND on any ping from the CMS opener (handles both Decap v2/v3)
  var script = [
    '(function(){',
    '  var msg = ' + JSON.stringify(msg) + ';',
    '  function send(){ window.opener && window.opener.postMessage(msg, "*"); }',
    '  send();',
    '  window.addEventListener("message", send, false);',
    '  setTimeout(function(){ window.close(); }, 2000);',
    '})();',
  ].join('\n');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send('<!DOCTYPE html><html><body><script>' + script + '<\/script><p>Authorizing…</p></body></html>');
}
