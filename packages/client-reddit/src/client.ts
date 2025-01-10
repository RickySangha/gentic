import axios, { AxiosInstance } from 'axios';
import * as http from 'http';
import { URL } from 'url';

import {
  RedditConfig,
  RedditCredentials,
  RedditPost,
  RedditComment,
} from './types';

export class RedditClient {
  private axiosInstance: AxiosInstance;
  private credentials?: RedditCredentials;

  constructor(private config: RedditConfig) {
    this.axiosInstance = axios.create({
      baseURL: 'https://oauth.reddit.com',
      headers: {
        'User-Agent': config.userAgent,
      },
    });
  }

  async initialize(): Promise<RedditCredentials | void> {
    // If we're just getting tokens, run auth and return them
    if (this.config.getTokensOnly) {
      return this.authenticate();
    }

    // Normal initialization with existing or new tokens
    if (this.config.accessToken && this.config.refreshToken) {
      this.credentials = {
        accessToken: this.config.accessToken,
        refreshToken: this.config.refreshToken,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };
      this.updateAuthHeader();
    } else {
      this.credentials = await this.authenticate();
      this.updateAuthHeader();
    }
  }

  private async authenticate(): Promise<RedditCredentials> {
    return new Promise((resolve, reject) => {
      const server = http.createServer(async (req, res) => {
        try {
          const url = new URL(req.url!, `http://${req.headers.host}`);

          if (url.pathname === '/callback') {
            const code = url.searchParams.get('code');
            if (!code) {
              throw new Error('No code provided');
            }

            const tokenResponse = await axios.post(
              'https://www.reddit.com/api/v1/access_token',
              new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: this.config.redirectUri,
              }),
              {
                auth: {
                  username: this.config.clientId,
                  password: this.config.clientSecret,
                },
                headers: {
                  'User-Agent': this.config.userAgent,
                },
              }
            );

            const credentials: RedditCredentials = {
              accessToken: tokenResponse.data.access_token,
              refreshToken: tokenResponse.data.refresh_token,
              expiresAt: new Date(
                Date.now() + tokenResponse.data.expires_in * 1000
              ),
            };

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <h1>Authentication successful!</h1>
              <p>Add these tokens to your .env file:</p>
              <pre>
              REDDIT_ACCESS_TOKEN=${credentials.accessToken}
              REDDIT_REFRESH_TOKEN=${credentials.refreshToken}
              </pre>
              <p>You can close this window now.</p>
            `);

            server.close();
            resolve(credentials);
          }
        } catch (error) {
          reject(error);
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication failed!</h1>');
          server.close();
        }
      });

      const authUrl = new URL('https://www.reddit.com/api/v1/authorize');
      authUrl.searchParams.append('client_id', this.config.clientId);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('state', 'random_string');
      authUrl.searchParams.append('redirect_uri', this.config.redirectUri);
      authUrl.searchParams.append('duration', 'permanent');
      authUrl.searchParams.append('scope', 'read submit identity');

      server.listen(new URL(this.config.redirectUri).port, async () => {
        const open = (await import('open')).default;
        open(authUrl.toString());
      });
    });
  }

  private updateAuthHeader(): void {
    if (this.credentials?.accessToken) {
      this.axiosInstance.defaults.headers.common.Authorization = `Bearer ${this.credentials.accessToken}`;
    }
  }

  async getNewPosts(
    subreddit: string,
    limit: number = 25
  ): Promise<RedditPost[]> {
    const response = await this.axiosInstance.get(`/r/${subreddit}/new.json`, {
      params: { limit },
    });
    return response.data.data.children.map((child: any) => child.data);
  }

  async getNewComments(
    subreddit: string,
    limit: number = 25
  ): Promise<RedditComment[]> {
    const response = await this.axiosInstance.get(
      `/r/${subreddit}/comments.json`,
      {
        params: { limit },
      }
    );
    return response.data.data.children.map((child: any) => child.data);
  }

  async createComment(parentId: string, text: string): Promise<string> {
    const response = await this.axiosInstance.post(
      '/api/comment',
      new URLSearchParams({
        api_type: 'json',
        thing_id: parentId,
        text: text,
      })
    );

    if (response.data.json.errors?.length > 0) {
      throw new Error(
        `Reddit API Error: ${JSON.stringify(response.data.json.errors)}`
      );
    }

    return response.data.json.data.things[0].data.id;
  }

  async createPost(
    subreddit: string,
    title: string,
    text: string
  ): Promise<string> {
    const response = await this.axiosInstance.post(
      '/api/submit',
      new URLSearchParams({
        api_type: 'json',
        kind: 'self',
        sr: subreddit,
        title: title,
        text: text,
      })
    );

    if (response.data.json.errors?.length > 0) {
      throw new Error(
        `Reddit API Error: ${JSON.stringify(response.data.json.errors)}`
      );
    }

    return response.data.json.data.id;
  }

  async getPost(postId: string): Promise<RedditPost> {
    const response = await this.axiosInstance.get(`/by_id/t3_${postId}.json`);
    return response.data.data.children[0].data;
  }
}
