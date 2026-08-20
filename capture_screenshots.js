const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const pages = [
  'activity-logs.html',
  'entities.html',
  'general-report.html',
  'index.html',
  'jobs-applications.html',
  'notification-preferences.html',
  'report-recipients.html',
  'skill-gap.html',
  'supported-countries.html',
  'tenant-branding.html',
  'users-management.html'
];

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }
  
  for (const p of pages) {
    const fileUrl = 'file://' + path.join(__dirname, p);
    console.log(`Capturing ${p}...`);
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    // Wait a bit for animations/fonts to settle
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(__dirname, 'screenshots', p.replace('.html', '.png')), fullPage: true });
  }
  
  await browser.close();
  console.log('Done!');
}

capture().catch(console.error);
