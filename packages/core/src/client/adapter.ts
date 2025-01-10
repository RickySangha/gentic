import { Observable } from 'rxjs';
import { ClientEvent, ClientConfig, ClientData } from './types';
import { ClientAction, ActionContext, ActionResult } from '../actions';

export abstract class ClientAdapter {
  readonly id: string;
  readonly name: string;
  abstract readonly events$: Observable<ClientEvent>;
  private actions = new Map<string, ClientAction>();

  constructor(config: ClientConfig) {
    this.id = config.id;
    this.name = config.name;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;

  registerAction(name: string, action: ClientAction) {
    this.actions.set(name, action);
    return this;
  }

  async executeAction<T>(name: string, params: T): Promise<ActionResult> {
    const action = this.actions.get(name);
    if (!action) {
      throw new Error(`Action ${name} not found for client ${this.name}`);
    }

    const context: ActionContext = {
      clientId: this.name,
      metadata: {},
    };

    return action.execute(params, context);
  }

  protected normalize(rawData: unknown): Promise<ClientData> | ClientData {
    throw new Error('normalize() must be implemented');
  }
}
