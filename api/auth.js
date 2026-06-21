// Decap CMS GitHub OAuth - Step 1: redirect to GitHub
module.exports = function handler(req, res) {
  var clientId = process.env.OAUTH_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('OAUTH_CLIENT_ID is not set. Go to Vercel > Settings > Environment Variables.');
    return;
  }
  // Use the actual request host so www vs non-www never mismatches
  var proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  var host  = req.headers['x-forwarded-host'] || req.headers.host || 'www.bentoji.co.nz';
  var redirectUri = proto + '://' + host + '/api/callback';

  var params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo,user',
  });
  res.redirect(302, 'https://github.com/login/oauth/authorize?' + params.toString());
};
