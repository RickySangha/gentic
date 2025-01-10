import { Subject, merge, Observable, EMPTY } from 'rxjs';
import { share, mergeMap, catchError } from 'rxjs/operators';
import { ClientAdapter } from '../client';
import { Pipeline } from '../pipeline';
import { Workflow } from '../workflow';
import { ClientEvent } from '../client';

export class Agent {
  private clients = new Map<string, ClientAdapter>();
  private pipelines = new Map<string, Pipeline>();
  private workflows = new Map<string, Workflow>();
  private isRunning = false;

  private eventSubject = new Subject<ClientEvent>();
  readonly events$ = this.eventSubject.pipe(share());

  addClient(client: ClientAdapter) {
    if (this.isRunning) {
      throw new Error('Cannot add client while agent is running');
    }

    if (this.clients.has(client.name)) {
      throw new Error(`client ${client.name} already exists`);
    }

    this.clients.set(client.name, client);
    return this;
  }

  addPipeline(pipeline: Pipeline) {
    if (this.pipelines.has(pipeline.id)) {
      throw new Error(`Pipeline ${pipeline.id} already exists`);
    }

    this.pipelines.set(pipeline.id, pipeline);
    return this;
  }

  addWorkflow(workflow: Workflow) {
    if (this.workflows.has(workflow.id)) {
      throw new Error(`Workflow ${workflow.id} already exists`);
    }

    this.workflows.set(workflow.id, workflow);
    return this;
  }

  async start() {
    if (this.isRunning) {
      throw new Error('Agent is already running');
    }

    this.isRunning = true;

    try {
      await Promise.all(
        Array.from(this.clients.values()).map((client) => client.connect())
      );

      const pipelineStreams = Array.from(this.pipelines.values()).map(
        (pipeline) => this.createPipelineStream(pipeline)
      );

      merge(...pipelineStreams)
        .pipe(
          catchError((error, caught) => {
            console.error('Error in pipeline stream:', error);
            return caught;
          })
        )
        .subscribe(this.eventSubject);
    } catch (error) {
      this.isRunning = false;
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    await Promise.all(
      Array.from(this.clients.values()).map((client) => client.disconnect())
    );

    this.eventSubject.complete();
  }

  private createPipelineStream(pipeline: Pipeline): Observable<ClientEvent> {
    const clientstreams = Array.from(this.clients.values())
      .filter((client) => pipeline.clients.includes(client.name))
      .map((client) => client.events$);

    if (clientstreams.length === 0) {
      console.warn(`Pipeline ${pipeline.id} has no matching clients`);
      return EMPTY;
    }

    return merge(...clientstreams).pipe(
      ...(pipeline.operators as []),
      mergeMap(async (event) => {
        try {
          await this.executeWorkflows(pipeline.workflowIds, event);
          return event;
        } catch (error) {
          console.error(
            `Error executing workflows for pipeline ${pipeline.id}:`,
            error
          );
          throw error;
        }
      }),
      catchError((error, caught) => {
        console.error(`Error in pipeline ${pipeline.id}:`, error);
        return caught;
      })
    );
  }

  private async executeWorkflows(workflowIds: string[], event: ClientEvent) {
    const context = { event, state: new Map() };

    for (const workflowId of workflowIds) {
      const workflow = this.workflows.get(workflowId);
      if (workflow) {
        try {
          await workflow.execute(context);
        } catch (error) {
          console.error(`Error executing workflow ${workflowId}:`, error);
          throw error;
        }
      }
    }
  }
}
