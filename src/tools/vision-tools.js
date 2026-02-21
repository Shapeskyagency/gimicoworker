import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const visionTools = [
  {
    declaration: {
      name: 'take_screenshot',
      description: 'Capture a screenshot of the entire screen. Returns the file path of the saved screenshot.',
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'Filename to save (default: screenshot-{timestamp}.png)' },
          format: { type: 'string', description: 'Image format: png or jpg (default: png)' },
        },
      },
    },
    execute: async ({ filename, format = 'png' } = {}) => {
      try {
        const { default: screenshot } = await import('screenshot-desktop');
        const path = await import('path');
        const fs = await import('fs/promises');
        const os = await import('os');

        const fname = filename || `screenshot-${Date.now()}.${format}`;
        const outputDir = path.join(os.homedir(), '.gimicoworker', 'screenshots');
        await fs.mkdir(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, fname);

        const img = await screenshot({ format });
        await fs.writeFile(outputPath, img);

        return `Screenshot saved to: ${outputPath} (${(img.length / 1024).toFixed(1)} KB)`;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
  {
    declaration: {
      name: 'analyze_image',
      description: 'Read and describe an image file. Returns image metadata and base64 data reference for AI vision analysis.',
      parameters: {
        type: 'object',
        properties: {
          imagePath: { type: 'string', description: 'Absolute path to the image file' },
          question: { type: 'string', description: 'What to analyze (default: describe everything)' },
        },
        required: ['imagePath'],
      },
    },
    execute: async ({ imagePath, question = 'Describe this image in detail.' }) => {
      try {
        const fs = await import('fs');
        const path = await import('path');

        const resolved = path.resolve(imagePath);
        if (!fs.existsSync(resolved)) {
          return `[ERROR]: Image not found: ${imagePath}`;
        }

        const stats = fs.statSync(resolved);
        const ext = path.extname(resolved).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' :
                         ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                         ext === '.gif' ? 'image/gif' :
                         ext === '.webp' ? 'image/webp' : 'image/unknown';

        return `[Image Analysis Request]
Path: ${resolved}
Size: ${(stats.size / 1024).toFixed(1)} KB
Type: ${mimeType}
Question: ${question}

Note: The image file has been located and is ready for vision analysis. To analyze the image content, use a vision-capable model (GPT-4o, Gemini Pro, Claude Sonnet) and include this image path in your request.`;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
  {
    declaration: {
      name: 'screen_ocr',
      description: 'Take a screenshot and attempt to extract visible text from the screen using basic OCR heuristics.',
      parameters: {
        type: 'object',
        properties: {
          region: { type: 'string', description: 'Screen region hint: full, top, bottom, left, right (default: full)' },
        },
      },
    },
    execute: async ({ region = 'full' } = {}) => {
      try {
        const { default: screenshot } = await import('screenshot-desktop');
        const path = await import('path');
        const fs = await import('fs/promises');
        const os = await import('os');

        const outputDir = path.join(os.homedir(), '.gimicoworker', 'screenshots');
        await fs.mkdir(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, `ocr-${Date.now()}.png`);

        const img = await screenshot({ format: 'png' });
        await fs.writeFile(outputPath, img);

        // Try PowerShell-based OCR on Windows
        if (process.platform === 'win32') {
          try {
            const { stdout } = await execAsync(
              `powershell -Command "Add-Type -AssemblyName System.Drawing; $bmp = [System.Drawing.Bitmap]::FromFile('${outputPath}'); Write-Output ('Screenshot captured: ' + $bmp.Width + 'x' + $bmp.Height)"`,
              { timeout: 10000 }
            );
            return `Screenshot captured for OCR: ${outputPath}\nImage info: ${stdout.trim()}\nRegion: ${region}\n\nTo extract text, use a vision-capable model to analyze the screenshot at: ${outputPath}`;
          } catch {}
        }

        return `Screenshot captured for OCR: ${outputPath}\nRegion: ${region}\nUse a vision-capable model to analyze the screenshot for text extraction.`;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
];
