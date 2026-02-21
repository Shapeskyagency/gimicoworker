import { browserManager } from './browser-manager.js';
import { EventEmitter } from 'events';

const IG_URL = 'https://www.instagram.com';

export class InstagramClient extends EventEmitter {
  constructor() {
    super();
    this.page = null;
    this.loggedIn = false;

    // ─── DM Watcher / Auto-Reply State ─────────────────────────────
    this._watchInterval = null;
    this._autoReplyRules = [];
    this._onNewDM = null;
    this._lastDMSnapshot = new Map(); // username -> lastPreview

    // ─── Analytics Cache ───────────────────────────────────────────
    this._analyticsHistory = []; // { date, followers, following, posts }
  }

  // ═══════════════════════════════════════════════════════════════════
  // CONNECTION
  // ═══════════════════════════════════════════════════════════════════

  async connect(headless = false) {
    this.page = await browserManager.launch('instagram', { headless });
    await this.page.goto(IG_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await this.page.waitForTimeout(2000);

    // Dismiss cookie dialog if present
    try {
      const cookieBtn = await this.page.$('button:has-text("Allow all cookies"), button:has-text("Accept All"), button:has-text("Allow essential")');
      if (cookieBtn) await cookieBtn.click();
      await this.page.waitForTimeout(500);
    } catch {}

    // Check if already logged in
    const isLoggedIn = await this._isLoggedIn();
    if (isLoggedIn) {
      this.loggedIn = true;
      await this._dismissDialog();
      return { status: 'logged_in', message: 'Already logged in to Instagram.' };
    }

    return { status: 'login_required', message: 'Instagram opened in browser. Please log in manually, then call instagram_wait_login.' };
  }

  async login(username, password) {
    if (!this.page) throw new Error('Not connected. Call connect() first.');

    try {
      const usernameInput = await this.page.waitForSelector('input[name="username"]', { timeout: 5000 });
      const passwordInput = await this.page.waitForSelector('input[name="password"]', { timeout: 5000 });

      await usernameInput.fill(username);
      await this.page.waitForTimeout(300);
      await passwordInput.fill(password);
      await this.page.waitForTimeout(300);

      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(5000);

      await this._dismissDialog();
      await this._dismissDialog();

      this.loggedIn = true;
      return { status: 'logged_in', message: 'Successfully logged in to Instagram!' };
    } catch (err) {
      throw new Error(`Login failed: ${err.message}`);
    }
  }

  async waitForLogin(timeout = 120000) {
    if (this.loggedIn) return { status: 'already_logged_in' };
    if (!this.page) throw new Error('Not connected. Call connect() first.');

    await this.page.waitForFunction(
      () => !!document.querySelector('svg[aria-label="Home"]') ||
            !!document.querySelector('a[href="/direct/inbox/"]') ||
            !!document.querySelector('[aria-label="New post"]'),
      { timeout }
    );

    await this.page.waitForTimeout(1000);
    await this._dismissDialog();
    await this._dismissDialog();

    this.loggedIn = true;
    return { status: 'logged_in', message: 'Successfully logged in to Instagram!' };
  }

  // ═══════════════════════════════════════════════════════════════════
  // LIKE A POST
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Like a post by URL or by navigating to a user's profile and liking their latest post.
   * @param {string} target - Post URL (instagram.com/p/...) or username
   * @param {number} postIndex - If target is a username, which post to like (0 = latest)
   */
  async likePost(target, postIndex = 0) {
    this._checkLogin();

    if (target.includes('instagram.com/p/') || target.includes('instagram.com/reel/')) {
      // Direct post URL
      await this.page.goto(target, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await this.page.waitForTimeout(2000);
    } else {
      // Username - navigate to their profile and open a post
      await this._openPostFromProfile(target, postIndex);
    }

    // Find and click the like button
    const liked = await this._clickLikeButton();
    return liked;
  }

  /**
   * Like multiple recent posts from a user's profile.
   */
  async likeMultiplePosts(username, count = 3) {
    this._checkLogin();
    const results = [];

    const postLinks = await this._getPostLinksFromProfile(username, count);

    if (postLinks.length === 0) {
      return `No posts found on @${username}'s profile. The account may be private or have no posts.`;
    }

    for (const href of postLinks) {
      try {
        await this.page.goto(`${IG_URL}${href}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await this.page.waitForTimeout(2000);
        const result = await this._clickLikeButton();
        results.push({ post: href, result });
        // Rate limit protection
        await this.page.waitForTimeout(1500 + Math.random() * 1000);
      } catch (err) {
        results.push({ post: href, result: `Error: ${err.message}` });
      }
    }

    return JSON.stringify(results, null, 2);
  }

  // ═══════════════════════════════════════════════════════════════════
  // COMMENT ON A POST
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Comment on a post by URL or by navigating to a user's post.
   */
  async commentOnPost(target, commentText, postIndex = 0) {
    this._checkLogin();

    if (target.includes('instagram.com/p/') || target.includes('instagram.com/reel/')) {
      await this.page.goto(target, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await this.page.waitForTimeout(2000);
    } else {
      await this._openPostFromProfile(target, postIndex);
    }

    // Click comment icon or find comment textarea
    const commentInput = await this.page.waitForSelector(
      'textarea[aria-label="Add a comment…"], textarea[placeholder="Add a comment…"], form textarea',
      { timeout: 5000 }
    ).catch(async () => {
      // Try clicking the comment icon first
      const commentIcon = await this.page.$('svg[aria-label="Comment"]');
      if (commentIcon) {
        const parent = await commentIcon.evaluateHandle(el => el.closest('button') || el.closest('[role="button"]') || el.parentElement);
        await parent.click();
        await this.page.waitForTimeout(1000);
      }
      return await this.page.waitForSelector(
        'textarea[aria-label="Add a comment…"], textarea[placeholder="Add a comment…"], form textarea',
        { timeout: 5000 }
      );
    });

    await commentInput.click();
    await this.page.waitForTimeout(300);
    await this.page.keyboard.type(commentText, { delay: 20 });
    await this.page.waitForTimeout(500);

    // Click Post button or press Enter
    const postBtn = await this.page.$('button:has-text("Post"), div[role="button"]:has-text("Post")');
    if (postBtn) {
      await postBtn.click();
    } else {
      await this.page.keyboard.press('Enter');
    }

    await this.page.waitForTimeout(1500);
    return `Comment posted: "${commentText.substring(0, 80)}${commentText.length > 80 ? '...' : ''}"`;
  }

  // ═══════════════════════════════════════════════════════════════════
  // SEND DM
  // ═══════════════════════════════════════════════════════════════════

  async sendDM(username, message) {
    this._checkLogin();

    await this.page.goto(`${IG_URL}/direct/new/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await this.page.waitForTimeout(2000);

    const searchInput = await this.page.waitForSelector(
      'input[placeholder="Search..."], input[name="queryBox"]',
      { timeout: 5000 }
    );
    await searchInput.fill(username);
    await this.page.waitForTimeout(2000);

    // Click on the user result
    const userResult = await this.page.$(`div[role="button"]:has-text("${username}")`) ||
                       await this.page.$(`span:has-text("${username}")`);
    if (!userResult) throw new Error(`User "${username}" not found in Instagram search.`);
    await userResult.click();
    await this.page.waitForTimeout(500);

    // Click "Chat" or "Next"
    const chatBtn = await this.page.$('div[role="button"]:has-text("Chat"), div[role="button"]:has-text("Next")');
    if (chatBtn) {
      await chatBtn.click();
      await this.page.waitForTimeout(1000);
    }

    // Type and send message
    const msgInput = await this.page.waitForSelector(
      'textarea[placeholder="Message..."], div[role="textbox"][aria-label="Message"], div[contenteditable="true"]',
      { timeout: 5000 }
    );
    await msgInput.click();
    await this.page.keyboard.type(message, { delay: 15 });
    await this.page.waitForTimeout(300);

    const sendBtn = await this.page.$('button:has-text("Send")');
    if (sendBtn) {
      await sendBtn.click();
    } else {
      await this.page.keyboard.press('Enter');
    }

    await this.page.waitForTimeout(500);
    return `DM sent to @${username}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`;
  }

  // ═══════════════════════════════════════════════════════════════════
  // DM INBOX
  // ═══════════════════════════════════════════════════════════════════

  async getInbox(count = 10) {
    this._checkLogin();

    await this.page.goto(`${IG_URL}/direct/inbox/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await this.page.waitForTimeout(3000);
    await this._dismissDialog();

    const threads = await this.page.evaluate((max) => {
      const results = [];
      // Try multiple selectors for DM threads
      const threadEls = document.querySelectorAll('a[href*="/direct/t/"]') ||
                        document.querySelectorAll('[role="listbox"] > div > div');

      for (let i = 0; i < Math.min(threadEls.length, max); i++) {
        const el = threadEls[i];
        const nameEl = el.querySelector('span[dir="auto"]') || el.querySelector('span');
        const previewEl = el.querySelectorAll('span[dir="auto"]');
        const timeEl = el.querySelector('time');

        results.push({
          user: nameEl?.textContent?.trim() || 'Unknown',
          preview: previewEl.length > 1 ? previewEl[previewEl.length - 1]?.textContent?.trim() || '' : '',
          time: timeEl?.getAttribute('datetime') || timeEl?.textContent || '',
        });
      }
      return results;
    }, count);

    return threads.length > 0
      ? JSON.stringify(threads, null, 2)
      : 'No DM threads found or inbox is empty.';
  }

  /**
   * Read messages from a specific DM thread.
   */
  async readDMThread(username, count = 20) {
    this._checkLogin();

    await this.page.goto(`${IG_URL}/direct/inbox/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await this.page.waitForTimeout(2000);
    await this._dismissDialog();

    // Find and click the thread
    const thread = await this.page.$(`a[href*="/direct/t/"]:has-text("${username}")`) ||
                   await this.page.evaluate((name) => {
                     const links = document.querySelectorAll('a[href*="/direct/t/"]');
                     for (const link of links) {
                       if (link.textContent.toLowerCase().includes(name.toLowerCase())) {
                         link.click();
                         return true;
                       }
                     }
                     return false;
                   }, username);

    if (!thread) throw new Error(`DM thread with "${username}" not found.`);
    if (typeof thread !== 'boolean') await thread.click();
    await this.page.waitForTimeout(2000);

    // Extract messages
    const messages = await this.page.evaluate((max) => {
      const results = [];
      const msgEls = document.querySelectorAll('[role="row"], div[class*="message"]');

      const startIdx = Math.max(0, msgEls.length - max);
      for (let i = startIdx; i < msgEls.length; i++) {
        const el = msgEls[i];
        const text = el.querySelector('span[dir]')?.textContent?.trim() ||
                     el.querySelector('div[dir]')?.textContent?.trim();
        if (!text) continue;

        // Determine if sent by me or them
        const style = window.getComputedStyle(el);
        const isMe = el.querySelector('[class*="sent"]') !== null ||
                     style.textAlign === 'right' || style.justifyContent === 'flex-end';

        results.push({
          from: isMe ? 'me' : 'them',
          text,
        });
      }
      return results;
    }, count);

    return messages.length > 0
      ? JSON.stringify(messages, null, 2)
      : `No messages found in thread with "${username}".`;
  }

  // ═══════════════════════════════════════════════════════════════════
  // POST CONTENT
  // ═══════════════════════════════════════════════════════════════════

  async postContent(imagePath, caption = '') {
    this._checkLogin();
    const fs = await import('fs');
    const path = await import('path');

    const resolved = path.resolve(imagePath);
    if (!fs.existsSync(resolved)) throw new Error(`Image file not found: ${imagePath}`);

    const newPostBtn = await this.page.waitForSelector(
      '[aria-label="New post"], svg[aria-label="New post"]',
      { timeout: 5000 }
    );
    await newPostBtn.click();
    await this.page.waitForTimeout(1500);

    const fileInput = await this.page.waitForSelector('input[type="file"][accept*="image"]', { timeout: 5000 });
    await fileInput.setInputFiles(resolved);
    await this.page.waitForTimeout(3000);

    for (let i = 0; i < 2; i++) {
      const nextBtn = await this.page.$('button:has-text("Next"), div[role="button"]:has-text("Next")');
      if (nextBtn) {
        await nextBtn.click();
        await this.page.waitForTimeout(1500);
      }
    }

    if (caption) {
      const captionField = await this.page.$(
        'textarea[aria-label="Write a caption..."], div[role="textbox"][aria-label*="caption"], div[aria-label*="Write a caption"]'
      );
      if (captionField) {
        await captionField.click();
        await this.page.keyboard.type(caption, { delay: 15 });
        await this.page.waitForTimeout(500);
      }
    }

    const shareBtn = await this.page.$('button:has-text("Share"), div[role="button"]:has-text("Share")');
    if (shareBtn) {
      await shareBtn.click();
      await this.page.waitForTimeout(5000);
    }

    return `Instagram post published${caption ? ` with caption: "${caption.substring(0, 50)}..."` : ''}`;
  }

  // ═══════════════════════════════════════════════════════════════════
  // PROFILE & ANALYTICS
  // ═══════════════════════════════════════════════════════════════════

  async getProfileInfo(username) {
    this._checkLogin();

    const profileUrl = username ? `${IG_URL}/${username}/` : IG_URL;
    await this.page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await this.page.waitForTimeout(2000);

    // If no username, go to own profile
    if (!username) {
      const profileLink = await this.page.$('a[href*="/"][role="link"] img[alt*="profile"]') ||
                          await this.page.$('img[data-testid="user-avatar"]');
      if (profileLink) {
        const parent = await profileLink.evaluateHandle(el => el.closest('a'));
        if (parent) {
          await parent.click();
          await this.page.waitForTimeout(2000);
        }
      }
    }

    const info = await this.page.evaluate(() => {
      const result = {};

      // Username
      const h2 = document.querySelector('header h2, header h1');
      result.username = h2?.textContent?.trim() || '';

      // Full name
      const nameEl = document.querySelector('header section span[class*="name"], header span[dir="auto"]');
      result.fullName = nameEl?.textContent?.trim() || '';

      // Bio
      const bioSection = document.querySelector('header section > div > span, header div[class*="bio"] span, header section div span[dir]');
      result.bio = bioSection?.textContent?.trim() || '';

      // Stats: posts, followers, following
      const statEls = document.querySelectorAll('header section ul li, header ul li');
      const statsText = Array.from(statEls).map(li => li.textContent?.trim() || '');
      result.statsRaw = statsText;

      // Try to parse numbers
      for (const stat of statsText) {
        const lower = stat.toLowerCase();
        const numMatch = stat.match(/([\d,.]+[KkMm]?)/);
        const numStr = numMatch ? numMatch[1] : '0';
        if (lower.includes('post')) result.posts = numStr;
        else if (lower.includes('follower') && !lower.includes('following')) result.followers = numStr;
        else if (lower.includes('following')) result.following = numStr;
      }

      // Meta description (backup)
      const meta = document.querySelector('meta[name="description"]');
      result.description = meta?.getAttribute('content') || '';

      // Is verified?
      result.verified = !!document.querySelector('span[title="Verified"], svg[aria-label="Verified"]');

      // Is private?
      result.isPrivate = !!document.querySelector('h2:has-text("This account is private")') ||
                         document.body.textContent?.includes('This account is private') || false;

      return result;
    });

    return JSON.stringify(info, null, 2);
  }

  /**
   * Get analytics for your own profile: followers, following, posts count,
   * engagement estimates, and growth tracking.
   */
  async getAnalytics() {
    this._checkLogin();

    // Navigate to own profile
    const profileData = await this._getOwnProfileData();

    // Store snapshot for growth tracking
    const snapshot = {
      date: new Date().toISOString(),
      followers: profileData.followersNum,
      following: profileData.followingNum,
      posts: profileData.postsNum,
    };
    this._analyticsHistory.push(snapshot);

    // Get recent post engagement
    const engagement = await this._getRecentPostEngagement(6);

    const analytics = {
      profile: {
        username: profileData.username,
        followers: profileData.followers,
        following: profileData.following,
        posts: profileData.posts,
      },
      engagement: {
        recentPosts: engagement,
        avgLikes: engagement.length > 0
          ? Math.round(engagement.reduce((s, p) => s + (p.likes || 0), 0) / engagement.length)
          : 0,
        avgComments: engagement.length > 0
          ? Math.round(engagement.reduce((s, p) => s + (p.comments || 0), 0) / engagement.length)
          : 0,
        engagementRate: profileData.followersNum > 0 && engagement.length > 0
          ? ((engagement.reduce((s, p) => s + (p.likes || 0) + (p.comments || 0), 0) / engagement.length) / profileData.followersNum * 100).toFixed(2) + '%'
          : 'N/A',
      },
      growth: this._calculateGrowth(),
    };

    return JSON.stringify(analytics, null, 2);
  }

  /**
   * Generate a daily growth report comparing current stats with historical data.
   */
  async generateDailyReport() {
    this._checkLogin();

    const profileData = await this._getOwnProfileData();
    const engagement = await this._getRecentPostEngagement(9);
    const growth = this._calculateGrowth();

    const avgLikes = engagement.length > 0
      ? Math.round(engagement.reduce((s, p) => s + (p.likes || 0), 0) / engagement.length)
      : 0;
    const avgComments = engagement.length > 0
      ? Math.round(engagement.reduce((s, p) => s + (p.comments || 0), 0) / engagement.length)
      : 0;
    const engRate = profileData.followersNum > 0 && engagement.length > 0
      ? ((avgLikes + avgComments) / profileData.followersNum * 100).toFixed(2)
      : '0';

    const topPost = engagement.length > 0
      ? engagement.reduce((best, p) => (p.likes || 0) + (p.comments || 0) > (best.likes || 0) + (best.comments || 0) ? p : best, engagement[0])
      : null;

    const now = new Date();
    const report = [
      `===== INSTAGRAM DAILY REPORT =====`,
      `Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      ``,
      `--- ACCOUNT OVERVIEW ---`,
      `Username: @${profileData.username}`,
      `Followers: ${profileData.followers}`,
      `Following: ${profileData.following}`,
      `Total Posts: ${profileData.posts}`,
      ``,
      `--- GROWTH ---`,
      growth.followers !== null ? `Follower Change: ${growth.followers >= 0 ? '+' : ''}${growth.followers}` : 'Follower Change: N/A (first report)',
      growth.following !== null ? `Following Change: ${growth.following >= 0 ? '+' : ''}${growth.following}` : '',
      growth.posts !== null ? `New Posts: +${growth.posts}` : '',
      ``,
      `--- ENGAGEMENT (last ${engagement.length} posts) ---`,
      `Average Likes: ${avgLikes}`,
      `Average Comments: ${avgComments}`,
      `Engagement Rate: ${engRate}%`,
      topPost ? `Best Post: ${topPost.likes || 0} likes, ${topPost.comments || 0} comments` : '',
      ``,
      `--- RECENT POSTS ---`,
      ...engagement.map((p, i) =>
        `  ${i + 1}. Likes: ${p.likes || 0} | Comments: ${p.comments || 0}${p.caption ? ` | "${p.caption.substring(0, 40)}..."` : ''}`
      ),
      ``,
      `===== END REPORT =====`,
    ].filter(Boolean).join('\n');

    // Store snapshot
    this._analyticsHistory.push({
      date: now.toISOString(),
      followers: profileData.followersNum,
      following: profileData.followingNum,
      posts: profileData.postsNum,
    });

    return report;
  }

  // ═══════════════════════════════════════════════════════════════════
  // DM WATCHER & AUTO-REPLY
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Start watching for new DMs.
   */
  startDMWatch(intervalMs = 10000, onNewDM = null) {
    if (this._watchInterval) return 'Already watching for DMs.';
    this._onNewDM = onNewDM;

    this._watchInterval = setInterval(async () => {
      try {
        await this._pollForNewDMs();
      } catch {}
    }, intervalMs);

    return `Started watching for Instagram DMs (polling every ${intervalMs / 1000}s).`;
  }

  stopDMWatch() {
    if (this._watchInterval) {
      clearInterval(this._watchInterval);
      this._watchInterval = null;
      this._onNewDM = null;
      return 'Stopped watching for Instagram DMs.';
    }
    return 'Not currently watching.';
  }

  async _pollForNewDMs() {
    if (!this.loggedIn || !this.page) return;

    // Check inbox for new message indicators
    const currentDMs = await this.page.evaluate(() => {
      const results = [];
      // Check for unread DM indicator on the DM icon
      const dmIcon = document.querySelector('a[href="/direct/inbox/"]');
      const badge = dmIcon?.querySelector('div[class*="badge"], span[class*="badge"]');
      if (badge) {
        results.push({ indicator: 'badge', text: badge.textContent || '1' });
      }
      return results;
    });

    for (const dm of currentDMs) {
      const prevSeen = this._lastDMSnapshot.get('__badge__');
      if (!prevSeen || prevSeen !== dm.text) {
        this.emit('new_dm', { count: dm.text });
        if (this._onNewDM) this._onNewDM(dm.text);
      }
    }

    this._lastDMSnapshot.set('__badge__', currentDMs[0]?.text || null);
  }

  // Auto-reply for DMs
  addAutoReply(rule) {
    this._autoReplyRules.push({
      id: Date.now(),
      match: rule.match || null,
      reply: rule.reply || null,
      enabled: true,
    });
    return this._autoReplyRules.length - 1;
  }

  removeAutoReply(index) {
    if (index >= 0 && index < this._autoReplyRules.length) {
      this._autoReplyRules.splice(index, 1);
      return true;
    }
    return false;
  }

  getAutoReplyRules() {
    return this._autoReplyRules.map((r, i) => ({
      index: i,
      match: r.match || 'any message',
      reply: r.reply || '[none]',
      enabled: r.enabled,
    }));
  }

  clearAutoReplies() {
    this._autoReplyRules = [];
  }

  // ═══════════════════════════════════════════════════════════════════
  // FOLLOW / UNFOLLOW
  // ═══════════════════════════════════════════════════════════════════

  async followUser(username) {
    this._checkLogin();

    await this.page.goto(`${IG_URL}/${username}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await this.page.waitForTimeout(2000);

    const followBtn = await this.page.$('button:has-text("Follow"):not(:has-text("Following"))');
    if (followBtn) {
      await followBtn.click();
      await this.page.waitForTimeout(1000);
      return `Now following @${username}`;
    }

    return `Could not find follow button for @${username}. You may already be following them.`;
  }

  async unfollowUser(username) {
    this._checkLogin();

    await this.page.goto(`${IG_URL}/${username}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await this.page.waitForTimeout(2000);

    const followingBtn = await this.page.$('button:has-text("Following")');
    if (followingBtn) {
      await followingBtn.click();
      await this.page.waitForTimeout(500);
      // Confirm unfollow
      const unfollowBtn = await this.page.$('button:has-text("Unfollow")');
      if (unfollowBtn) {
        await unfollowBtn.click();
        await this.page.waitForTimeout(1000);
        return `Unfollowed @${username}`;
      }
    }

    return `Could not unfollow @${username}. You may not be following them.`;
  }

  // ═══════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════

  async getNotifications(count = 10) {
    this._checkLogin();

    const notifBtn = await this.page.$('[aria-label="Notifications"], svg[aria-label="Notifications"]');
    if (!notifBtn) return 'Notifications button not found.';

    await notifBtn.click();
    await this.page.waitForTimeout(2000);

    const notifications = await this.page.evaluate((max) => {
      const items = document.querySelectorAll('[role="dialog"] div[role="button"], [role="menu"] div, [role="dialog"] a');
      return Array.from(items).slice(0, max).map(el => {
        const text = el.textContent?.trim()?.substring(0, 200) || '';
        const img = el.querySelector('img');
        return {
          text,
          hasImage: !!img,
        };
      }).filter(n => n.text.length > 5);
    }, count);

    // Close notification panel
    await this.page.click('main').catch(() => {});

    return notifications.length > 0
      ? JSON.stringify(notifications, null, 2)
      : 'No notifications found.';
  }

  // ═══════════════════════════════════════════════════════════════════
  // STATUS & DISCONNECT
  // ═══════════════════════════════════════════════════════════════════

  async getStatus() {
    return {
      connected: browserManager.isActive('instagram'),
      loggedIn: this.loggedIn,
      watching: this._watchInterval !== null,
      autoReplyRules: this._autoReplyRules.length,
      analyticsSnapshots: this._analyticsHistory.length,
      url: this.page ? await this.page.url().catch(() => null) : null,
    };
  }

  async disconnect() {
    this.stopDMWatch();
    this.clearAutoReplies();
    await browserManager.close('instagram');
    this.loggedIn = false;
    this.page = null;
    return 'Disconnected from Instagram.';
  }

  // ═══════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════

  _checkLogin() {
    if (!this.loggedIn) throw new Error('Not logged in to Instagram. Call instagram_connect first.');
    if (!this.page) throw new Error('Browser not connected. Call instagram_connect first.');
  }

  async _isLoggedIn() {
    return await this.page.evaluate(() => {
      return !!document.querySelector('svg[aria-label="Home"]') ||
             !!document.querySelector('a[href="/direct/inbox/"]') ||
             !!document.querySelector('[aria-label="New post"]');
    });
  }

  async _dismissDialog() {
    try {
      const btn = await this.page.$('button:has-text("Not Now"), button:has-text("Not now"), button:has-text("Cancel")');
      if (btn) {
        await btn.click();
        await this.page.waitForTimeout(500);
      }
    } catch {}
  }

  async _getOwnProfileData() {
    // Navigate to own profile
    const profileLink = await this.page.$('a[href*="/"][role="link"]:has(img[alt*="profile picture"])');
    if (profileLink) {
      await profileLink.click();
    } else {
      // Fallback: click the profile icon in the nav
      const navLinks = await this.page.$$('a[role="link"]');
      for (const link of navLinks) {
        const href = await link.getAttribute('href');
        if (href && href.match(/^\/[a-zA-Z0-9_.]+\/$/) && !href.includes('explore') && !href.includes('direct') && !href.includes('reels')) {
          await link.click();
          break;
        }
      }
    }
    await this.page.waitForTimeout(2000);

    return await this.page.evaluate(() => {
      const result = {};

      const h2 = document.querySelector('header h2, header h1');
      result.username = h2?.textContent?.trim() || '';

      const statEls = document.querySelectorAll('header section ul li, header ul li');
      const statsText = Array.from(statEls).map(li => li.textContent?.trim() || '');

      const parseNum = (str) => {
        if (!str) return 0;
        const match = str.match(/([\d,.]+)\s*([KkMm]?)/);
        if (!match) return 0;
        let num = parseFloat(match[1].replace(/,/g, ''));
        if (match[2].toLowerCase() === 'k') num *= 1000;
        if (match[2].toLowerCase() === 'm') num *= 1000000;
        return Math.round(num);
      };

      for (const stat of statsText) {
        const lower = stat.toLowerCase();
        if (lower.includes('post')) {
          result.posts = stat.trim();
          result.postsNum = parseNum(stat);
        } else if (lower.includes('follower') && !lower.includes('following')) {
          result.followers = stat.trim();
          result.followersNum = parseNum(stat);
        } else if (lower.includes('following')) {
          result.following = stat.trim();
          result.followingNum = parseNum(stat);
        }
      }

      result.followersNum = result.followersNum || 0;
      result.followingNum = result.followingNum || 0;
      result.postsNum = result.postsNum || 0;

      return result;
    });
  }

  /**
   * Robust: Get post links from a profile page using multiple strategies.
   */
  async _getPostLinksFromProfile(username, count = 6) {
    await this.page.goto(`${IG_URL}/${username}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await this.page.waitForTimeout(3000);

    // Scroll down slightly to trigger lazy loading of posts
    await this.page.evaluate(() => window.scrollBy(0, 400));
    await this.page.waitForTimeout(1000);

    const links = await this.page.evaluate((max) => {
      const hrefs = new Set();

      // Strategy 1: All <a> tags with /p/ or /reel/ in href (most reliable)
      document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]').forEach(a => {
        const href = a.getAttribute('href');
        if (href && (href.includes('/p/') || href.includes('/reel/'))) {
          hrefs.add(href);
        }
      });

      // Strategy 2: Images inside links (post thumbnails)
      if (hrefs.size === 0) {
        document.querySelectorAll('a[role="link"] img, div[role="button"] img').forEach(img => {
          const link = img.closest('a[href]');
          if (link) {
            const href = link.getAttribute('href');
            if (href && (href.includes('/p/') || href.includes('/reel/'))) {
              hrefs.add(href);
            }
          }
        });
      }

      return Array.from(hrefs).slice(0, max);
    }, count);

    return links;
  }

  /**
   * Robust: Navigate to a user's profile and open their nth post.
   */
  async _openPostFromProfile(username, postIndex = 0) {
    const links = await this._getPostLinksFromProfile(username, postIndex + 3);
    if (links.length === 0) {
      throw new Error(`No posts found on @${username}'s profile. Account may be private or have no posts.`);
    }
    const idx = Math.min(postIndex, links.length - 1);

    // Navigate directly to the post URL (more reliable than clicking grid items)
    await this.page.goto(`${IG_URL}${links[idx]}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await this.page.waitForTimeout(2000);
  }

  /**
   * Robust: Click the like button on the current post page.
   */
  async _clickLikeButton() {
    const result = await this.page.evaluate(() => {
      // Check if already liked
      const unlikeBtn = document.querySelector('svg[aria-label="Unlike"]');
      if (unlikeBtn) return 'already_liked';

      // Strategy 1: SVG with aria-label "Like"
      const likeBtn = document.querySelector('svg[aria-label="Like"]');
      if (likeBtn) {
        const parent = likeBtn.closest('button') || likeBtn.closest('[role="button"]') || likeBtn.parentElement;
        if (parent) { parent.click(); return 'liked'; }
      }

      // Strategy 2: Heart icon in section above comments
      const sections = document.querySelectorAll('section');
      for (const sec of sections) {
        const svg = sec.querySelector('svg[aria-label="Like"]');
        if (svg) {
          const btn = svg.closest('button') || svg.closest('[role="button"]');
          if (btn) { btn.click(); return 'liked'; }
        }
      }

      // Strategy 3: Double-click the post image to like
      const img = document.querySelector('article img[style], div[role="button"] img, img[class*="x5yr21d"]');
      if (img) {
        const dblClickEvent = new MouseEvent('dblclick', { bubbles: true, cancelable: true });
        img.dispatchEvent(dblClickEvent);
        return 'liked_dblclick';
      }

      return 'not_found';
    });

    if (result === 'already_liked') return 'Post already liked.';
    if (result === 'liked' || result === 'liked_dblclick') {
      await this.page.waitForTimeout(500);
      return 'Post liked successfully!';
    }
    return 'Could not find the like button on this post.';
  }

  async _getRecentPostEngagement(count = 6) {
    // Get post links from the current profile page
    const postLinks = await this.page.evaluate((max) => {
      const hrefs = new Set();
      document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]').forEach(a => {
        const href = a.getAttribute('href');
        if (href) hrefs.add(href);
      });
      return Array.from(hrefs).slice(0, max);
    }, count);

    const engagement = [];

    for (const href of postLinks) {
      try {
        await this.page.goto(`${IG_URL}${href}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await this.page.waitForTimeout(1500);

        const postData = await this.page.evaluate(() => {
          const data = {};

          // Likes - search all text for like counts
          const allText = document.body.querySelectorAll('span, a, button');
          for (const el of allText) {
            const text = el.textContent || '';
            // Match "123 likes", "123 others", "1,234 likes"
            if (text.match(/^[\d,]+\s*like/i) || text.match(/^[\d,]+\s*other/i) || text.match(/liked by.*and ([\d,]+) other/i)) {
              const num = text.match(/([\d,]+)/);
              if (num) { data.likes = parseInt(num[1].replace(/,/g, '')); break; }
            }
          }

          // Comments count
          for (const el of allText) {
            const text = el.textContent || '';
            const m = text.match(/view all ([\d,]+) comment/i);
            if (m) { data.comments = parseInt(m[1].replace(/,/g, '')); break; }
          }

          // Caption
          const captionEl = document.querySelector('h1, span[dir="auto"]');
          data.caption = captionEl?.textContent?.substring(0, 100) || '';

          data.likes = data.likes || 0;
          data.comments = data.comments || 0;
          return data;
        });

        engagement.push(postData);
        await this.page.waitForTimeout(500);
      } catch {
        // Skip posts that fail to load
      }
    }

    // Navigate back to the profile
    await this.page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await this.page.waitForTimeout(500);

    return engagement;
  }

  _calculateGrowth() {
    if (this._analyticsHistory.length < 2) {
      return { followers: null, following: null, posts: null, message: 'Need at least 2 snapshots for growth data. Run analytics again later.' };
    }

    const latest = this._analyticsHistory[this._analyticsHistory.length - 1];
    const previous = this._analyticsHistory[this._analyticsHistory.length - 2];

    return {
      followers: latest.followers - previous.followers,
      following: latest.following - previous.following,
      posts: latest.posts - previous.posts,
      period: `${new Date(previous.date).toLocaleDateString()} → ${new Date(latest.date).toLocaleDateString()}`,
    };
  }
}

export const instagramClient = new InstagramClient();
