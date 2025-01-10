export interface ClientData {
  id: string;
  type: 'post' | 'comment' | 'message';
  content: string;
  client: string;
  raw: unknown;
  metadata: Record<string, unknown>;
}

export interface ClientEvent {
  type: string;
  data: ClientData;
  timestamp: Date;
  pipelineId?: string;
}

export interface ClientConfig {
  id: string;
  name: string;
}
