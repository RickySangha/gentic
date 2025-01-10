import { WorkflowStep, WorkflowContext } from './types';

const usedWorkflowIds = new Set<string>();

export class Workflow {
  public readonly name: string;

  constructor(
    public readonly id: string,
    private steps: WorkflowStep[]
  ) {
    if (!id) {
      throw new Error('Workflow ID is required');
    }

    if (usedWorkflowIds.has(id)) {
      throw new Error(`Workflow ID "${id}" is already in use`);
    }

    this.name = this.constructor.name;
    usedWorkflowIds.add(id);
  }

  // Optional: Clean up when workflow is disposed
  dispose() {
    usedWorkflowIds.delete(this.id);
  }

  async execute(context: WorkflowContext) {
    for (const step of this.steps) {
      try {
        await step.execute(context);
      } catch (error) {
        console.error(`Error executing step ${step.constructor.name}:`, error);
        throw error;
      }
    }
  }
}
