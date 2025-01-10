1. Create a Reddit app at: https://www.reddit.com/prefs/apps

- set redirect uri to http://localhost:3000/callback

2. Create a .env file with the following variables:

- REDDIT_CLIENT_ID
- REDDIT_CLIENT_SECRET
- REDDIT_USER_AGENT
- REDDIT_REDIRECT_URI=http://localhost:3000/callback

3. Run the get-tokens script per below:

```
import { getAccessTokens } from '@gentic/client-reddit';

getAccessTokens({
clientId: process.env.REDDIT_CLIENT_ID!,
clientSecret: process.env.REDDIT_CLIENT_SECRET!,
userAgent: process.env.REDDIT_USER_AGENT!,
redirectUri: process.env.REDDIT_REDIRECT_URI!,
});

```

pnpm tsx agent/src/get-tokens.ts

4. Add the acess token and refresh token to the .env file
