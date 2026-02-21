import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs">
            Get Started
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/docs/getting-started/installation"
            style={{marginLeft: '1rem'}}>
            Installation Guide
          </Link>
        </div>
      </div>
    </header>
  );
}

const features = [
  {
    title: 'Unlimited AI Agents',
    description: 'Create as many agents as you need. Each one has a specialized role — General, DevOps, Coder, Security, SysAdmin, FileManager, Researcher, or your own Custom role.',
  },
  {
    title: '29 OS Control Tools',
    description: 'Full system access: execute shell commands, manage files, control processes, make network requests, and more. Agents have real power over your computer.',
  },
  {
    title: 'Persistent Memory',
    description: 'Agents remember across conversations using SQLite. Private memories per agent plus shared memory for cross-agent communication and team coordination.',
  },
  {
    title: 'Telegram Integration',
    description: 'Control agents from anywhere via Telegram. Create unlimited dedicated bots — each one manages a single agent role. Run them all simultaneously.',
  },
  {
    title: 'Folder Restrictions',
    description: 'Lock agents to specific directories for safety. A frontend agent can only touch frontend code. A client bot can only access that client\'s files.',
  },
  {
    title: 'Multi-Agent Teams',
    description: 'Build agent teams that work together. An Architect plans, a Frontend Dev builds UI, a Backend Dev builds API, and DevOps deploys — all coordinated through shared memory.',
  },
];

function Feature({title, description}: {title: string; description: string}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="padding-horiz--md padding-vert--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Multi-Agent OS Control System"
      description="Build unlimited AI agents powered by Gemini that can control your computer. Persistent memory, Telegram bots, folder restrictions, and multi-agent teams.">
      <HomepageHeader />
      <main>
        <section className="padding-vert--xl">
          <div className="container">
            <div className="row">
              {features.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
