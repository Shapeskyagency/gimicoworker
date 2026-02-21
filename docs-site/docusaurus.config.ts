import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'GimiCoworker',
  tagline: 'Multi-AI Agent OS Control System — Create unlimited agents powered by Gemini, OpenAI, Claude & more',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: "https://shapeskyagency.github.io",
  baseUrl: "/gimicoworker/",

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'GimiCoworker',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/docs/getting-started/installation',
          position: 'left',
          label: 'Quick Start',
        },
        {
          to: '/docs/guides/multi-agent-teams',
          position: 'left',
          label: 'Guides',
        },
        {
          href: 'https://www.npmjs.com/package/gimicoworker',
          label: 'npm',
          position: 'right',
        },
        {
          href: 'https://github.com/shapeskyagency/gimicoworker',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Getting Started', to: '/docs/getting-started/installation' },
            { label: 'Core Concepts', to: '/docs/core-concepts/agents' },
            { label: 'AI Providers', to: '/docs/core-concepts/providers' },
            { label: 'CLI Reference', to: '/docs/cli-reference' },
          ],
        },
        {
          title: 'Features',
          items: [
            { label: 'Multi-Agent Teams', to: '/docs/guides/multi-agent-teams' },
            { label: 'Telegram Bots', to: '/docs/telegram/setup' },
            { label: 'Social Media', to: '/docs/social-media/whatsapp' },
            { label: 'Workflows', to: '/docs/advanced/workflows' },
          ],
        },
        {
          title: 'Resources',
          items: [
            { label: 'GitHub', href: 'https://github.com/shapeskyagency/gimicoworker' },
            { label: 'npm Package', href: 'https://www.npmjs.com/package/gimicoworker' },
            { label: 'Google AI Studio', href: 'https://aistudio.google.com/apikey' },
            { label: 'Shapesky Agency', href: 'https://github.com/Shapeskyagency' },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} GimiCoworker by Shapesky Agency. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'powershell', 'typescript', 'python'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
