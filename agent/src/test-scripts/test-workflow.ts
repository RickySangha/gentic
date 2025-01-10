import {
  Agent,
  Workflow,
  WorkflowStep,
  WorkflowContext,
  PromptTemplate,
  LLMProvider,
  ClientEvent,
} from '@gentic/core';

class AnalyzePost extends WorkflowStep {
  promptTemplate = new PromptTemplate(
    `{{SYSTEM}}
    
    Analyze the following text and determine if it contains questions or requests for help:
    {{event.data.content}}
    
    Respond in the following format:
    CONTAINS_HELP_REQUEST: yes/no
    CONFIDENCE: 0.0-1.0
    REASONING: brief explanation`,
    'personality'
  );

  private llmProvider = new LLMProvider({
    modelProvider: { provider: 'openai' },
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 150,
  });

  async execute(context: WorkflowContext): Promise<void> {
    try {
      const prompt = await this.promptTemplate.generate(context);
      const response = await this.llmProvider.generateTextResponse(prompt);

      // Parse response
      const lines = response.text.split('\n');
      const containsHelp = lines[0].toLowerCase().includes('yes');
      const confidence = parseFloat(lines[1].split(':')[1].trim());
      const reasoning = lines[2].split(':')[1].trim();

      // Store results in context state
      context.state.set(this.name, {
        id: this.id,
        input: prompt,
        output: {
          containsHelp,
          confidence,
          reasoning,
        },
      });
    } catch (error) {
      console.error('Error in AnalyzePost:', error);
      throw error;
    }
  }
}

// Create a simple logging step
class LogResultStep extends WorkflowStep {
  async execute(context: WorkflowContext): Promise<void> {
    const result = context.state.get('helpRequest');
    console.log('\nWorkflow Results:', result);
  }
}

async function main() {
  // Create workflow
  const helpWorkflow = new Workflow('help-workflow', [
    new AnalyzePost(),
    new LogResultStep(),
  ]);

  // Create mock event
  const mockEvent: ClientEvent = {
    type: 'reddit-post',
    data: {
      id: '123',
      type: 'post',
      content:
        'Can someone help me understand how promises work in JavaScript?',
      client: 'test',
      raw: {},
      metadata: {},
    },
    timestamp: new Date(),
  };

  // Create context
  const context: WorkflowContext = {
    event: mockEvent,
    state: new Map(),
  };

  // Execute workflow
  console.log('Starting workflow test...\n');
  await helpWorkflow.execute(context);
}

main().catch(console.error);
