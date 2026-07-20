import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file:///workspaces/money_basics/glossary/glossary_of_financial_terms.html', {
  waitUntil: 'networkidle',
});
await page.pdf({
  path: 'glossary/glossary_of_financial_terms.pdf',
  format: 'Letter',
  printBackground: true,
});
await browser.close();
