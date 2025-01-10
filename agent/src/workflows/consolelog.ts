import { WorkflowStep, WorkflowContext } from '@gentic/core';

export class ConsoleLogStep extends WorkflowStep {
  async execute(context: WorkflowContext): Promise<void> {
    if (context.event.data.type === 'post') {
      console.log(context.event.data.content);
    }
    if (context.event.data.type === 'comment') {
      console.log(context.event.data.metadata.commentChain);
    }
  }
}
