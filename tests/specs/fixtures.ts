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
      headless: true,    
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

    let serviceWorker = context.serviceWorkers()[0];

    console.log(`Checking service worker (sw): ${serviceWorker}`);

    if (!serviceWorker) {
      console.log('Waiting for service worker (sw)...');
      try {
        // 1. Attempt a brief wait for the native event
        serviceWorker = await context.waitForEvent('serviceworker', { timeout: 2000 });
      } catch {
        // 2. Immediate check if it populated right after the timeout threw
        serviceWorker = context.serviceWorkers()[0];
      }
    }

    // 3. CircleCI Fallback: Force a restart via CDP if the worker is still stubbornly missing
    if (!serviceWorker) {
      console.log('SW not found under CI load. Forcing CDP container kickstart...');
      try {
        const page = await context.newPage();
        const client = await context.newCDPSession(page);
        
        // Query active targets to find the background extension worker
        const targets = await client.send('Target.getTargets');
        const swTarget = targets.targetInfos.find(t => t.type === 'service_worker');
        
        if (swTarget) {
          // Forcefully restart the service worker target to trigger Playwright's listener
          await client.send('ServiceWorker.stopWorker', { versionId: swTarget.targetId });
        }
        
        // Give it a final window to catch the restart event
        serviceWorker = await context.waitForEvent('serviceworker', { timeout: 5000 });
      } catch (cdpError) {
        console.error('CDP kickstart failed: ', cdpError);
      }
    }

    if (!serviceWorker) {
      throw new Error('Fatal: Manifest V3 Service Worker failed to mount in CI context.');
    }    

    // let [serviceWorker] = context.serviceWorkers();

    // console.log(`Checking service worker (sw): ${serviceWorker}`);

    // if (!serviceWorker) {
    //   console.log('Waiting for service worker (sw)...');
    //   serviceWorker = await context.waitForEvent('serviceworker');
    //   console.log('Got service worker (sw).');
    // }

    // console.log(`Using service worker (sw): ${serviceWorker}`);

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
