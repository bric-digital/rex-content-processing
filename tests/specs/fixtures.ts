// @ts-nocheck

import { test as base, chromium, type BrowserContext } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url';

export const test = base.extend<{
  context: BrowserContext
  extensionId: string,
  serviceWorker:ServiceWorker,
}>({
  context: async ({ }, use) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const pathToExtension = path.join(__dirname, '../extension')

    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    use(context)
      .then(() => {
        setTimeout(() => {
          context.close();
        }, 10000)
    })
  },
  extensionId: async ({ context }, use) => {
    // for manifest v3:
    let [serviceWorker] = context.serviceWorkers();

    if (!serviceWorker) {
      console.log('Waiting for service worker (id)...');
      serviceWorker = await context.waitForEvent('serviceworker');
      console.log('Got service worker (id).');
    }

    const extensionId = serviceWorker.url().split('/')[2];
    await use(extensionId);
  },
  serviceWorker: async ({ context }, use) => {
    context.on('console', msg => {
      console.log(msg);
    })

    let [serviceWorker] = context.serviceWorkers();

    console.log(`Checking service worker (sw): ${serviceWorker}`);

    if (!serviceWorker) {
      console.log('Waiting for service worker (sw)...');
      serviceWorker = await context.waitForEvent('serviceworker');
      console.log('Got service worker (sw).');
    }

    console.log(`Using service worker (sw): ${serviceWorker}`);

    use(serviceWorker)
      .then(() => {
        setTimeout(() => {
          console.log('Closing service worker...');
          context.close();
        }, 10000)
    })
  },
});

export const expect = test.expect;
