import check from 'check-types'
import { sanitizePii } from '@cdssnc/sanitize-pii';

import { REXContentProcessor } from './library.mjs'

export interface RegexpReplacement {
  pattern:string,
  replacement:string
}

export class REXRegexpContentProcessor extends REXContentProcessor {
  regexpMappings:RegexpReplacement[] = []

  updateConfiguration(config) {
    if (config['regexp'] !== undefined && check.array(config['regexp'])) {
      this.regexpMappings = config['regexp']
    }
  }

  processString(content:string):Promise<string> {
    return new Promise((resolve) => {
      for (const regexp of this.regexpMappings) {
        const expression = new RegExp(regexp.pattern, 'g')

        content = content.replace(expression, regexp.replacement)
      }

      resolve(content)
    })
  }

  processContent(content):Promise<any> {
    return new Promise((resolve) => {

      resolve(content)
    })
  }

  name(): string {
    return 'REXRegexpContentProcessor'
  }
}

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
