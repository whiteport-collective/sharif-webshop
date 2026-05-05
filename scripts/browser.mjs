#!/usr/bin/env node
/**
 * browser.mjs — Puppeteer control script for Claude Code
 *
 * Connects to an already-running Chrome with remote debugging,
 * or launches Chrome with your real profile (so you're logged into Google etc).
 *
 * Usage:
 *   node scripts/browser.mjs screenshot https://example.com
 *   node scripts/browser.mjs navigate https://example.com
 *   node scripts/browser.mjs click "button[type=submit]"
 *   node scripts/browser.mjs type "input[name=email]" "hello@example.com"
 *   node scripts/browser.mjs wait 2000
 *   node scripts/browser.mjs eval "document.title"
 *
 * To start Chrome with remote debugging (run once in a terminal):
 *   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir=C:\tmp\chrome-debug
 *
 * Screenshots are saved to: C:\tmp\browser-screenshots\
 */

import { createRequire } from "module"
const require = createRequire(import.meta.url)
const puppeteer = require("C:/Users/marte/AppData/Roaming/npm/node_modules/puppeteer")
import { writeFileSync, mkdirSync } from "fs"
import { join } from "path"
import { homedir } from "os"

const REMOTE_DEBUGGING_URL = "http://localhost:9222"
const SCREENSHOT_DIR = "C:\\tmp\\browser-screenshots"
const CHROME_PATH =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"

async function connect() {
  try {
    const browser = await puppeteer.connect({
      browserURL: REMOTE_DEBUGGING_URL,
      defaultViewport: null,
    })
    console.error(`[browser] Connected to existing Chrome at ${REMOTE_DEBUGGING_URL}`)
    return { browser, shouldClose: false }
  } catch {
    console.error("[browser] No Chrome with remote debugging found. Launching fresh Chrome...")
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: false,
      defaultViewport: null,
      args: [
        "--remote-debugging-port=9222",
        "--no-first-run",
        "--no-default-browser-check",
      ],
      userDataDir: "C:\\tmp\\chrome-debug",
    })
    console.error("[browser] Chrome launched. Will stay open after script ends.")
    return { browser, shouldClose: false }
  }
}

async function getActivePage(browser) {
  const pages = await browser.pages()
  return pages[pages.length - 1] ?? (await browser.newPage())
}

async function screenshot(page, label = "screenshot") {
  mkdirSync(SCREENSHOT_DIR, { recursive: true })
  const filename = `${Date.now()}-${label.replace(/[^a-z0-9]/gi, "-")}.png`
  const filepath = join(SCREENSHOT_DIR, filename)
  await page.screenshot({ path: filepath, fullPage: false })
  console.log(`screenshot:${filepath}`)
  return filepath
}

async function run(command, args) {
  const { browser, shouldClose } = await connect()
  const page = await getActivePage(browser)

  try {
    switch (command) {
      case "screenshot": {
        if (args[0]) await page.goto(args[0], { waitUntil: "networkidle2", timeout: 30000 })
        const path = await screenshot(page, args[0] ?? "current")
        console.log(`Saved: ${path}`)
        break
      }

      case "navigate": {
        const url = args[0]
        if (!url) throw new Error("navigate requires a URL")
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 })
        console.log(`Navigated to: ${url}`)
        await screenshot(page, url)
        break
      }

      case "click": {
        const selector = args[0]
        if (!selector) throw new Error("click requires a CSS selector")
        await page.waitForSelector(selector, { timeout: 10000 })
        await page.click(selector)
        console.log(`Clicked: ${selector}`)
        await page.waitForNetworkIdle({ idleTime: 1000 }).catch(() => {})
        await screenshot(page, `after-click`)
        break
      }

      case "type": {
        const [selector, text] = args
        if (!selector || text === undefined) throw new Error("type requires selector and text")
        await page.waitForSelector(selector, { timeout: 10000 })
        await page.click(selector, { clickCount: 3 })
        await page.type(selector, text)
        console.log(`Typed into: ${selector}`)
        await screenshot(page, `after-type`)
        break
      }

      case "wait": {
        const ms = parseInt(args[0] ?? "1000", 10)
        await new Promise((r) => setTimeout(r, ms))
        await screenshot(page, "after-wait")
        break
      }

      case "eval": {
        const script = args[0]
        if (!script) throw new Error("eval requires a JS expression")
        const result = await page.evaluate(script)
        console.log(`Result: ${JSON.stringify(result)}`)
        break
      }

      case "url": {
        console.log(`Current URL: ${page.url()}`)
        break
      }

      default:
        console.error(`Unknown command: ${command}`)
        console.error("Commands: screenshot, navigate, click, type, wait, eval, url")
        process.exit(1)
    }
  } finally {
    if (shouldClose) await browser.close()
  }
}

const [, , command = "screenshot", ...args] = process.argv

run(command, args).catch((err) => {
  console.error(`[browser] Error: ${err.message}`)
  process.exit(1)
})
