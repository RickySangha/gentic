import { ClientEvent } from '../client';
import { PromptTemplate } from '../prompt';

export interface WorkflowContext {
  event: ClientEvent;
  state: Map<string, unknown>;
}

export abstract class WorkflowStep {
  public readonly id: string;
  public readonly name: string;

  constructor() {
    this.name = this.constructor.name;
    this.id = crypto.randomUUID();
  }

  abstract execute(context: WorkflowContext): Promise<void>;
}
