import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'CLI-AGT',
  tagline: 'Multi-Agent OS Control System powered by Gemini',
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
      title: 'CLI-AGT',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
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
          title: 'Docs',
          items: [
            { label: 'Getting Started', to: '/docs/getting-started/installation' },
            { label: 'Core Concepts', to: '/docs/core-concepts/agents' },
            { label: 'Telegram', to: '/docs/telegram/setup' },
          ],
        },
        {
          title: 'Guides',
          items: [
            { label: 'Multi-Agent Teams', to: '/docs/guides/multi-agent-teams' },
            { label: 'Folder Restrictions', to: '/docs/guides/folder-restrictions' },
            { label: 'Deployment', to: '/docs/deployment/overview' },
          ],
        },
        {
          title: 'Resources',
          items: [
            { label: 'Google AI Studio', href: 'https://aistudio.google.com/apikey' },
            { label: 'Gemini API Docs', href: 'https://ai.google.dev/docs' },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} CLI-AGT. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'powershell'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
