// @ts-nocheck

import { test, expect } from './fixtures';

test('Processing though service worker', async ({serviceWorker}) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      serviceWorker.evaluate(async () => {
        return new Promise<any>((testResolve) => {
          self.rexCorePlugin.handleMessage({
            messageType: 'processContent',
            content: {
              'regexp*': {
                'español': 'Service Worker: hello world',
                'numbers': 'Service Worker: ABC 123 said The Count!'
              },
              'sanitize_pii*': [
                'Service Worker: My phone number is 903-576-8867.',
                'Service Worker: My IP address is 127.0.0.1.',
                'Service Worker: My mailing address is PO Box 123.'
              ],
              'no_processing': [
                'Service Worker: My phone number is 576-903-8867.',
                'Service Worker: My e-mail address is cleartext@example.com.',
                'hello there!',
                'Service Worker: 244-65-2352 is the number you asked for.'
              ],
            }
          }, this, (response:any) => {
            testResolve(response)
          })
        })
      })
      .then((workerResponse) => {
        expect(workerResponse).toEqual({
          'no_processing': [
            'Service Worker: My phone number is 576-903-8867.',
            'Service Worker: My e-mail address is cleartext@example.com.',
            'hello there!',
            'Service Worker: 244-65-2352 is the number you asked for.'
          ],
          'regexp*': {
            'español': 'Service Worker: hola world',
            'numbers': 'Service Worker: ABC *** said The Count!'
          },
          'sanitize_pii*': [
            'Service Worker: My phone number is [Redacted: phone_number].',
            'Service Worker: My IP address is [Redacted: ip_address].',
            'Service Worker: My mailing address is [Redacted: po_box].'
          ]
        })

        resolve()
      })
    }, 2500)
  })
})
