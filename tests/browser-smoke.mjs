import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const appUrl = process.env.BROWSER_URL || "http://localhost:3100";
const screenshotDir = process.env.SCREENSHOT_DIR;
const debuggingPort = 9223;
const chromePath = process.env.CHROME_PATH || [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find(existsSync);

assert.ok(chromePath, "Chrome or Edge is required for browser smoke checks");

const profile = mkdtempSync(join(tmpdir(), "satrio-portfolio-"));
const browser = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  `--remote-debugging-port=${debuggingPort}`,
  `--user-data-dir=${profile}`,
  "about:blank",
], { stdio: "ignore", windowsHide: true });

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const saveScreenshot = (name, data) => {
  if (!screenshotDir) return;
  mkdirSync(screenshotDir, { recursive: true });
  writeFileSync(join(screenshotDir, name), Buffer.from(data, "base64"));
};

async function waitForBrowser() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debuggingPort}/json/version`);
      if (response.ok) return;
    } catch {
      // Chrome is still starting.
    }
    await sleep(100);
  }
  throw new Error("Chrome DevTools endpoint did not start");
}

let socket;
let closeBrowser;

try {
  await waitForBrowser();
  const target = await fetch(
    `http://127.0.0.1:${debuggingPort}/json/new?${encodeURIComponent(appUrl)}`,
    { method: "PUT" },
  ).then((response) => response.json());

  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let commandId = 0;
  const pending = new Map();
  const runtimeErrors = [];

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown") {
      runtimeErrors.push(message.params.exceptionDetails.text);
    }
  });

  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++commandId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  closeBrowser = () => cdp("Browser.close");

  const evaluate = async (expression) => {
    const response = await cdp("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
    return response.result.value;
  };

  const navigate = async () => {
    await cdp("Page.navigate", { url: appUrl });
    for (let attempt = 0; attempt < 50; attempt += 1) {
      if (await evaluate("document.readyState === 'complete'")) break;
      await sleep(100);
    }
    await sleep(500);
  };

  await cdp("Page.enable");
  await cdp("Runtime.enable");
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await navigate();

  assert.equal(await evaluate("document.title"), "Satrio Nugroho");
  assert.equal(await evaluate("document.querySelector('h1').innerText.includes('Satrio Nugroho')"), true);
  assert.equal(await evaluate("document.querySelectorAll('details.experience-item').length"), 7);
  assert.equal(await evaluate("document.querySelector('link[rel=canonical]').href"), "https://satrionugroho.com/");
  assert.equal(await evaluate("JSON.parse(document.querySelector('script[type=\"application/ld+json\"]').textContent)['@type']"), "Person");
  assert.equal(await evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"), true);
  assert.equal(await evaluate("fetch('/assets/documents/Satrio-Nugroho-CV.pdf').then(r => r.ok)"), true);
  const desktopScreenshot = (await cdp("Page.captureScreenshot", { format: "png" })).data;
  assert.equal(desktopScreenshot.length > 1000, true);
  saveScreenshot("portfolio-desktop.png", desktopScreenshot);
  if (screenshotDir) {
    await evaluate("document.documentElement.style.scrollBehavior = 'auto'");
    for (const section of ["about", "experience", "projects", "contact"]) {
      await evaluate(`document.getElementById('${section}').scrollIntoView()`);
      await sleep(700);
      saveScreenshot(
        `portfolio-${section}.png`,
        (await cdp("Page.captureScreenshot", { format: "png" })).data,
      );
    }
    await evaluate("window.scrollTo(0, 0)");
    await evaluate("document.documentElement.style.removeProperty('scroll-behavior')");
  }

  await evaluate("document.querySelectorAll('.lang-btn')[1].click()");
  await sleep(100);
  assert.equal(await evaluate("document.documentElement.lang"), "id");
  assert.equal(await evaluate("document.getElementById('about-title').textContent"), "Tentang Saya");
  assert.equal(await evaluate("localStorage.getItem('portfolio-lang')"), "id");

  await cdp("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await navigate();
  saveScreenshot(
    "portfolio-mobile.png",
    (await cdp("Page.captureScreenshot", { format: "png" })).data,
  );
  const mobileOverflow = await evaluate(`(() => {
    const width = document.documentElement.clientWidth;
    return {
      width,
      scrollWidth: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll('body *')]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return { tag: element.tagName, className: element.className, left: rect.left, right: rect.right, width: rect.width };
        })
        .filter((rect) => rect.left < -1 || rect.right > width + 1)
        .slice(0, 12),
    };
  })()`);
  assert.equal(mobileOverflow.scrollWidth <= mobileOverflow.width, true, JSON.stringify(mobileOverflow));
  assert.equal(await evaluate("document.getElementById('primaryNav').getAttribute('aria-hidden')"), "true");
  assert.equal(await evaluate("document.querySelector('.nav-link').tabIndex"), -1);

  const ossLayout = await evaluate(`(() => {
    const card = document.querySelector('.project-card-wide');
    const visual = card.querySelector('.project-visual').getBoundingClientRect();
    const media = card.querySelector('.project-media').getBoundingClientRect();
    const body = card.querySelector('.project-body').getBoundingClientRect();
    return {
      visualHeight: visual.height,
      mediaHeight: media.height,
      mediaWidth: media.width,
      visualBottom: visual.bottom,
      bodyTop: body.top,
      description: card.querySelector('.project-body p').textContent.trim(),
    };
  })()`);
  assert.equal(Math.abs((ossLayout.mediaWidth / ossLayout.mediaHeight) - (16 / 9)) < 0.03, true, JSON.stringify(ossLayout));
  assert.equal(Math.abs(ossLayout.visualHeight - ossLayout.mediaHeight) < 2, true, JSON.stringify(ossLayout));
  assert.equal(Math.abs(ossLayout.bodyTop - ossLayout.visualBottom) < 2, true, JSON.stringify(ossLayout));
  assert.equal(ossLayout.description.length > 30, true, JSON.stringify(ossLayout));
  await evaluate("document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.project-card-wide').scrollIntoView({ block: 'center' })");
  await sleep(200);
  saveScreenshot(
    "portfolio-mobile-oss.png",
    (await cdp("Page.captureScreenshot", { format: "png" })).data,
  );

  assert.equal(await evaluate("document.querySelectorAll('.project-media-duo').length"), 2);
  assert.equal(await evaluate(`[
    ...document.querySelectorAll('.project-media-duo'),
  ].every((track) => track.scrollWidth > track.clientWidth)`), true);
  assert.equal(await evaluate(`[
    ...document.querySelectorAll('.project-media-duo > a'),
  ].every((link) => link.target === '_blank' && link.href.includes('/assets/images/projects/'))`), true);

  await evaluate("document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.project-media-duo').scrollIntoView({ block: 'center' })");
  const gallery = await evaluate(`(() => {
    const track = document.querySelector('.project-media-duo');
    const rect = track.getBoundingClientRect();
    return {
      clientWidth: track.clientWidth,
      scrollWidth: track.scrollWidth,
      startX: rect.right - 36,
      endX: rect.left + 36,
      y: rect.top + rect.height / 2,
    };
  })()`);
  assert.equal(gallery.scrollWidth > gallery.clientWidth, true, JSON.stringify(gallery));
  await cdp("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: gallery.startX, y: gallery.y }],
  });
  for (let step = 1; step <= 4; step += 1) {
    await cdp("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{
        x: gallery.startX + ((gallery.endX - gallery.startX) * step) / 4,
        y: gallery.y,
      }],
    });
  }
  await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(350);
  assert.equal(await evaluate("document.querySelector('.project-media-duo').scrollLeft > 20"), true);
  assert.equal(await evaluate("document.querySelector('.project-gallery-controls > span').textContent.trim()"), "2 / 2");
  saveScreenshot(
    "portfolio-mobile-gallery.png",
    (await cdp("Page.captureScreenshot", { format: "png" })).data,
  );

  await evaluate("document.querySelectorAll('.project-media-duo')[1].scrollIntoView({ block: 'center' })");
  await sleep(100);
  await evaluate("document.querySelectorAll('.project-gallery-controls button:last-of-type')[1].click()");
  await sleep(350);
  assert.equal(await evaluate(`(() => {
    const track = document.querySelectorAll('.project-media-duo')[1];
    return track.scrollLeft > track.clientWidth / 2;
  })()`), true);
  assert.equal(await evaluate("document.querySelectorAll('.project-gallery-controls > span')[1].textContent.trim()"), "2 / 2");
  await evaluate("window.scrollTo(0, 0); document.documentElement.style.removeProperty('scroll-behavior')");

  await evaluate("document.querySelector('.menu-toggle').click()");
  await sleep(320);
  assert.equal(await evaluate("document.body.classList.contains('nav-open')"), true);
  assert.equal(await evaluate("document.querySelector('.menu-toggle').getAttribute('aria-expanded')"), "true");
  const menuFocus = await evaluate(`(() => {
    const link = document.querySelector('.nav-link');
    return {
      isFirstLink: document.activeElement === link,
      activeTag: document.activeElement?.tagName,
      activeClass: document.activeElement?.className,
      navVisibility: getComputedStyle(document.getElementById('primaryNav')).visibility,
      linkTabIndex: link.tabIndex,
    };
  })()`);
  assert.equal(menuFocus.isFirstLink, true, JSON.stringify(menuFocus));
  assert.equal(await evaluate(`(() => {
    const link = document.querySelector('.nav-link');
    const rect = link.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit === link || link.contains(hit);
  })()`), true);
  saveScreenshot(
    "portfolio-mobile-menu.png",
    (await cdp("Page.captureScreenshot", { format: "png" })).data,
  );
  const navLinkPoint = await evaluate(`(() => {
    const rect = document.querySelector('.nav-link[href="#about"]').getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  await cdp("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [navLinkPoint],
  });
  await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(200);
  assert.equal(await evaluate("location.hash"), "#about");
  assert.equal(await evaluate("document.body.classList.contains('nav-open')"), false);

  await evaluate("document.querySelector('.menu-toggle').click()");
  await sleep(320);
  await evaluate("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
  await sleep(100);
  assert.equal(await evaluate("document.body.classList.contains('nav-open')"), false);
  assert.equal(await evaluate("document.activeElement === document.querySelector('.menu-toggle')"), true);

  await evaluate("document.querySelector('.menu-toggle').click()");
  await sleep(320);
  assert.equal(await evaluate("document.elementFromPoint(20, 400).classList.contains('nav-overlay')"), true);
  await cdp("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 20, y: 400 }],
  });
  await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(100);
  assert.equal(await evaluate("document.body.classList.contains('nav-open')"), false);

  await evaluate("document.querySelectorAll('details.experience-item')[1].querySelector('summary').click()");
  assert.equal(await evaluate("document.querySelectorAll('details.experience-item')[1].open"), true);
  await evaluate("document.getElementById('experience').scrollIntoView({ block: 'center' })");
  await sleep(500);
  assert.equal(await evaluate("document.querySelector('.nav-link[href=\"#experience\"]').classList.contains('active')"), true);

  await cdp("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await navigate();
  assert.equal(await evaluate("document.querySelectorAll('.reveal-ready').length"), 0);
  assert.deepEqual(runtimeErrors, []);

  console.log("Desktop, mobile, interaction, accessibility, and reduced-motion browser checks passed");
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    try {
      await closeBrowser?.();
    } catch {
      browser.kill();
    }
    socket.close();
  }
  if (browser.exitCode === null) {
    await Promise.race([
      new Promise((resolve) => browser.once("exit", resolve)),
      sleep(2000),
    ]);
  }
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      rmSync(profile, { recursive: true, force: true });
      break;
    } catch (error) {
      if (error.code !== "EBUSY" || attempt === 4) throw error;
      await sleep(200);
    }
  }
}
