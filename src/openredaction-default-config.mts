// Default OpenRedaction configuration shared by:
// 1) REXOpenRedactionContentProcessor constructor defaults
// 2) tests that call updateConfiguration with JSON
export const REX_OPEN_REDACTION_DEFAULT_CONFIGURATION = {
  version: '1.0',
  timestamp: '2026-02-25T00:00:00.000Z',
  options: {
    // Fast and stable patterns
    includePhones: true,
    includeEmails: true,

    // Slower and noisier filters
    includeNames: false,
    includeAddresses: true,

    // Disable multipass filtering due to performance concerns
    enableMultiPass: false,

    enableContextAnalysis: true,
    confidenceThreshold: 0.3,

    // Redactions are opaque placeholders:
    // "joe@smith.com and bob@smith.com" -> "[EMAIL_x] and [EMAIL_y]"
    redactionMode: 'placeholder',
    deterministic: false,

    // Keep chunks smaller than 1 MB to avoid hard failures.
    maxInputSize: 1 * 1024 * 1024,

    // When this timeout is hit, only that regex fails silently.
    // Other detectors continue normally.
    regexTimeout: 50,

    // Restrict to baseline patterns.
    patterns: [
      "EMAIL",
      "ADDRESS_STREET", "ADDRESS_PO_BOX", "POSTCODE_UK",
      "SSN", "ITIN", "PASSPORT_US", "PASSPORT_UK", "DRIVING_LICENSE_US", "DRIVING_LICENSE_UK",

      "CREDIT_CARD", "IBAN", "ROUTING_NUMBER_US", "BANK_ACCOUNT_UK", "SORT_CODE_UK",
      "SWIFT_BIC", "TAX_ID", "CVV", "CARD_EXPIRY", "CARD_TRACK1_DATA", "CARD_TRACK2_DATA",

      "MEDICAL_RECORD_NUMBER", "DATE_OF_BIRTH", "HEALTH_INSURANCE_CLAIM",
      "NHS_NUMBER", "PRESCRIPTION_NUMBER", "ALLERGY_INFO", "BIOBANK_SAMPLE_ID", "BIOMETRIC_ID",

      "PASSWORD", "GENERIC_SECRET", "PRIVATE_KEY", "JWT_TOKEN", "BEARER_TOKEN",
      "OAUTH_CLIENT_SECRET", "OAUTH_TOKEN", "GENERIC_API_KEY", "AWS_ACCESS_KEY", "AWS_SECRET_KEY",
      "GITHUB_TOKEN", "STRIPE_API_KEY", "SLACK_TOKEN", "SLACK_WEBHOOK", "AZURE_STORAGE_KEY",
      "GOOGLE_API_KEY", "FIREBASE_API_KEY", "TWILIO_API_KEY", "MAILGUN_API_KEY", "SENDGRID_API_KEY",
      "NPM_TOKEN", "PYPI_TOKEN", "KUBERNETES_SECRET", "DATABASE_CONNECTION", "URL_WITH_AUTH"
    ]
  },
  customPatterns: [
    // Unified phone detector for US/UK/international variants.
    {
      type: 'PHONE_UNIFIED',
      regex: "(?:^|(?<!\\d))(?:\\+\\d{1,3}[\\s\\u00A0.\\-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u2212\\uFE58\\uFE63\\uFF0D()]*\\d(?:[\\s\\u00A0.\\-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u2212\\uFE58\\uFE63\\uFF0D()]*\\d){6,14}|(?:\\+?1[\\s\\u00A0.\\-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u2212\\uFE58\\uFE63\\uFF0D]?)?(?:\\(\\d{3}\\)|\\d{3})[\\s\\u00A0.\\-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u2212\\uFE58\\uFE63\\uFF0D]?\\d{3}[\\s\\u00A0.\\-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u2212\\uFE58\\uFE63\\uFF0D]?\\d{4}|(?:(?:\\+44[\\s\\u00A0.\\-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u2212\\uFE58\\uFE63\\uFF0D]?(?:0)?\\s*|0)(?:\\(?[1-9]\\d{1,3}\\)?[\\s\\u00A0.\\-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u2212\\uFE58\\uFE63\\uFF0D]+\\d{3,4}[\\s\\u00A0.\\-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u2212\\uFE58\\uFE63\\uFF0D]+\\d{3,4})))(?:\\s?(?:ext\\.?|x)\\s?\\d{1,6})?(?!\\d)",
      flags: 'gi',
      priority: 99,
      placeholder: '[PHONE_{n}]',
      description: 'Unified phone detector',
      severity: 'medium'
    },
    // Fast multiline credit-card fallback for 4x4 groups split by whitespace/newlines.
    {
      type: 'CREDIT_CARD_MULTILINE_4X4',
      regex: "\\b(?:4\\d{3}|5[1-5]\\d{2}|3[47]\\d{2}|6(?:011|5\\d{2}))(?:[\\s\\u00A0.\\-]{1,6}\\d{4}){3}\\b",
      flags: 'g',
      priority: 94,
      placeholder: '[CREDIT_CARD_{n}]',
      description: 'Credit card (4x4) across whitespace/newlines',
      severity: 'high'
    },
    // Detect 9-digit government IDs in SSN-like formatted form.
    {
      type: 'GOV_ID_9DIGIT_FORMATTED',
      regex: "(?<!routing\\s)(?<!account\\s)(?<!acct\\s)(?<!a\\/c\\s)(?<!routing\\sis\\s)\\b\\d{3}[\\s\\-.]\\d{2}[\\s\\-.]\\d{4}\\b",
      flags: 'gi',
      priority: 85,
      placeholder: '[SSN_{n}]',
      description: 'Formatted 9-digit government ID outside banking context',
      severity: 'high'
    },
    // Detect compact 9-digit government IDs while excluding common banking contexts.
    {
      type: 'GOV_ID_9DIGIT_COMPACT',
      regex: "(?<!routing\\s)(?<!account\\s)(?<!acct\\s)(?<!a\\/c\\s)(?<!routing\\sis\\s)\\b\\d{9}\\b",
      flags: 'gi',
      priority: 84,
      placeholder: '[SSN_{n}]',
      description: 'Compact 9-digit government ID outside banking context',
      severity: 'high'
    },
    // Detect bare EIN values.
    {
      type: 'EIN_BARE',
      regex: "\\b\\d{2}-\\d{7}\\b",
      flags: 'gi',
      priority: 97,
      placeholder: '[EIN_{n}]',
      description: 'EIN without label',
      severity: 'high'
    },
    // Matches street addresses with optional unit and city/state/zip suffix.
    {
      type: 'ADDRESS_STREET_WITH_ALNUM_UNIT',
      regex: "\\b\\d{1,5}\\s+[A-Za-z][A-Za-z0-9'’.\\-]*(?:\\s+[A-Za-z][A-Za-z0-9'’.\\-]*){0,4}\\s+(?:Street|St\\.?|Road|Rd\\.?|Avenue|Ave\\.?|Lane|Ln\\.?|Drive|Dr\\.?|Court|Ct\\.?|Boulevard|Blvd\\.?|Way|Terrace|Ter\\.?|Place|Pl\\.?|Trail|Trl\\.?|Parkway|Pkwy\\.?|Highway|Hwy\\.?)(?:\\s+(?:#\\s*[A-Za-z0-9\\-]+|(?:Apt|Unit|Suite|Ste|Apartment|apt|unit|suite|ste)\\s*#?[A-Za-z0-9\\-]+))?(?:\\s+[A-Za-z.\\- ]+,?\\s+[A-Z]{2}(?:\\s+\\d{5}(?:-\\d{4})?)?)?\\b",
      flags: 'gi',
      priority: 96,
      placeholder: '[ADDRESS_{n}]',
      description: 'Street address with optional unit/city/state/zip',
      severity: 'medium'
    },
    // Matches PO Box with optional city/state/zip suffix.
    {
      type: 'ADDRESS_PO_BOX_FULL',
      regex: "\\bP\\.?\\s*O\\.?\\s*Box\\s+\\d+(?:,?\\s+[A-Za-z.\\- ]+,?\\s+[A-Z]{2}\\s+\\d{5}(?:-\\d{4})?)?\\b",
      flags: 'gi',
      priority: 96,
      placeholder: '[PO_BOX_{n}]',
      description: 'PO Box address with optional city/state/zip',
      severity: 'medium'
    },
    // US ZIP code with guard against matching phone-number tails like 555-123-45678.
    {
      type: 'ZIP_CODE_US_STRICT',
      regex: "(?:\\b(?:zip|zipcode|postal(?:\\s+code)?)\\b(?:\\s+is)?\\s*[:#-]?\\s*\\d{5}(?:[\\s\\u00A0.\\-]\\d{4})?\\b)|(?:\\b\\d{5}[\\s\\u00A0.\\-]\\d{4}\\b)",
      flags: 'gi',
      priority: 75,
      placeholder: '[ZIP_{n}]',
      description: 'US ZIP code (strict)',
      severity: 'low'
    },
    // Captures account numbers only when explicit account context is present.
    {
      type: 'BANK_ACCOUNT_CONTEXTUAL',
      regex: "\\b(?:account|acct|a\\/c)\\s*#?\\s*(\\d{8,17})\\b",
      flags: 'gi',
      priority: 96,
      placeholder: '[BANK_ACCOUNT_{n}]',
      description: 'Account number with explicit account context',
      severity: 'high'
    },
    // Captures routing numbers phrased as "routing is <number>".
    {
      type: 'ROUTING_NUMBER_CONTEXTUAL_IS',
      regex: "\\b(?:routing)\\s+is\\s+((?:\\d[\\s\\u00A0.-]?){9})\\b",
      flags: 'gi',
      priority: 96,
      placeholder: '[ROUTING_NUMBER_{n}]',
      description: 'Routing number with explicit \"routing is\" context',
      severity: 'high'
    },
    // Captures ACH routing numbers in ACH-specific context.
    {
      type: 'ACH_ROUTING_CONTEXTUAL',
      regex: "\\b(?:ACH\\s+info:\\s*)(\\d{9})\\b",
      flags: 'gi',
      priority: 96,
      placeholder: '[ROUTING_NUMBER_{n}]',
      description: 'ACH routing number with explicit ACH context',
      severity: 'high'
    },
    // Captures ACH account numbers when they follow an ACH routing number.
    {
      type: 'ACH_ACCOUNT_CONTEXTUAL',
      regex: "\\b(?:ACH\\s+info:\\s*\\d{9}\\s+)(\\d{9,17})\\b",
      flags: 'gi',
      priority: 96,
      placeholder: '[BANK_ACCOUNT_{n}]',
      description: 'ACH account number following ACH routing number',
      severity: 'high'
    },
    // Filter Geo Coordiantes
    {
      type: 'PRECISE_GEO_COORDINATES',
      regex: "\\b(?:-?(?:[1-8]?\\d(?:\\.\\d+)?|90(?:\\.0+)?))\\s*,\\s*(?:-?(?:180(?:\\.0+)?|1[0-7]\\d(?:\\.\\d+)?|\\d?\\d(?:\\.\\d+)?))\\b",
      flags: 'g',
      priority: 95,
      placeholder: '[GEO_COORD_{n}]',
      severity: 'high'
    }
  ]
}

export const REX_OPEN_REDACTION_DEFAULT_CONFIGURATION_JSON = JSON.stringify(
  REX_OPEN_REDACTION_DEFAULT_CONFIGURATION
)
