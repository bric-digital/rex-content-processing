import check from 'check-types'
import { OpenRedaction } from 'openredaction-in-browser';
import { ConfigCodec } from 'openredaction-in-browser';
import { REXContentProcessor } from './library.mjs'
import {
  REX_OPEN_REDACTION_DEFAULT_CONFIGURATION_JSON
} from './openredaction-default-config.mjs';

export {
  REX_OPEN_REDACTION_DEFAULT_CONFIGURATION,
  REX_OPEN_REDACTION_DEFAULT_CONFIGURATION_JSON
} from './openredaction-default-config.mjs';

export class REXOpenRedactionContentProcessor extends REXContentProcessor {
  // Establish a default OpenRedaction configuration,
  // shared as JSON with tests and updateConfiguration.
  redactor  = new OpenRedaction(
    ConfigCodec.importFromString(REX_OPEN_REDACTION_DEFAULT_CONFIGURATION_JSON)
  );
  
  updateConfiguration(config) {
    // Update the configuration which requires replaceing the
    // redactor with a new instance, currently assumed to be JSON
    // encoded as a string
    const configuration = config['openRedaction']
    if (configuration !== undefined && check.string(configuration)) {
      try{
        const options = ConfigCodec.importFromString(configuration);
        try{
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
    return this.redactor.detect(content).then(result => result.redacted);
  }

  name(): string {
    return 'REXOpenRedactionContentProcessor'
  }
}
