import { test, expect } from './fixtures';

test('Extension page', async ({ page, extensionId }) => {
  chrome.runtime.sendMessage({
    messageType: 'processContent',
    content: {}
  }).then((response) => {
    expect(response).toEqual({})

  })
});
