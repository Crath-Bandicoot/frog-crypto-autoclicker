// frogClicker.ts
// This script automates clicking buttons on a specific website when they become available.
// Users must provide their own login details and are responsible for the use of this script.

import { chromium, Page } from "playwright";

const loginUrl = "https://zupass.org/#/login";
const secondDivSelector = "div.sc-bhqpjJ.byyOfH";
const buttonToClickText = /^search /i;
const loggedInIndicator = "div.sc-iHbSHJ";

// Hardcoded list of user emails and passwords
const accounts = [
  { email: "user1@example.com", password: "password1" },
  { email: "user2@example.com", password: "password2" },
  // ... add more accounts as needed, upper limit not tested.
];

async function login(page: Page, email: string, password: string) {
  await page.goto(loginUrl, { waitUntil: "domcontentloaded" });
  await page.fill('input[placeholder="email address"]', email);
  await page.click('button[type="submit"]:has-text("Continue")');
  await page.waitForSelector('input[type="password"]', { state: "visible" });
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]:has-text("Login")');
  await page.waitForSelector(loggedInIndicator, { timeout: 10000 });
  console.log(`Login successful for ${email}`);
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
  const pollingInterval = 30000;
  setInterval(async () => {
    await clickButtonIfReady(page);
  }, pollingInterval);
}

async function handleAccount(account: { email: string; password: string }) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await login(page, account.email, account.password);

  page.on("console", (message) =>
    console.log(`Browser console log: ${message.text()}`)
  );
  page.on("response", async (response) => {
    if (response.status() === 403) {
      console.log(`Request failed with status 403: ${response.url()}`);
    }
  });

  await navigateToButtonPage(page);
  await pollForButtonToBeReady(page);
}
async function main() {
  // Start handling each account in a separate browser instance
  await Promise.all(accounts.map(handleAccount));
}

main().catch((err) => console.error("Unhandled error:", err));
