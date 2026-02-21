export const scrapingTools = [
  {
    declaration: {
      name: 'scrape_webpage',
      description: 'Fetch and extract text content from a webpage URL. Removes HTML tags and returns readable text. Optionally renders JavaScript for dynamic pages.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to scrape' },
          selector: { type: 'string', description: 'Optional CSS selector to extract specific content (e.g. "article", "#main", ".content")' },
          javascript: { type: 'boolean', description: 'Render JavaScript using browser (slower but handles SPAs and dynamic pages). Default: false' },
        },
        required: ['url'],
      },
    },
    execute: async ({ url, selector, javascript = false }) => {
      try {
        if (javascript) {
          const { browserManager } = await import('../social/browser-manager.js');
          const page = await browserManager.launch('scraper', { headless: true });
          try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

            let content;
            if (selector) {
              const el = await page.$(selector);
              content = el ? await el.textContent() : '[Selector not found]';
            } else {
              content = await page.$eval('body', el => el.innerText);
            }

            return content.replace(/\s+/g, ' ').trim().substring(0, 15000);
          } finally {
            await browserManager.close('scraper');
          }
        }

        // Simple fetch for static pages
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GimiCoworker/1.0)' },
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) return `[ERROR]: HTTP ${response.status} ${response.statusText}`;

        const html = await response.text();
        let text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\s+/g, ' ')
          .trim();

        if (selector) {
          // For static fetch, selector is a hint -- extract a rough section
          text = `[Note: CSS selectors only work in JS mode. Returning full page text.]\n\n${text}`;
        }

        return text.substring(0, 15000);
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
  {
    declaration: {
      name: 'extract_links',
      description: 'Extract all links (URLs) from a webpage.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to extract links from' },
          filter: { type: 'string', description: 'Optional filter string to match in URLs (e.g. ".pdf", "github.com")' },
        },
        required: ['url'],
      },
    },
    execute: async ({ url, filter }) => {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GimiCoworker/1.0)' },
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) return `[ERROR]: HTTP ${response.status} ${response.statusText}`;

        const html = await response.text();
        const linkRegex = /href=["']([^"']+)["']/g;
        const links = new Set();
        let match;

        while ((match = linkRegex.exec(html)) !== null) {
          let link = match[1];
          // Resolve relative URLs
          if (link.startsWith('/')) {
            const base = new URL(url);
            link = `${base.origin}${link}`;
          }
          if (!link.startsWith('http')) continue;
          if (filter && !link.includes(filter)) continue;
          links.add(link);
        }

        const unique = [...links];
        return `Found ${unique.length} links:\n${unique.join('\n')}`;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
  {
    declaration: {
      name: 'scrape_structured',
      description: 'Extract structured data from a webpage (title, meta description, headings, images). Great for quick analysis.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to analyze' },
        },
        required: ['url'],
      },
    },
    execute: async ({ url }) => {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GimiCoworker/1.0)' },
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) return `[ERROR]: HTTP ${response.status} ${response.statusText}`;

        const html = await response.text();

        const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || 'N/A';
        const description = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] || 'N/A';

        const headings = [];
        const hRegex = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
        let hMatch;
        while ((hMatch = hRegex.exec(html)) !== null && headings.length < 20) {
          headings.push({ level: hMatch[1], text: hMatch[2].replace(/<[^>]+>/g, '').trim() });
        }

        const images = [];
        const imgRegex = /<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["']|<img[^>]*src=["']([^"']*)["']/gi;
        let imgMatch;
        while ((imgMatch = imgRegex.exec(html)) !== null && images.length < 10) {
          images.push({ src: imgMatch[1] || imgMatch[3], alt: imgMatch[2] || '' });
        }

        return JSON.stringify({ title, description, headings, images }, null, 2);
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
];
