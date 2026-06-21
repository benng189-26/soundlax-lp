// Decap CMS GitHub OAuth - Step 2: exchange code for token and return to CMS
module.exports = async function handler(req, res) {
  var code = req.query.code;
  var error = req.query.error;

  if (error || !code) {
    res.status(400).send('OAuth error: ' + (error || 'missing code'));
    return;
  }

  try {
    var tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        code: code,
      }),
    });
    var data = await tokenRes.json();
    if (data.error) throw new Error(data.error_description || data.error);

    var payload = JSON.stringify({ token: data.access_token, provider: 'github' });
    var message = 'authorization:github:success:' + payload;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send('<!DOCTYPE html><html><body>\n<script>\n(function () {\n  var msg = ' + JSON.stringify(message) + ';\n  function receive(e) {\n    window.opener && window.opener.postMessage(msg, e.origin);\n    window.close();\n  }\n  window.addEventListener("message", receive, false);\n  window.opener && window.opener.postMessage("authorizing:github", "*");\n})();\n</script>\n<p>Authorizing&hellip;</p>\n</body></html>');
  } catch (err) {
    var errMsg = JSON.stringify('authorization:github:error:' + (err.message || 'unknown'));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send('<!DOCTYPE html><html><body>\n<script>\n(function() {\n  window.opener && window.opener.postMessage(' + errMsg + ', "*");\n  window.close();\n})();\n</script>\n<p>Authentication failed.</p>\n</body></html>');
  }
};
