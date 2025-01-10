import { OperatorFunction, Observable } from 'rxjs';
import { filter, mergeMap } from 'rxjs/operators';
import { ClientEvent } from '../client/types';

export interface ContentFilter {
  keywords?: string[];
  regex?: RegExp;
  minLength?: number;
  maxLength?: number;
  mustIncludeAll?: string[];
  mustIncludeAny?: string[];
  mustNotInclude?: string[];
  custom?: (content: string) => boolean;
}

export interface AsyncContentFilter extends ContentFilter {
  asyncMatchers?: Array<{
    name: string;
    matcher: (content: string) => Promise<boolean>;
  }>;
}

export function createContentFilter(
  config: ContentFilter
): OperatorFunction<ClientEvent, ClientEvent> {
  return filter((event: ClientEvent) => {
    const content = event.data.content.toLowerCase();

    if (
      config.keywords &&
      !config.keywords.some((k) => content.includes(k.toLowerCase()))
    ) {
      return false;
    }

    if (config.regex && !config.regex.test(content)) {
      return false;
    }

    if (config.minLength && content.length < config.minLength) {
      return false;
    }

    if (config.maxLength && content.length > config.maxLength) {
      return false;
    }

    if (
      config.mustIncludeAll &&
      !config.mustIncludeAll.every((k) => content.includes(k.toLowerCase()))
    ) {
      return false;
    }

    if (
      config.mustIncludeAny &&
      !config.mustIncludeAny.some((k) => content.includes(k.toLowerCase()))
    ) {
      return false;
    }

    if (
      config.mustNotInclude &&
      config.mustNotInclude.some((k) => content.includes(k.toLowerCase()))
    ) {
      return false;
    }

    if (config.custom && !config.custom(content)) {
      return false;
    }

    return true;
  });
}

export function createAsyncContentFilter(
  config: AsyncContentFilter
): OperatorFunction<ClientEvent, ClientEvent> {
  return (source: Observable<ClientEvent>) =>
    source.pipe(
      mergeMap(async (event) => {
        try {
          if (config.asyncMatchers) {
            for (const { matcher } of config.asyncMatchers) {
              if (!(await matcher(event.data.content))) {
                return null;
              }
            }
          }
          return event;
        } catch (error) {
          console.error('Async filter error:', error);
          return null;
        }
      }),
      filter((event): event is ClientEvent => event !== null)
    );
}
