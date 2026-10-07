import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('file:///E:/antigravity项目/资讯前端/THEME_3_CANDIDATES_SHOWCASE.html');
  await page.evaluate(() => window.openHoloDossier(1));

  for (let i = 0; i <= 10; i++) {
    await new Promise(r => setTimeout(r, 150));
    const info = await page.evaluate(() => {
      const s = document.getElementById('holo-modal-score');
      const cards = document.querySelectorAll('.holo-section-card-3d');
      const texts = Array.from(cards).map(c => c.querySelector('.holo-body-floating')?.innerText?.length || 0);
      const classes = Array.from(cards).map(c => c.className);
      return { score: s?.innerText, texts, classes };
    });
    console.log(`t = ${i * 150}ms:`, JSON.stringify(info));
  }
  await browser.close();
}

run().catch(console.error);
