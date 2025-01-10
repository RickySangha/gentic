import {
  WorkflowStep,
  WorkflowContext,
  PromptTemplate,
  LLMProvider,
} from '@gentic/core';

export class ShouldRespondStep extends WorkflowStep {
  readonly promptTemplate: PromptTemplate;
  private readonly llmProvider: LLMProvider;
  private readonly threshold: number;
  private readonly continueOnLowConfidence: boolean;

  constructor({
    promptTemplate,
    llmProvider,
    threshold = 0.7,
    continueOnLowConfidence = false,
  }: {
    promptTemplate: PromptTemplate;
    llmProvider: LLMProvider;
    threshold?: number;
    continueOnLowConfidence?: boolean;
  }) {
    super();
    this.promptTemplate = promptTemplate;
    this.llmProvider = llmProvider;
    this.threshold = threshold;
    this.continueOnLowConfidence = continueOnLowConfidence;
  }

  async execute(context: WorkflowContext): Promise<void> {
    try {
      const prompt = await this.promptTemplate.generate(context);
      const response = await this.llmProvider.generateTextResponse(prompt);

      // Parse response
      const lines = response.text.split('\n');
      const shouldRespond = lines[0].includes('yes');
      const confidence = parseFloat(lines[1].split(':')[1].trim());
      const reasoning = lines[2].split(':')[1].trim();

      // Store results in context state
      const decision = {
        shouldRespond,
        confidence,
        reasoning,
        threshold: this.threshold,
        passedThreshold: confidence >= this.threshold,
      };

      context.state.set('shouldRespond', decision);
      console.log('Response Decision:', decision);

      if (!decision.passedThreshold && !this.continueOnLowConfidence) {
        console.log('Stopping workflow due to low confidence');
        throw new Error('confidence_too_low');
      }
    } catch (error) {
      if (
        error.message !== 'confidence_too_low' ||
        !this.continueOnLowConfidence
      ) {
        throw error;
      }
    }
  }
}

// 1. Create context for LLM.
// 2. implement openrouter and openai llm calling
// 3. Need to figure out how prompts will be handled. Does each workflow step have its own prompt?
// 4. Figure out how the state will flow between steps. Do we need to save state to database so bot can continue from where it left off?
// 5. Can certain workflow steps be run in parallel?
// 6. change pipeline to router
