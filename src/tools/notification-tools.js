export const notificationTools = [
  {
    declaration: {
      name: 'send_notification',
      description: 'Show a desktop notification to alert the user. Works on Windows, macOS, and Linux.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Notification title' },
          message: { type: 'string', description: 'Notification body text' },
          sound: { type: 'boolean', description: 'Play notification sound (default: true)' },
        },
        required: ['title', 'message'],
      },
    },
    execute: async ({ title, message, sound = true }) => {
      try {
        const { default: notifier } = await import('node-notifier');
        return new Promise((resolve) => {
          notifier.notify(
            {
              title: `GimiCoworker: ${title}`,
              message,
              sound,
              wait: false,
            },
            (err) => {
              if (err) resolve(`[ERROR]: ${err.message}`);
              else resolve(`Notification sent: "${title}"`);
            }
          );
          // Resolve after short timeout in case callback doesn't fire
          setTimeout(() => resolve(`Notification sent: "${title}"`), 2000);
        });
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
];
