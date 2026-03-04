import { test, expect } from '@playwright/test';
import { REXContentProcessor, REXContentProcessorManager } from '@bric/rex-content-processing/library'
import {
  REXRegexpContentProcessor,
  REXSanitizePIIContentProcessor
} from '@bric/rex-content-processing/processors'

test.describe('REX Content Processors', () => {
  test('Null Content Processor', async ({ page }) => {
    const nullProcessor = new REXContentProcessor()
    nullProcessor.enable()

    let processed = await REXContentProcessorManager.getInstance().processContent({foo: 'bar'})
    expect(processed).toEqual({foo: 'bar'})

    processed = await REXContentProcessorManager.getInstance().processContent({abc: [1, 2, 3]})
    expect(processed).toEqual({abc: [1, 2, 3]})

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

    let processed = await REXContentProcessorManager.getInstance().processContent({foo: 'bar'})
    expect(processed).toEqual({foo: 'bar'})

    processed = await REXContentProcessorManager.getInstance().processContent({abc: [1, 2, 3]})
    expect(processed).toEqual({abc: [1, 2, 3]})

    processed = await REXContentProcessorManager.getInstance().processContent({test: 'hello world'})
    expect(processed).toEqual({test: 'hello world'})

    processed = await REXContentProcessorManager.getInstance().processContent({'test*': 'hello world'})
    expect(processed).toEqual({'test*': 'hi world'})

    processed = await REXContentProcessorManager.getInstance().processContent({'test*': ['hello world']})
    expect(processed).toEqual({'test*': ['hi world']})

    processed = await REXContentProcessorManager.getInstance().processContent({'test*': ['abc123']})
    expect(processed).toEqual({'test*': ['abcxxx']})

      regexpProcessor.disable()
  });

  test('Sanitize PII Content Processor', async ({ page }) => {
    const sanitizeProcessor = new REXSanitizePIIContentProcessor()
    sanitizeProcessor.enable()

    let processed = await REXContentProcessorManager.getInstance().processContent({foo: 'bar'})
    expect(processed).toEqual({foo: 'bar'})

    processed = await REXContentProcessorManager.getInstance().processContent({abc: [1, 2, 3]})
    expect(processed).toEqual({abc: [1, 2, 3]})

    processed = await REXContentProcessorManager.getInstance().processContent({test: 'hello world'})
    expect(processed).toEqual({test: 'hello world'})

    processed = await REXContentProcessorManager.getInstance().processContent({'test*': 'hello world'})
    expect(processed).toEqual({'test*': 'hello world'})

    processed = await REXContentProcessorManager.getInstance().processContent({'test*': ['hello world']})
    expect(processed).toEqual({'test*': ['hello world']})

    processed = await REXContentProcessorManager.getInstance().processContent({'test*': ['abc123']})
    expect(processed).toEqual({'test*': ['abc123']})

    processed = await REXContentProcessorManager.getInstance().processContent({test: ['My phone number is 555-666-9999!']})
    expect(processed).toEqual({test: ['My phone number is 555-666-9999!']})

    processed = await REXContentProcessorManager.getInstance().processContent({'test*': ['My phone number is 555-666-9999!']})
    expect(processed).toEqual({'test*': ['My phone number is [Redacted: phone_number]!']})

    processed = await REXContentProcessorManager.getInstance().processContent({test: ['There\'s no place like 127.0.0.1.']})
    expect(processed).toEqual({test: ['There\'s no place like 127.0.0.1.']})

    processed = await REXContentProcessorManager.getInstance().processContent({'test*': ['There\'s no place like 127.0.0.1.']})
    expect(processed).toEqual({'test*': ['There\'s no place like [Redacted: ip_address].']})

    processed = await REXContentProcessorManager.getInstance().processContent({'test*': {message: 'There\'s no place like 127.0.0.1.'}})
    expect(processed).toEqual({'test*': {message: 'There\'s no place like [Redacted: ip_address].'}})

      sanitizeProcessor.disable()
  });

});
