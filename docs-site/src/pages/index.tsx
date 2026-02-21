import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

/* ─── Feature Data ─── */
const features = [
  {
    icon: '🤖',
    title: 'Unlimited AI Agents',
    description: 'Create as many agents as you need — General, DevOps, Coder, Security, SysAdmin, Researcher, or fully Custom roles with unique prompts.',
    link: '/docs/core-concepts/agents',
  },
  {
    icon: '🧠',
    title: '5 AI Providers',
    description: 'Gemini, OpenAI, Claude, Moonshot, and Ollama. Each agent can use a different provider and model — mix and match for your workflow.',
    link: '/docs/core-concepts/providers',
  },
  {
    icon: '🛠️',
    title: '60+ OS Control Tools',
    description: 'Shell execution, filesystem, processes, network, memory, vision, web scraping, clipboard, notifications — real power over your machine.',
    link: '/docs/core-concepts/tools',
  },
  {
    icon: '💬',
    title: 'Social Media Automation',
    description: 'WhatsApp and Instagram automation via Playwright — send messages, auto-reply, post content, manage DMs, run analytics.',
    link: '/docs/social-media/whatsapp',
  },
  {
    icon: '📡',
    title: 'Telegram Integration',
    description: 'Control agents remotely via Telegram. Unlimited dedicated bots — each manages a single agent role. Run 24/7 on a server.',
    link: '/docs/telegram/setup',
  },
  {
    icon: '🔒',
    title: 'Folder Sandboxing',
    description: 'Lock agents to specific directories. A frontend agent touches only frontend code. A client bot accesses only that client\'s files.',
    link: '/docs/guides/folder-restrictions',
  },
  {
    icon: '🧩',
    title: 'Multi-Agent Teams',
    description: 'Architect plans, Frontend builds UI, Backend builds API, DevOps deploys — all coordinated through shared persistent memory.',
    link: '/docs/guides/multi-agent-teams',
  },
  {
    icon: '⚡',
    title: 'Workflows & Scheduler',
    description: 'Build multi-step automation pipelines with variable interpolation. Schedule recurring AI tasks with cron expressions.',
    link: '/docs/advanced/workflows',
  },
  {
    icon: '👁️',
    title: 'Vision & Scraping',
    description: 'Take screenshots and analyze images with AI. Scrape web pages, extract links, and process content — all from natural language.',
    link: '/docs/advanced/vision-scraping',
  },
];

const providers = [
  { name: 'Google Gemini', models: 'Flash, Pro, Flash-Lite' },
  { name: 'OpenAI', models: 'GPT-4o, GPT-4 Turbo, GPT-3.5' },
  { name: 'Anthropic Claude', models: 'Sonnet, Haiku, Opus' },
  { name: 'Moonshot / Kimi', models: '128K, 32K, 8K context' },
  { name: 'Ollama (Local)', models: 'Llama, Mistral, CodeLlama' },
];

const stats = [
  { value: '60+', label: 'OS Control Tools' },
  { value: '5', label: 'AI Providers' },
  { value: '8', label: 'Built-in Roles' },
  { value: '∞', label: 'Agents & Bots' },
];

/* ─── Components ─── */
function HeroSection() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.heroBadge}>Open Source Agent Framework</div>
        <Heading as="h1" className={styles.heroTitle}>
          <span className={styles.heroTitleGradient}>GimiCoworker</span>
        </Heading>
        <p className={styles.heroSubtitle}>
          Create <strong>unlimited AI agents</strong> that fully control your computer.
          <br />
          Powered by Gemini, OpenAI, Claude, Moonshot & Ollama.
        </p>

        <div className={styles.heroCode}>
          <code>
            <span className={styles.codeDim}>$</span> npm install -g gimicoworker
          </code>
        </div>

        <div className={styles.heroButtons}>
          <Link className={clsx('button button--lg', styles.btnPrimary)} to="/docs">
            Get Started
          </Link>
          <Link className={clsx('button button--lg', styles.btnOutline)} to="/docs/getting-started/installation">
            Installation
          </Link>
          <Link
            className={clsx('button button--lg', styles.btnGhost)}
            href="https://github.com/shapeskyagency/gimicoworker">
            GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

function StatsSection() {
  return (
    <section className={styles.stats}>
      <div className="container">
        <div className={styles.statsGrid}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.statItem}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2" className={styles.sectionTitle}>Everything Your Agents Need</Heading>
          <p className={styles.sectionDesc}>
            A complete toolkit for building AI agent teams that control your operating system through natural language.
          </p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((f, i) => (
            <Link key={i} to={f.link} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <Heading as="h3" className={styles.featureTitle}>{f.title}</Heading>
              <p className={styles.featureDesc}>{f.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProvidersSection() {
  return (
    <section className={styles.providers}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2" className={styles.sectionTitle}>Multi-Provider AI Support</Heading>
          <p className={styles.sectionDesc}>
            Each agent can use a different AI provider and model. Mix cloud APIs with local models for the perfect setup.
          </p>
        </div>
        <div className={styles.providerGrid}>
          {providers.map((p, i) => (
            <div key={i} className={styles.providerCard}>
              <div className={styles.providerName}>{p.name}</div>
              <div className={styles.providerModels}>{p.models}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoSection() {
  return (
    <section className={styles.demo}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2" className={styles.sectionTitle}>See It In Action</Heading>
          <p className={styles.sectionDesc}>
            Natural language commands that translate into real OS operations.
          </p>
        </div>
        <div className={styles.demoGrid}>
          <div className={styles.demoCard}>
            <div className={styles.demoLabel}>System Admin</div>
            <div className={styles.demoExchange}>
              <div className={styles.demoUser}>
                <span className={styles.demoTag}>You</span>
                Find all JavaScript files larger than 1MB and list them by size
              </div>
              <div className={styles.demoAgent}>
                <span className={styles.demoTag}>Agent</span>
                <span className={styles.demoAction}>search_files + read_file</span>
                Found 3 files: bundle.js (4.2 MB), vendor.js (2.1 MB), app.min.js (1.3 MB)
              </div>
            </div>
          </div>
          <div className={styles.demoCard}>
            <div className={styles.demoLabel}>DevOps</div>
            <div className={styles.demoExchange}>
              <div className={styles.demoUser}>
                <span className={styles.demoTag}>You</span>
                Check which ports are in use and what's running on port 3000
              </div>
              <div className={styles.demoAgent}>
                <span className={styles.demoTag}>Agent</span>
                <span className={styles.demoAction}>check_port + list_processes</span>
                Port 3000: node.exe (PID 12345) — your dev server is running
              </div>
            </div>
          </div>
          <div className={styles.demoCard}>
            <div className={styles.demoLabel}>Coder</div>
            <div className={styles.demoExchange}>
              <div className={styles.demoUser}>
                <span className={styles.demoTag}>You</span>
                Set up a new React project with TypeScript in /projects/my-app
              </div>
              <div className={styles.demoAgent}>
                <span className={styles.demoTag}>Agent</span>
                <span className={styles.demoAction}>execute_command × 4</span>
                Created React+TS project, installed deps, ready at /projects/my-app
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.cta}>
      <div className="container">
        <div className={styles.ctaInner}>
          <Heading as="h2" className={styles.ctaTitle}>Ready to Build Your Agent Team?</Heading>
          <p className={styles.ctaDesc}>
            Install GimiCoworker in 30 seconds. Free to use with Gemini's generous free tier.
          </p>
          <div className={styles.ctaCode}>
            <code>npm install -g gimicoworker</code>
          </div>
          <div className={styles.ctaButtons}>
            <Link className={clsx('button button--lg', styles.btnPrimary)} to="/docs/getting-started/installation">
              Read the Docs
            </Link>
            <Link
              className={clsx('button button--lg', styles.btnOutline)}
              href="https://github.com/shapeskyagency/gimicoworker">
              Star on GitHub
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Page ─── */
export default function Home(): ReactNode {
  return (
    <Layout
      title="Multi-AI Agent OS Control System"
      description="Create unlimited AI agents powered by Gemini, OpenAI, Claude & more. 60+ tools for full OS control, social media automation, Telegram bots, and multi-agent teams.">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <ProvidersSection />
      <DemoSection />
      <CTASection />
    </Layout>
  );
}
