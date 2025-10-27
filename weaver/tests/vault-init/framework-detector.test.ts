import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import {
  detectFramework,
  detectFrameworkDetailed,
  readTsConfig,
} from '../../src/vault-init/scanner/framework-detector';
import {
  PackageJsonError,
  FileSystemError,
  type PackageJson,
} from '../../src/vault-init/scanner/types';

describe('Framework Detector', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a unique temporary directory for each test
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'framework-test-'));
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('detectFramework', () => {
    it('should detect Next.js project with App Router', async () => {
      // Setup
      const packageJson: PackageJson = {
        name: 'test-nextjs',
        version: '1.0.0',
        dependencies: {
          next: '14.0.0',
          react: '18.2.0',
          'react-dom': '18.2.0',
        },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      await fs.mkdir(path.join(testDir, 'app'));

      // Execute
      const result = await detectFramework(testDir);

      // Assert
      expect(result.type).toBe('nextjs');
      expect(result.version).toBe('14.0.0');
      expect(result.features).toContain('app-router');
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should detect Next.js project with Pages Router', async () => {
      // Setup
      const packageJson: PackageJson = {
        name: 'test-nextjs-pages',
        dependencies: {
          next: '^13.5.0',
          react: '^18.0.0',
        },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      await fs.mkdir(path.join(testDir, 'pages'));

      // Execute
      const result = await detectFramework(testDir);

      // Assert
      expect(result.type).toBe('nextjs');
      expect(result.version).toBe('13.5.0');
      expect(result.features).toContain('pages-router');
    });

    it('should detect Next.js with src directory structure', async () => {
      // Setup
      const packageJson: PackageJson = {
        dependencies: {
          next: '14.0.0',
        },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'src', 'app'));

      // Execute
      const result = await detectFramework(testDir);

      // Assert
      expect(result.features).toContain('src-directory');
      expect(result.features).toContain('app-router');
    });

    it('should detect TypeScript configuration', async () => {
      // Setup
      const packageJson: PackageJson = {
        dependencies: { next: '14.0.0' },
        devDependencies: { typescript: '5.0.0' },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );
      await fs.writeFile(
        path.join(testDir, 'tsconfig.json'),
        JSON.stringify({ compilerOptions: {} })
      );

      // Execute
      const result = await detectFramework(testDir);

      // Assert
      expect(result.features).toContain('typescript');
    });

    it('should detect Tailwind CSS configuration', async () => {
      // Setup
      const packageJson: PackageJson = {
        dependencies: { react: '18.0.0' },
        devDependencies: { tailwindcss: '3.0.0' },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );
      await fs.writeFile(
        path.join(testDir, 'tailwind.config.js'),
        'module.exports = {}'
      );

      // Execute
      const result = await detectFramework(testDir);

      // Assert
      expect(result.features).toContain('tailwind');
    });

    it('should detect standalone React project', async () => {
      // Setup
      const packageJson: PackageJson = {
        dependencies: {
          react: '18.2.0',
          'react-dom': '18.2.0',
          'react-router-dom': '6.0.0',
        },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      // Execute
      const result = await detectFramework(testDir);

      // Assert
      expect(result.type).toBe('react');
      expect(result.version).toBe('18.2.0');
      expect(result.features).toContain('react-router');
    });

    it('should detect React with state management libraries', async () => {
      // Setup
      const packageJson: PackageJson = {
        dependencies: {
          react: '18.0.0',
          zustand: '4.0.0',
        },
        devDependencies: {
          '@testing-library/react': '13.0.0',
        },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      // Execute
      const result = await detectFramework(testDir);

      // Assert
      expect(result.features).toContain('zustand');
      expect(result.features).toContain('testing-library');
    });

    it('should detect TypeScript-only project', async () => {
      // Setup
      const packageJson: PackageJson = {
        devDependencies: {
          typescript: '5.0.0',
          '@types/node': '20.0.0',
        },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      // Execute
      const result = await detectFramework(testDir);

      // Assert
      expect(result.type).toBe('typescript');
      expect(result.version).toBe('5.0.0');
    });

    it('should detect Node.js project when no specific framework found', async () => {
      // Setup
      const packageJson: PackageJson = {
        dependencies: {
          express: '4.18.0',
        },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      // Execute
      const result = await detectFramework(testDir);

      // Assert
      expect(result.type).toBe('nodejs');
    });

    it('should return unknown for empty project', async () => {
      // Setup
      const packageJson: PackageJson = {};
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      // Execute
      const result = await detectFramework(testDir);

      // Assert
      expect(result.type).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    it('should throw PackageJsonError when package.json is missing', async () => {
      // Execute & Assert
      await expect(detectFramework(testDir)).rejects.toThrow(PackageJsonError);
      await expect(detectFramework(testDir)).rejects.toThrow(
        /package\.json not found/
      );
    });

    it('should throw PackageJsonError when package.json has invalid JSON', async () => {
      // Setup
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        '{ invalid json'
      );

      // Execute & Assert
      await expect(detectFramework(testDir)).rejects.toThrow(PackageJsonError);
      await expect(detectFramework(testDir)).rejects.toThrow(/Invalid JSON/);
    });

    it('should throw FileSystemError when directory does not exist', async () => {
      // Execute & Assert
      const nonExistentDir = path.join(testDir, 'does-not-exist');
      await expect(detectFramework(nonExistentDir)).rejects.toThrow(
        FileSystemError
      );
      await expect(detectFramework(nonExistentDir)).rejects.toThrow(
        /not found/
      );
    });

    it('should throw FileSystemError when path is a file', async () => {
      // Setup
      const filePath = path.join(testDir, 'file.txt');
      await fs.writeFile(filePath, 'content');

      // Execute & Assert
      await expect(detectFramework(filePath)).rejects.toThrow(FileSystemError);
      await expect(detectFramework(filePath)).rejects.toThrow(
        /not a directory/
      );
    });

    it('should handle multiple Tailwind config formats', async () => {
      // Setup
      const packageJson: PackageJson = {
        dependencies: { react: '18.0.0' },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );
      await fs.writeFile(
        path.join(testDir, 'tailwind.config.ts'),
        'export default {}'
      );

      // Execute
      const result = await detectFramework(testDir);

      // Assert
      expect(result.features).toContain('tailwind');
    });

    it('should detect API routes in Next.js', async () => {
      // Setup
      const packageJson: PackageJson = {
        dependencies: { next: '14.0.0' },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );
      await fs.mkdir(path.join(testDir, 'pages', 'api'), { recursive: true });

      // Execute
      const result = await detectFramework(testDir);

      // Assert
      expect(result.features).toContain('api-routes');
    });

    it('should remove duplicate features', async () => {
      // Setup
      const packageJson: PackageJson = {
        dependencies: { next: '14.0.0' },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );
      await fs.mkdir(path.join(testDir, 'app'));
      await fs.mkdir(path.join(testDir, 'src', 'app'), { recursive: true });

      // Execute
      const result = await detectFramework(testDir);

      // Assert
      const appRouterCount = result.features.filter(
        (f) => f === 'app-router'
      ).length;
      expect(appRouterCount).toBe(1);
    });
  });

  describe('detectFrameworkDetailed', () => {
    it('should return detailed detection results', async () => {
      // Setup
      const packageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          next: '14.0.0',
          react: '18.0.0',
        },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );
      await fs.writeFile(
        path.join(testDir, 'tsconfig.json'),
        JSON.stringify({ compilerOptions: {} })
      );
      await fs.writeFile(
        path.join(testDir, 'tailwind.config.js'),
        'module.exports = {}'
      );
      await fs.mkdir(path.join(testDir, 'app'));

      // Execute
      const result = await detectFrameworkDetailed(testDir);

      // Assert
      expect(result.framework.type).toBe('nextjs');
      expect(result.packageJson).toEqual(packageJson);
      expect(result.hasTypeScript).toBe(true);
      expect(result.hasTailwind).toBe(true);
      expect(result.detectedAt).toBeInstanceOf(Date);
      expect(result.projectPath).toBe(testDir);
    });

    it('should handle projects without TypeScript or Tailwind', async () => {
      // Setup
      const packageJson: PackageJson = {
        dependencies: { react: '18.0.0' },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      // Execute
      const result = await detectFrameworkDetailed(testDir);

      // Assert
      expect(result.hasTypeScript).toBe(false);
      expect(result.hasTailwind).toBe(false);
    });
  });

  describe('readTsConfig', () => {
    it('should read and parse valid tsconfig.json', async () => {
      // Setup
      const tsConfig = {
        compilerOptions: {
          target: 'es2020',
          module: 'commonjs',
          strict: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules'],
      };
      await fs.writeFile(
        path.join(testDir, 'tsconfig.json'),
        JSON.stringify(tsConfig, null, 2)
      );

      // Execute
      const result = await readTsConfig(testDir);

      // Assert
      expect(result).toBeTruthy();
      expect(result?.compilerOptions).toEqual(tsConfig.compilerOptions);
      expect(result?.exclude).toEqual(tsConfig.exclude);
      expect(result?.include).toBeDefined();
    });

    it('should handle tsconfig.json with comments', async () => {
      // Setup
      const tsConfigWithComments = `{
  // This is a comment
  "compilerOptions": {
    "target": "es2020" /* inline comment */
  },
  /*
   * Multi-line comment
   */
  "include": ["src/**/*"]
}`;
      await fs.writeFile(
        path.join(testDir, 'tsconfig.json'),
        tsConfigWithComments
      );

      // Execute
      const result = await readTsConfig(testDir);

      // Assert
      expect(result).toBeTruthy();
      expect(result?.compilerOptions).toBeTruthy();
    });

    it('should return null when tsconfig.json does not exist', async () => {
      // Execute
      const result = await readTsConfig(testDir);

      // Assert
      expect(result).toBeNull();
    });

    it('should throw FileSystemError for invalid JSON', async () => {
      // Setup
      await fs.writeFile(
        path.join(testDir, 'tsconfig.json'),
        '{ invalid json'
      );

      // Execute & Assert
      await expect(readTsConfig(testDir)).rejects.toThrow(FileSystemError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle complex Next.js setup with both routers', async () => {
      // Setup
      const packageJson: PackageJson = {
        dependencies: { next: '14.0.0' },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );
      await fs.mkdir(path.join(testDir, 'app'));
      await fs.mkdir(path.join(testDir, 'pages'));

      // Execute
      const result = await detectFramework(testDir);

      // Assert
      expect(result.features).toContain('app-router');
      expect(result.features).toContain('pages-router');
    });

    it('should handle version strings with caret (^) and tilde (~)', async () => {
      // Setup
      const packageJson: PackageJson = {
        dependencies: {
          next: '^14.0.0',
        },
        devDependencies: {
          typescript: '~5.0.0',
        },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      // Execute
      const result = await detectFramework(testDir);

      // Assert
      expect(result.version).toBe('14.0.0');
    });

    it('should calculate confidence correctly for well-configured projects', async () => {
      // Setup
      const packageJson: PackageJson = {
        dependencies: { next: '14.0.0' },
        devDependencies: { typescript: '5.0.0' },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );
      await fs.writeFile(
        path.join(testDir, 'tsconfig.json'),
        '{}'
      );
      await fs.writeFile(
        path.join(testDir, 'tailwind.config.js'),
        '{}'
      );
      await fs.mkdir(path.join(testDir, 'app'));

      // Execute
      const result = await detectFramework(testDir);

      // Assert
      expect(result.confidence).toBeGreaterThanOrEqual(80);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should include metadata in framework info', async () => {
      // Setup
      const packageJson: PackageJson = {
        name: 'my-awesome-app',
        dependencies: { react: '18.0.0' },
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      // Execute
      const result = await detectFramework(testDir);

      // Assert
      expect(result.metadata).toEqual({
        hasPackageJson: true,
        packageName: 'my-awesome-app',
      });
    });
  });
});
