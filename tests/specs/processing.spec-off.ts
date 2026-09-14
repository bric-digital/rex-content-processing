import { test, expect } from '@playwright/test';
import { REXContentProcessor, REXContentProcessorManager } from '@bric/rex-content-processing/library'
import { REXRegexpContentProcessor, REXSanitizePIIContentProcessor } from '@bric/rex-content-processing/processors'

test.describe('REX Content Processors', () => {
  test('Null Content Processor', async ({ page }) => {
    const nullProcessor = new REXContentProcessor()
    nullProcessor.enable()

    REXContentProcessorManager.getInstance().processContent({foo: 'bar'})
      .then((processed) => {
        expect(processed).toEqual({foo: 'bar'})
      })

    REXContentProcessorManager.getInstance().processContent({abc: [1, 2, 3]})
      .then((processed) => {
        expect(processed).toEqual({abc: [1, 2, 3]})
      })

    nullProcessor.disable()
  });

  test('Regular Expression Content Processor', async ({ page }) => {
    const regexpProcessor = new REXRegexpContentProcessor()
    regexpProcessor.enable()

    regexpProcessor.updateConfiguration({
      regexp: [{
          pattern: 'hello',
          replacement: 'hi',
      }, {
          pattern: '[0-9]',
          replacement: 'x',
      }]
    })

    REXContentProcessorManager.getInstance().processContent({foo: 'bar'})
      .then((processed) => {
        expect(processed).toEqual({foo: 'bar'})
      })

    REXContentProcessorManager.getInstance().processContent({abc: [1, 2, 3]})
      .then((processed) => {
        expect(processed).toEqual({abc: [1, 2, 3]})
      })

    REXContentProcessorManager.getInstance().processContent({test: 'hello world'})
      .then((processed) => {
        expect(processed).toEqual({test: 'hello world'})
      })

    REXContentProcessorManager.getInstance().processContent({'test*': 'hello world'})
      .then((processed) => {
        expect(processed).toEqual({'test*': 'hi world'})
      })

    REXContentProcessorManager.getInstance().processContent({'test*': ['hello world']})
      .then((processed) => {
        expect(processed).toEqual({'test*': ['hi world']})
      })

    REXContentProcessorManager.getInstance().processContent({'test*': ['abc123']})
      .then((processed) => {
        expect(processed).toEqual({'test*': ['abcxxx']})
      })

      regexpProcessor.disable()
  });

  test('Sanitize PII Content Processor', async ({ page }) => {
    const sanitizeProcessor = new REXSanitizePIIContentProcessor()
    sanitizeProcessor.enable()

    REXContentProcessorManager.getInstance().processContent({foo: 'bar'})
      .then((processed) => {
        expect(processed).toEqual({foo: 'bar'})
      })

    REXContentProcessorManager.getInstance().processContent({abc: [1, 2, 3]})
      .then((processed) => {
        expect(processed).toEqual({abc: [1, 2, 3]})
      })

    REXContentProcessorManager.getInstance().processContent({test: 'hello world'})
      .then((processed) => {
        expect(processed).toEqual({test: 'hello world'})
      })

    REXContentProcessorManager.getInstance().processContent({'test*': 'hello world'})
      .then((processed) => {
        expect(processed).toEqual({'test*': 'hello world'})
      })

    REXContentProcessorManager.getInstance().processContent({'test*': ['hello world']})
      .then((processed) => {
        expect(processed).toEqual({'test*': ['hello world']})
      })

    REXContentProcessorManager.getInstance().processContent({'test*': ['abc123']})
      .then((processed) => {
        expect(processed).toEqual({'test*': ['abc123']})
      })

    REXContentProcessorManager.getInstance().processContent({test: ['My phone number is 555-666-9999!']})
      .then((processed) => {
        expect(processed).toEqual({test: ['My phone number is 555-666-9999!']})
      })

    REXContentProcessorManager.getInstance().processContent({'test*': ['My phone number is 555-666-9999!']})
      .then((processed) => {
        expect(processed).toEqual({'test*': ['My phone number is [Redacted: phone_number]!']})
      })

    REXContentProcessorManager.getInstance().processContent({test: ['There\'s no place like 127.0.0.1.']})
      .then((processed) => {
        expect(processed).toEqual({test: ['There\'s no place like 127.0.0.1.']})
      })

    REXContentProcessorManager.getInstance().processContent({'test*': ['There\'s no place like 127.0.0.1.']})
      .then((processed) => {
        expect(processed).toEqual({'test*': ['There\'s no place like [Redacted: ip_address].']})
      })

    REXContentProcessorManager.getInstance().processContent({'test*': {message: 'There\'s no place like 127.0.0.1.'}})
      .then((processed) => {
        expect(processed).toEqual({'test*': {message: 'There\'s no place like [Redacted: ip_address].'}})
      })

      sanitizeProcessor.disable()
  });
});
