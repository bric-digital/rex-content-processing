import { sanitizePii } from '@cdssnc/sanitize-pii';
import { REXContentProcessor } from './library.mjs'

export class REXSanitizePIIContentProcessor extends REXContentProcessor {
  processString(content:string):Promise<string> {
    return new Promise((resolve) => {
      const sanitized = sanitizePii(content);

      resolve(sanitized)
    })
  }
  
  name(): string {
    return 'REXSanitizePIIContentProcessor'
  }
}
