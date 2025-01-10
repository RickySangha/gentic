import { ClientConfig } from '@gentic/core';

export interface RedditConfig extends ClientConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  subreddits: string[];
  userAgent: string;
  pollingInterval?: number;
  getTokensOnly?: boolean;
  // Optional: provide these if you have them stored
  accessToken?: string;
  refreshToken?: string;
}

export interface RedditCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface RedditPost {
  id: string;
  name: string; // fullname (t3_id)
  subreddit: string;
  title: string;
  selftext: string;
  author: string;
  created_utc: number;
  score: number;
  permalink: string;
}

export interface RedditComment {
  id: string;
  name: string; // fullname (t1_id)
  subreddit: string;
  body: string;
  author: string;
  created_utc: number;
  score: number;
  permalink: string;
  parent_id: string;
  link_id: string;
}
