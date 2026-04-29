import check from 'check-types'
import { REXContentProcessor } from './library.mjs'

export interface RegexpReplacement {
  pattern:string,
  replacement:string
}

export class REXRegexpContentProcessor extends REXContentProcessor {
  regexpMappings:RegexpReplacement[] = []

  updateConfiguration(config:any) { // eslint-disable-line @typescript-eslint/no-explicit-any
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

  processContent(content:any):Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
    return new Promise((resolve) => {

      resolve(content)
    })
  }

  name(): string {
    return 'REXRegexpContentProcessor'
  }
}
