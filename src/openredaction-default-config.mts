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
    confidenceThreshold: 0.4,

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
      "NAME", "EMAIL", "PHONE_US", "PHONE_UK", "PHONE_INTERNATIONAL",
      "ADDRESS_STREET", "ADDRESS_PO_BOX", "ZIP_CODE_US", "POSTCODE_UK",
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
    // Covers US phone variants not reliably matched by upstream defaults.
    {
      type: 'PHONE_US_FALLBACK',
      regex: "(?:^|(?<!\\d))(?:\\+?1[\\s\\u00A0.\\-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u2212\\uFE58\\uFE63\\uFF0D]?)?(?:\\(\\d{3}\\)|\\d{3})[\\s\\u00A0.\\-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u2212\\uFE58\\uFE63\\uFF0D]?\\d{3}[\\s\\u00A0.\\-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u2212\\uFE58\\uFE63\\uFF0D]?\\d{4}(?:\\s?(?:ext\\.?|x)\\s?\\d{1,6})?(?!\\d)",
      flags: 'gi',
      priority: 99,
      placeholder: '[PHONE_US_{n}]',
      description: 'US phone fallback',
      severity: 'medium'
    },
    // Detect bare SSN when explicit "SSN"/"social security" labels are absent.
    {
      type: 'SSN_BARE',
      regex: "\\b\\d{3}[\\s\\-.]?\\d{2}[\\s\\-.]?\\d{4}\\b",
      flags: 'g',
      priority: 92,
      placeholder: '[SSN_{n}]',
      description: 'Bare SSN without label',
      severity: 'high'
    },
    // Detect bare EIN values.
    {
      type: 'EIN_BARE',
      regex: "\\b\\d{2}-\\d{7}\\b",
      flags: 'g',
      priority: 97,
      placeholder: '[EIN_{n}]',
      description: 'EIN without label',
      severity: 'high'
    },
    // Matches street addresses with optional unit and city/state/zip suffix.
    {
      type: 'ADDRESS_STREET_WITH_ALNUM_UNIT',
      regex: "\\b\\d{1,5}\\s+[A-Za-z0-9][A-Za-z0-9'’.\\-]*(?:\\s+[A-Za-z0-9][A-Za-z0-9'’.\\-]*){0,4}\\s+(?:Street|St\\.?|Road|Rd\\.?|Avenue|Ave\\.?|Lane|Ln\\.?|Drive|Dr\\.?|Court|Ct\\.?|Boulevard|Blvd\\.?|Way|Terrace|Ter\\.?|Place|Pl\\.?|Trail|Trl\\.?|Parkway|Pkwy\\.?|Highway|Hwy\\.?)(?:\\s+(?:Apt|Unit|Suite|Ste|Apartment|apt|unit|suite|ste)\\s*#?[A-Za-z0-9\\-]+)?(?:\\s+[A-Za-z.\\- ]+,?\\s+[A-Z]{2}\\s+\\d{5}(?:-\\d{4})?)?\\b",
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
