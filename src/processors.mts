import check from 'check-types'
import { REXContentProcessor } from './library.mjs'
import { sanitizePii } from '@cdssnc/sanitize-pii';
import { OpenRedaction } from 'openredaction-in-browser';
import { ConfigCodec } from 'openredaction-in-browser';

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

  processContent(content):Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
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

export class REXOpenRedactionContentProcessor extends REXContentProcessor {
  // Establish a default OpenRedaction configuration
  // which can be overriden by config.
  redactor  = new OpenRedaction({
    // redactions will be simple opaque placeholders
    // "joe@smith.com and bob@smith.com" both becomes:
    // "[EMAIL] and [EMAIL]"
    redactionMode: 'placeholder',

    // Fast and stable patterns
    includePhones: true,
    includeEmails: true,

    // Slower and noisier filters
    includeNames: true,
    includeAddresses: false,

    // Disable multipass filtering due to performance concerns
    enableMultiPass: false,

    // Use context around matches to disabiguate such as Roosevelt vs. Roosevelt Island.
    enableContextAnalysis: true, // true is slower
    confidenceThreshold: 0.4, // weight this towards false positives rather 

    // Hitting this will cause a hard failure that the caller
    // of processString will have to deal with. Try to keep
    // chunks smaller than 1 MB
    maxInputSize: 1 * 1024 * 1024,
 
    // When this timeout is hit, only the regex hitting it fails,
    // but it does so silently, all other detectors operate normally.
    // The error is only surfaced with a debug flag set.
    regexTimeout: 50, //50ms is slightly shorter than the 100ms default

  });
  
  updateConfiguration(config) {
    // Update the configuration which requires replaceing the
    // redactor with a new instance, currently assumed to be JSON
    // encoded as a string
    const configuration = config['openRedaction']
    if (configuration !== undefined && check.string(configuration)) {
      try{
        try{
          const options = ConfigCodec.importFromString(configuration);
          this.redactor = new OpenRedaction(options)
        } catch {
          throw new Error ("Unable to load JSON configuration for OpenRedaction, configuration not updated.");
        }
      } catch {
        throw new Error ("Unable to parse string into JSON configuration for OpenRedaction, configuration not updated.");
      }
    }
  }

  processString(content:string):Promise<string> {
    return new Promise((resolve) => {
      return this.redactor
        .detect(content)
        .then(result => result.redacted);
    })
  }

  name(): string {
    return 'REXOpenRedactionContentProcessor'
  }
}