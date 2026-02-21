---
sidebar_position: 1
---

# Vision, Scraping & Utility Tools

GimiCoworker includes a powerful set of built-in tools for visual analysis, web scraping, clipboard management, and system notifications. These tools allow your AI agent to interact with the screen, gather information from the web, and communicate results — all without leaving the conversation.

## Vision Tools

GimiCoworker provides two vision-related tools that give your agent the ability to see and understand visual content.

### take_screenshot

Captures a screenshot of the current screen. This is useful for inspecting the state of a GUI application, verifying that a process completed visually, or providing context to the AI about what is currently displayed.

**Usage Example:**

```
Take a screenshot of my current screen.
```

The agent will capture the screen and save the image, making it available for further analysis.

**Practical Use Cases:**

- Verify that a desktop application launched correctly
- Document the current state of a UI before and after a change
- Capture error dialogs or unexpected visual output for debugging

### analyze_image

Analyzes an image file using AI vision capabilities. Once you have a screenshot or any other image, this tool sends it through an AI vision model to extract meaningful information — describing content, reading text, identifying UI elements, and more.

**Usage Example:**

```
Analyze the image at C:\screenshots\error-dialog.png and tell me what the error says.
```

The agent will process the image and return a detailed description or answer based on the visual content.

**Practical Use Cases:**

- Read text from a screenshot of an error message
- Describe the layout of a web page captured as an image
- Identify icons, buttons, or visual elements in a UI screenshot
- Extract data from charts or graphs saved as images

## Scraping Tools

Two scraping tools allow GimiCoworker to pull content and links from any public webpage.

### scrape_webpage

Scrapes content from a webpage URL. The agent fetches the page, extracts the main textual content, and returns it in a clean, readable format. This is ideal for gathering information from documentation sites, articles, or any web resource.

**Usage Example:**

```
Scrape the content from https://example.com/blog/latest-post
```

The agent will retrieve the page and return its text content, stripping away navigation, ads, and other non-essential elements.

**Practical Use Cases:**

- Gather documentation from an external API reference
- Summarize the content of a news article or blog post
- Pull release notes from a project's changelog page
- Collect data from a public-facing status page

### extract_links

Extracts all links from a webpage. This tool fetches a page and returns every hyperlink found on it, which is useful for crawling, auditing, or building a sitemap.

**Usage Example:**

```
Extract all links from https://example.com/resources
```

The agent will return a list of all URLs found on the page along with their anchor text.

**Practical Use Cases:**

- Audit a page for broken or outdated links
- Discover related resources linked from a documentation page
- Build a list of download URLs from a release page
- Map out the structure of a website by following links

## Clipboard Tools

Two clipboard tools give GimiCoworker direct access to the system clipboard, enabling seamless data transfer between the agent and other applications.

### clipboard_read

Reads the current contents of the system clipboard. This lets the agent access text that you have copied from any application.

**Usage Example:**

```
Read what's on my clipboard and summarize it.
```

The agent will retrieve the current clipboard text and can then process, analyze, or act on it.

**Practical Use Cases:**

- Analyze a code snippet you copied from an editor
- Process a URL you copied from your browser
- Summarize a block of text you copied from a document
- Use clipboard content as input for another tool or workflow

### clipboard_write

Writes text to the system clipboard. This allows the agent to place generated content directly onto your clipboard so you can paste it into any application.

**Usage Example:**

```
Generate a UUID and copy it to my clipboard.
```

The agent will generate the content and write it to the clipboard, ready for you to paste.

**Practical Use Cases:**

- Copy a generated code snippet to paste into your editor
- Place a formatted response on the clipboard for use in an email
- Write a computed result to the clipboard for quick access
- Copy a file path or command for use in another terminal

## Notification Tools

### send_notification

Sends an OS-level desktop notification. This is useful for alerting you when a long-running task completes, when a monitored condition is met, or simply to surface important information.

**Usage Example:**

```
Send me a notification when the backup is complete.
```

The agent will trigger a native desktop notification with the specified message.

**Practical Use Cases:**

- Alert you when a long file download or build process finishes
- Notify you when a scheduled health check detects an issue
- Send a reminder after a certain amount of time has passed
- Confirm that a workflow completed successfully

## Combining Tools

These tools become especially powerful when combined. Here are a few examples of multi-tool workflows:

**Screenshot and Analysis Pipeline:**
1. Use `take_screenshot` to capture the current screen
2. Use `analyze_image` to read and describe the content
3. Use `clipboard_write` to copy the extracted text to your clipboard

**Web Research Pipeline:**
1. Use `scrape_webpage` to fetch an article
2. Ask the agent to summarize the content
3. Use `extract_links` to find related resources from the same page
4. Use `send_notification` to alert you when the research is complete

**Clipboard Processing Pipeline:**
1. Use `clipboard_read` to get a URL you copied
2. Use `scrape_webpage` to fetch the content at that URL
3. Ask the agent to analyze or transform the content
4. Use `clipboard_write` to place the result back on your clipboard
