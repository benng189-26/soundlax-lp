// Decap CMS GitHub OAuth - Step 1: redirect to GitHub
module.exports = function handler(req, res) {
  var clientId = process.env.OAUTH_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('OAUTH_CLIENT_ID is not configured. Add it in Vercel dashboard > Settings > Environment Variables.');
    return;
  }
  var params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: 'https://bentoji.co.nz/api/callback',
    scope: 'repo,user',
  });
  res.redirect(302, 'https://github.com/login/oauth/authorize?' + params.toString());
};
