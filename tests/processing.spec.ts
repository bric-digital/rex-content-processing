import { test, expect } from '@playwright/test';
import { REXContentProcessor, REXContentProcessorManager } from '@bric/rex-content-processing/library'
import { REXRegexpContentProcessor, REXSanitizePIIContentProcessor, REXOpenRedactionContentProcessor } from '@bric/rex-content-processing/processors'

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

  test('OpenRedaction Content Processor redacts sensitive values', async ({ page }) => {
    const openRedactionProcessor = new REXOpenRedactionContentProcessor()
    openRedactionProcessor.enable()

    try {
      const input = { 'test*': 'Contact me at jane.doe@example.org or 555-666-9999.' }
      const processed = await REXContentProcessorManager.getInstance().processContent(input)

      expect(processed).not.toEqual(input)
      expect(processed['test*']).not.toContain('jane.doe@example.org')
      expect(processed['test*']).not.toContain('555-666-9999')
    } finally {
      openRedactionProcessor.disable()
    }
  });

  test('OpenRedaction Content Processor updates configuration and handles invalid config', async ({ page }) => {
    const openRedactionProcessor = new REXOpenRedactionContentProcessor()
    openRedactionProcessor.enable()

    try {
      openRedactionProcessor.updateConfiguration({
        openRedaction: JSON.stringify({
          version: '1.0',
          timestamp: '2026-02-24T00:00:00.000Z',
          options: {
            includeEmails: false,
            includePhones: false,
            includeNames: false,
            includeAddresses: false
          }
        })
      })

      const emailOnly = 'Contact me at jane.doe@example.org.'
      const redactionDisabled = await openRedactionProcessor.processString(emailOnly)
      expect(redactionDisabled).toEqual(emailOnly)

      expect(() => {
        openRedactionProcessor.updateConfiguration({
          openRedaction: 'not-valid-json'
        })
      }).toThrow('Unable to parse string into JSON configuration for OpenRedaction, configuration not updated.')
    } finally {
      openRedactionProcessor.disable()
    }
  });
});
