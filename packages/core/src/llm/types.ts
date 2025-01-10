export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelProvider {
  provider: 'openai' | 'anthropic' | 'openrouter' | 'xai' | 'groq';
}

export interface LLMConfig {
  modelProvider: ModelProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
}
