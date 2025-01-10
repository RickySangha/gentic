import { ClientAction, ActionContext, ActionResult } from '@gentic/core';
import { RedditClient } from '../client';

interface CreateCommentParams {
  postId: string;
  content: string;
}

export class CreateCommentAction extends ClientAction<CreateCommentParams> {
  constructor(private client: RedditClient) {
    super();
  }

  async execute(
    params: CreateCommentParams,
    context: ActionContext
  ): Promise<ActionResult> {
    try {
      const commentId = await this.client.createComment(
        params.postId,
        params.content
      );

      return {
        success: true,
        data: { commentId },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
      };
    }
  }
}
