import { getAccessTokens } from '@gentic/client-reddit';
import 'dotenv/config';

getAccessTokens({
  clientId: process.env.REDDIT_CLIENT_ID!,
  clientSecret: process.env.REDDIT_CLIENT_SECRET!,
  userAgent: process.env.REDDIT_USER_AGENT!,
  redirectUri: process.env.REDDIT_REDIRECT_URI!,
});
