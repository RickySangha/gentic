export interface Personality {
  [key: string]: string | string[];
}

export interface SectionCounts {
  [key: string]: number;
}

export interface Prompt {
  text: string;
  components: {
    personality: Record<string, any>;
    context: Record<string, any>;
  };
}
