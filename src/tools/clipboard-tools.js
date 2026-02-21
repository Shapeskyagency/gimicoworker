export const clipboardTools = [
  {
    declaration: {
      name: 'clipboard_read',
      description: 'Read the current contents of the system clipboard.',
      parameters: { type: 'object', properties: {} },
    },
    execute: async () => {
      try {
        const { default: clipboard } = await import('clipboardy');
        const content = await clipboard.read();
        return content || '[Clipboard is empty]';
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
  {
    declaration: {
      name: 'clipboard_write',
      description: 'Write text to the system clipboard.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Text to copy to clipboard' },
        },
        required: ['text'],
      },
    },
    execute: async ({ text }) => {
      try {
        const { default: clipboard } = await import('clipboardy');
        await clipboard.write(text);
        return `Copied ${text.length} characters to clipboard.`;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
];
