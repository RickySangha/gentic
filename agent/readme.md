Run: `pnpm dev --filter agent` in the root directory to run the agent.

pnpm tsx agent/src/get-tokens.ts

TODO:

- Add auto build command to start and dev scripts
- Add rate limterd
- Add logging
- Fix reddit auth. It should auto refresh tokens
- Add routing pipeline?
- client should be able to handle image and videos as well
- need a RAG system that builds world knowledge of users and other facts. We can call this memories.
- is there a way to make workflows memories? Eg use RAG to retrieve relevant work flows. We can have a shared db of these workflows any agent in the network can use.
- implement self improving framework. See claude and chatgpt chats.
- add a way to run workflows and workkflow steps in parallel.
- build the client action interface.
- build evaluation step using action. Eg runs every day and evaluates engagement of agent posts.
- add a way to route back to a previous workflow step.
- build provider system for workflow step. These providers will provide additional info to build prompts. Eg. memories, world knowledge, agent state (goals, emotionalstate, etc)
- Add refection option to agent. Maybe we need two types. One reflects on steps, one on entire workflows.
- Add modifiers to agent. These can dynamically change certain elemts of an agen or its workflows. Eg. change prompts in a workflow step. Add or remove steps and workflows. Certain items it cannot do on its own. The agent should create a request for improvement, that can be handled by a human.
- Teh evaluators and modifiers should be extensible. So people can create their own for specific use cases.
