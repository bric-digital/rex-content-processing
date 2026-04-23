// @ts-nocheck

import { test, expect } from './fixtures.js';

test.describe('REX Content Processing', () => {
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
                  'Service Worker: My e-mail address is test@example.com.'
                ],
                'open_redaction*': 'Service Worker: 654-23-2352 is the number you asked for.',
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
            'open_redaction*': 'Service Worker: [SSN_*] is the number you asked for.',
            'regexp*': {
              'español': 'Service Worker: hola world',
              'numbers': 'Service Worker: ABC *** said The Count!'
            },
            'sanitize_pii*': [
              'Service Worker: My phone number is [Redacted: phone_number].',
              'Service Worker: My e-mail address is [EMAIL_*].'
            ]
          })

          resolve()
        })
      }, 2500)
    })
  })
})
