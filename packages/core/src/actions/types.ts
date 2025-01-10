export interface ActionContext {
  clientId: string;
  metadata: Record<string, unknown>;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: Error;
}

export abstract class ClientAction<T = any> {
  abstract execute(params: T, context: ActionContext): Promise<ActionResult>;
}
