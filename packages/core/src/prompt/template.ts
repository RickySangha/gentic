import { readFile } from 'fs/promises';
import { join } from 'path';
import { Personality, SectionCounts, Prompt } from './types';

export class PromptTemplate {
  private static personality: Personality | null = null;
  private static REQUIRED_SECTIONS = ['SYSTEM', 'BIO', 'KNOWLEDGE'];
  private static DEFAULT_RANDOM_COUNT = 5;

  private templateString: string;
  private requiredSections: Set<string> = new Set();
  private sectionCounts: SectionCounts;
  private personalityFile: string;

  constructor(
    template: string,
    personalityFile: string,
    sectionCounts: SectionCounts = {}
  ) {
    this.templateString = template;
    this.sectionCounts = sectionCounts;
    this.personalityFile = personalityFile;
    this.extractRequiredSections();
    this.ensurePersonalityLoaded();
  }

  private async ensurePersonalityLoaded() {
    if (!PromptTemplate.personality) {
      try {
        const filePath = join(
          process.cwd(),
          `/agent/src/personalities/${this.personalityFile}.json`
        );
        const fileContent = await readFile(filePath, 'utf8');
        PromptTemplate.personality = JSON.parse(fileContent);
        this.validatePersonality();
      } catch (error) {
        console.error('Error loading personality:', error);
        throw new Error('Failed to load personality configuration');
      }
    }
  }

  private validatePersonality() {
    if (!PromptTemplate.personality) return;

    // Check required sections exist
    for (const section of PromptTemplate.REQUIRED_SECTIONS) {
      if (!PromptTemplate.personality[section]) {
        throw new Error(`Required personality section "${section}" not found`);
      }
    }
  }

  private extractRequiredSections(): void {
    const sectionPattern = /\{\{([A-Z_]+)\}\}/g;
    let match;

    while ((match = sectionPattern.exec(this.templateString)) !== null) {
      this.requiredSections.add(match[1]);
    }
  }

  private getRandomItems(
    items: any[],
    count: number
  ): { text: string; items: any[] } {
    const shuffled = [...items];

    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selectedItems = shuffled.slice(0, Math.min(count, shuffled.length));

    // Format items based on type
    const formattedText = selectedItems
      .map((item) => {
        if (typeof item === 'object') {
          return `• ${Object.entries(item)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n  ')}`;
        }
        return `• ${item}`;
      })
      .join('\n');

    return { text: formattedText, items: selectedItems };
  }

  private replacePersonalitySections(prompt: string): {
    text: string;
    replacements: Record<string, any>;
  } {
    if (!PromptTemplate.personality) return { text: prompt, replacements: {} };

    const replacements: Record<string, any> = {};

    const text = prompt.replace(/\{\{([A-Z_]+)\}\}/g, (match, section) => {
      const content = PromptTemplate.personality![section];

      if (content === undefined) {
        console.warn(`Personality section "${section}" not found`);
        return match;
      }

      if (Array.isArray(content)) {
        const count =
          this.sectionCounts[section] || PromptTemplate.DEFAULT_RANDOM_COUNT;
        const result = this.getRandomItems(content, count);
        replacements[section] = result.items;
        return result.text;
      }

      replacements[section] = content;
      return content;
    });

    return { text, replacements };
  }

  private replaceContextVariables(
    prompt: string,
    context: any,
    replacements: Record<string, any>
  ): string {
    return prompt.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      // Skip if it's a personality section (all caps)
      if (/^[A-Z_]+$/.test(path)) {
        return match;
      }

      const parts = path.split('.');
      let value = context;

      for (const part of parts) {
        if (value === undefined || value === null) {
          console.warn(`Context variable "${path}" not found`);
          return match;
        }
        value = value[part];
      }

      if (value !== undefined) {
        replacements[path] = value;
      }
      return value?.toString() || match;
    });
  }

  async generate(context: any): Promise<Prompt> {
    await this.ensurePersonalityLoaded();

    // Replace personality sections
    const personalityResult = this.replacePersonalitySections(
      this.templateString
    );

    // Replace context variables
    const contextReplacements: Record<string, any> = {};
    const finalText = this.replaceContextVariables(
      personalityResult.text,
      context,
      contextReplacements
    );

    const prompt: Prompt = {
      text: finalText,
      components: {
        personality: personalityResult.replacements,
        context: contextReplacements,
      },
    };

    return prompt;
  }
}
