import { Agent, Workflow } from '@gentic/core';
import { RedditAdapter } from '@gentic/client-reddit';
import { filter } from 'rxjs/operators';
import { ConsoleLogStep } from './workflows/consolelog';
import 'dotenv/config';

async function main() {
  const redditClient = new RedditAdapter({
    id: 'reddit-1',
    name: 'reddit',
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    redirectUri: process.env.REDDIT_REDIRECT_URI!,
    userAgent: process.env.REDDIT_USER_AGENT!,
    accessToken: process.env.REDDIT_ACCESS_TOKEN,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN,
    subreddits: ['testcommunitycrypto'],
    pollingInterval: 30000,
  });

  // Create workflow
  const helpWorkflow = new Workflow('help-workflow', [new ConsoleLogStep()]);

  const agent = new Agent().addClient(redditClient).addWorkflow(helpWorkflow);

  // Add help request pipeline
  agent.addPipeline({
    id: 'help-pipeline',
    name: 'Help Detection',
    clients: ['reddit'],
    workflowIds: ['help-workflow'],
    operators: [
      filter((event: any) => event.data.content.toLowerCase().includes('sdr')),
    ],
  });

  console.log('Starting agent with Reddit configuration:', {
    clientId: process.env.REDDIT_CLIENT_ID,
    userAgent: process.env.REDDIT_USER_AGENT,
    redirectUri: process.env.REDDIT_REDIRECT_URI,
  });

  await agent.start();
}

main().catch(console.error);
