// scripts/create-package.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageName = process.argv[2];
if (!packageName) {
  console.error('Please provide a package name (e.g., client-twitter)');
  process.exit(1);
}

const packagesDir = path.join(process.cwd(), 'packages');
const packageDir = path.join(packagesDir, packageName);

// Create package directory
if (fs.existsSync(packageDir)) {
  console.error(`Package ${packageName} already exists`);
  process.exit(1);
}

fs.mkdirSync(packageDir);
fs.mkdirSync(path.join(packageDir, 'src'));

// Create package.json
const packageJson = {
  name: `@gentic/${packageName}`,
  version: '0.1.0',
  private: false,
  main: './dist/index.js',
  module: './dist/index.mjs',
  types: './dist/index.d.ts',
  scripts: {
    build: 'tsup src/index.ts --format cjs,esm --dts',
    clean: 'rm -rf .turbo && rm -rf node_modules && rm -rf dist',
    dev: 'tsup src/index.ts --format cjs,esm --watch --dts',
    lint: 'eslint "src/**/*.ts*"',
    test: 'jest',
  },
  dependencies: {
    '@gentic/core': 'workspace:*',
  },
  devDependencies: {
    '@gentic/typescript-config': 'workspace:*',
    '@gentic/eslint-config': 'workspace:*',
    tsup: '^8.0.0',
    typescript: '^5.0.0',
  },
  publishConfig: {
    access: 'public',
  },
};

fs.writeFileSync(
  path.join(packageDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Create tsconfig.json
const tsConfig = {
  extends: '@gentic/typescript-config/base.json',
  include: ['src'],
  exclude: ['node_modules', 'dist'],
};

fs.writeFileSync(
  path.join(packageDir, 'tsconfig.json'),
  JSON.stringify(tsConfig, null, 2)
);

// Create initial TypeScript files
const indexContent = `// Export your package components here\n`;
fs.writeFileSync(path.join(packageDir, 'src', 'index.ts'), indexContent);

// If it's a client package, create additional structure
if (packageName.startsWith('client-')) {
  fs.mkdirSync(path.join(packageDir, 'src', 'triggers'));

  // Create client.ts
  const clientContent = `import { BaseClient, BaseClientConfig } from '@gentic/core';

export interface ${toPascalCase(packageName)}Config extends BaseClientConfig {
  // Add your client-specific config here
}

export class ${toPascalCase(packageName)} extends BaseClient {
  private config: ${toPascalCase(packageName)}Config;

  constructor(config: ${toPascalCase(packageName)}Config) {
    super(config);
    this.config = config;
  }

  async connect(): Promise<void> {
    // Implement connection logic
  }

  async disconnect(): Promise<void> {
    // Implement disconnection logic
  }
}
`;
  fs.writeFileSync(path.join(packageDir, 'src', 'client.ts'), clientContent);
}

// Helper function to convert kebab-case to PascalCase
function toPascalCase(str) {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

console.log(`Package ${packageName} created successfully!`);
console.log('Installing dependencies...');

// Install dependencies
try {
  execSync('pnpm install', { stdio: 'inherit' });
  console.log('\nDone! You can now start developing your package.');
} catch (error) {
  console.error('Error installing dependencies:', error);
}
