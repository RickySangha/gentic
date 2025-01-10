import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { xai } from '@ai-sdk/xai';
import { groq } from '@ai-sdk/groq';
import { LLMMessage, LLMConfig } from './types';
import { Prompt } from '../prompt/types';
import 'dotenv/config';

export class LLMProvider {
  private config: LLMConfig;
  private vercelProvider: any;

  constructor(config: LLMConfig) {
    this.config = config;
    switch (config.modelProvider.provider) {
      case 'openai':
        this.vercelProvider = openai(this.config.model, {
          // additional settings
        });
        break;
      case 'anthropic':
        this.vercelProvider = anthropic(this.config.model, {
          // additional settings
        });
        break;
      case 'openrouter':
        this.vercelProvider = createOpenRouter({
          apiKey: process.env.OPENROUTER_API_KEY!,
        });
        break;
      case 'xai':
        this.vercelProvider = xai(this.config.model, {
          // additional settings
        });
        break;
      case 'groq':
        this.vercelProvider = groq(this.config.model, {
          // additional settings
        });
        break;
      default:
        this.vercelProvider = openai(this.config.model, {
          // additional settings
        });
    }
  }

  async generateTextResponse(prompt: Prompt, messages?: LLMMessage[]) {
    try {
      if (messages) {
        const result = await generateText({
          model: this.vercelProvider,
          system: prompt.text,
          messages: messages,
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
        });
        return result;
      } else {
        const result = await generateText({
          model: this.vercelProvider,
          prompt: prompt.text,
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
        });
        return result;
      }
    } catch (error) {
      console.error('Error occured with LLM API call:', error);
      throw error;
    }
  }
}
