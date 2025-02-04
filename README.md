# Running an Agent on Reddit

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

## Set your LLM provider

Curerently only OpenAI and OpenRouter are supported. Set the API key in the .env file.

## Create your agent in the agent/src/index.ts file

An agent requires a client, workflow, and pipeline. How the agent works:

1. The client connects to the data source (e.g. Reddit)
2. The client sends events to the agent
3. The agent filters and transforms the events using the pipeline
4. The agent passes the transformed/filtered events to the workflow
5. The workflow executes the steps and stores the results in the context for each step

## Install dependencies

```sh
pnpm install
```

## Build the code

```sh
pnpm build
```

## Run the agent

```sh
pnpm run dev
```
