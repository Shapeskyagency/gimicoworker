import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/configuration',
        'getting-started/first-run',
        'getting-started/quick-commands',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'core-concepts/agents',
        'core-concepts/tools',
        'core-concepts/memory',
        'core-concepts/models',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/folder-restrictions',
        'guides/multi-agent-teams',
        'guides/working-with-folders',
        'guides/custom-agents',
      ],
    },
    {
      type: 'category',
      label: 'Telegram',
      items: [
        'telegram/setup',
        'telegram/multi-bot',
        'telegram/commands',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/overview',
        'deployment/npm-publish',
        'deployment/server',
      ],
    },
    'cli-reference',
  ],
};

export default sidebars;
