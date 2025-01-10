import { RedditClient } from '../client';

export async function getAccessTokens(config: {
  clientId: string;
  clientSecret: string;
  userAgent: string;
  redirectUri: string;
}) {
  const client = new RedditClient({
    ...config,
    subreddits: [],
    getTokensOnly: true,
    id: 'reddit-auth',
    name: 'reddit',
  });

  try {
    await client.initialize();
    console.log('Check your browser to complete authentication!');
  } catch (error) {
    console.error('Failed to get tokens:', error);
  }
}
