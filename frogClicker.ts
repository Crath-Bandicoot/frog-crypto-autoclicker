// frogClicker.ts
// This script automates clicking buttons on a specific website when they become available.
// Users must provide their own login details and are responsible for the use of this script.

import { chromium, Page } from "playwright";
import "dotenv/config";

const userEmail = process.env.USER_EMAIL || "your-email@example.com"; // Set your email here or as an environment variable
const userPassword = process.env.USER_PASSWORD || "your-password"; // Set your password here or as an environment variable
const loginUrl = "https://zupass.org/#/login";
const secondDivSelector = "div.sc-bhqpjJ.byyOfH";
const buttonToClickText = /^search /i;
const loggedInIndicator = "div.sc-iHbSHJ";

async function login(page: Page) {
  await page.goto(loginUrl, { waitUntil: "domcontentloaded" });
  await page.fill('input[placeholder="email address"]', userEmail);
  await page.click('button[type="submit"]:has-text("Continue")');
  await page.waitForSelector('input[type="password"]', { state: "visible" });
  await page.fill('input[type="password"]', userPassword);
  await page.click('button[type="submit"]:has-text("Login")');
  await page.waitForSelector(loggedInIndicator, { timeout: 10000 });
  console.log("Login successful - logged-in element found");
}

async function navigateToButtonPage(page: Page) {
  await page.waitForSelector(secondDivSelector);
  await page.click(`${secondDivSelector}:nth-of-type(2)`);
  console.log("Navigated to the button page.");
}

async function isButtonReady(button: any): Promise<boolean> {
  const isDisabled = await button.isDisabled();
  const isVisible = await button.isVisible();
  return !isDisabled && isVisible;
}

async function clickButtonIfReady(page: Page) {
  const buttons = await page.$$("button");
  for (const button of buttons) {
    const buttonText = await button.textContent();
    if (buttonText && buttonToClickText.test(buttonText)) {
      const isReady = await isButtonReady(button);
      if (isReady) {
        console.log(`Button "${buttonText.trim()}" is ready. Clicking now...`);
        await button.click();
        console.log(`Clicked button with text: "${buttonText.trim()}"`);
      } else {
        console.log(`Button "${buttonText.trim()}" is not ready yet.`);
      }
    }
  }
}

async function pollForButtonToBeReady(page: Page) {
  const pollingInterval = 5000;
  setInterval(async () => {
    await clickButtonIfReady(page);
  }, pollingInterval);
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  page.on("console", (message) =>
    console.log(`Browser console log: ${message.text()}`)
  );
  page.on("response", async (response) => {
    if (response.status() === 403) {
      console.log(`Request failed with status 403: ${response.url()}`);
    }
  });

  await login(page);
  await navigateToButtonPage(page);
  await pollForButtonToBeReady(page);
}

main().catch((err) => console.error("Unhandled error:", err));
