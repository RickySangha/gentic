import { ClientAdapter, ClientData, ClientEvent } from '@gentic/core';
import { Subject, interval, from } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';
import { RedditConfig, RedditPost, RedditComment } from './types';
import { RedditClient } from './client';

export class RedditAdapter extends ClientAdapter {
  private client: RedditClient;
  private eventSubject = new Subject<ClientEvent>();
  private lastChecked: Map<string, number> = new Map();
  private pollingInterval: number;
  private config: RedditConfig;
  private recentPosts: Map<string, RedditPost> = new Map();

  readonly events$ = this.eventSubject.asObservable();

  constructor(config: RedditConfig) {
    super(config);
    this.client = new RedditClient(config);
    this.pollingInterval = config.pollingInterval || 300000; // Default 5 minutes
    this.config = config;
  }

  async connect(): Promise<void> {
    await this.client.initialize();

    // Start polling for new content
    interval(this.pollingInterval)
      .pipe(
        mergeMap(() => this.pollContent()),
        catchError((error: any, caught: any) => {
          console.error('Error polling Reddit:', error);
          return caught;
        })
      )
      .subscribe();
  }

  async disconnect(): Promise<void> {
    this.eventSubject.complete();
  }

  protected async normalize(
    data: RedditPost | RedditComment
  ): Promise<ClientData> {
    const isPost = 'title' in data;

    if (!isPost) {
      const commentChain = await this.buildCommentChain(data as RedditComment);
      const postId = (data as RedditComment).link_id.replace('t3_', '');
      const fullPost =
        this.recentPosts.get(postId) || (await this.client.getPost(postId));

      // Create simplified post object
      const post = fullPost
        ? {
            id: fullPost.id,
            title: fullPost.title,
            content: fullPost.selftext,
            author: fullPost.author,
            created: new Date(fullPost.created_utc * 1000),
            permalink: fullPost.permalink,
            subreddit: fullPost.subreddit,
          }
        : null;

      return {
        id: data.id,
        type: 'comment',
        content: (data as RedditComment).body,
        client: this.config.name,
        raw: data,
        metadata: {
          subreddit: data.subreddit,
          author: data.author,
          created: new Date(data.created_utc * 1000),
          score: data.score,
          permalink: data.permalink,
          postId,
          post,
          commentChain: commentChain.map((comment) => ({
            id: comment.id,
            author: comment.author,
            body: comment.body,
            created: new Date(comment.created_utc * 1000),
          })),
        },
      };
    }

    return {
      id: data.id,
      type: 'post',
      content: `${(data as RedditPost).title}\n${(data as RedditPost).selftext}`,
      client: this.config.name,
      raw: data,
      metadata: {
        subreddit: data.subreddit,
        author: data.author,
        created: new Date(data.created_utc * 1000),
        score: data.score,
        permalink: data.permalink,
      },
    };
  }

  private async pollContent() {
    const tasks = this.config.subreddits.map(async (subreddit) => {
      const lastChecked = this.lastChecked.get(subreddit) || 0;

      try {
        // Fetch new posts
        const posts = await this.client.getNewPosts(subreddit);
        posts.forEach((post) => this.recentPosts.set(post.id, post));
        const newPosts = posts.filter((post) => post.created_utc > lastChecked);

        // Fetch new comments
        const comments = await this.client.getNewComments(subreddit);
        const newComments = comments.filter(
          (comment) => comment.created_utc > lastChecked
        );

        // Update last checked timestamp
        this.lastChecked.set(
          subreddit,
          Math.max(Date.now() / 1000, lastChecked)
        );

        // Emit events for new content
        for (const content of [...newPosts, ...newComments]) {
          const normalizedData = await this.normalize(content);
          this.eventSubject.next({
            type: normalizedData.type === 'post' ? 'NEW_POST' : 'NEW_COMMENT',
            data: normalizedData,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error(`Error polling subreddit ${subreddit}:`, error);
      }
    });

    await Promise.all(tasks);
  }

  private async buildCommentChain(
    comment: RedditComment
  ): Promise<RedditComment[]> {
    try {
      // Get all comments from the subreddit
      const allComments = await this.client.getNewComments(
        comment.subreddit,
        1000
      );

      const commentChain: RedditComment[] = [];
      let currentComment: RedditComment | undefined = comment;

      // Build chain from child to parent
      while (currentComment) {
        commentChain.unshift(currentComment); // Add to beginning of array
        currentComment = allComments.find(
          (c) => c.name === currentComment?.parent_id
        );
      }

      return commentChain;
    } catch (error) {
      console.error('Error building comment chain:', error);
      return [comment]; // Return just the original comment if chain building fails
    }
  }
}
