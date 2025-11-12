const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Listen for console logs
  page.on('console', msg => {
    console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  // Listen for request failures
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  // Listen for response errors
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('HTTP ERROR:', response.status(), response.url());
    }
  });

  try {
    console.log('Navigating to dashboard...');
    await page.goto('http://localhost:8082/dashboard', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('Page loaded, waiting for React to render...');
    await page.waitForTimeout(5000);

    // Check if any loading indicators are present
    const loadingElements = await page.$$('[data-testid="page-loader"], .animate-spin');
    console.log('Found loading elements:', loadingElements.length);

    // Check if dashboard content is present
    const dashboardContent = await page.$('[data-testid="dashboard-content"], main, .dashboard');
    console.log('Dashboard content found:', !!dashboardContent);

    // Get the page title and current URL
    const title = await page.title();
    const url = await page.url();
    console.log('Page title:', title);
    console.log('Current URL:', url);

    // Take a screenshot for analysis
    await page.screenshot({ path: 'dashboard-debug.png', fullPage: true });
    console.log('Screenshot saved as dashboard-debug.png');

  } catch (error) {
    console.error('Error during debugging:', error);
  } finally {
    setTimeout(async () => {
      await browser.close();
    }, 10000); // Keep browser open for 10 seconds for manual inspection
  }
})();