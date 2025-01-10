import { PromptTemplate } from '@gentic/core';

async function example() {
  // Create template with custom section counts
  const template = new PromptTemplate(
    `{{SYSTEM}}
Here's a bit about me:
{{BIO}}

My core principles:
{{PRINCIPLES}}

Core knowledge:
{{KNOWLEDGE}}

When writing code, I follow these practices:
{{CODING_PRACTICES}}

Current Request: {{event.data.content}}

{{MESSAGES_EXAMPLES}}
`,
    'personality',
    {
      BIO: 3, // Override default: get 3 random BIO items
      PRINCIPLES: 4, // Override default: get 4 random PRINCIPLES
      CODING_PRACTICES: 6, // Override default: get 6 random coding practices
    }
  );

  const context = {
    event: {
      data: {
        content: 'Can you help me improve my code quality?',
      },
    },
  };

  const finalPrompt = await template.generate(context);
  console.log(finalPrompt);
}

example();
