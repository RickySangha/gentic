import { Observable, OperatorFunction } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { ClientEvent } from '../client';

export interface Pipeline {
  id: string;
  name: string;
  clients: string[]; // Specify which clients this pipeline handles
  workflowIds: string[];
  operators: OperatorFunction<ClientEvent, ClientEvent>[];
}

export function createPipeline(config: {
  id: string;
  name: string;
  clients: string[]; // Required clients list
  workflowIds: string[];
  operators: OperatorFunction<ClientEvent, ClientEvent>[];
}): Pipeline {
  return {
    ...config,
    operators: [
      filter((event: ClientEvent) =>
        config.clients.includes(event.data.client)
      ),
      ...config.operators,
      tap((event) => {
        event.pipelineId = config.id;
      }),
    ],
  };
}
