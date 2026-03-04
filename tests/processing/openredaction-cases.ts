export interface OpenRedactionCase {
  input:string
  expected?:string
  expectedPattern?:RegExp
}

const PHONE_TOKEN = String.raw`\[PHONE_[0-9]+\]`
const EMAIL_TOKEN = String.raw`\[EMAIL_[0-9]+\]`
const CREDIT_CARD_TOKEN = String.raw`\[CREDIT_CARD_[0-9]+\]`
const GOV_ID_TOKEN = String.raw`\[(?:SSN|ITIN|EIN|PASSPORT(?:_[A-Z]+)?|GOV(?:ERNMENT)?_ID|PHONE_US)_[0-9]+\]`
const ADDRESS_TOKEN = String.raw`\[(?:ADDRESS|PO_BOX)_[0-9]+\]`
const BANK_TOKEN = String.raw`\[(?:ROUTING_NUMBER|ACCOUNT|BANK_ACCOUNT)_[0-9]+\]`

export const phoneCases:OpenRedactionCase[] = [
  { input: '555-123-4567', expectedPattern: new RegExp(`^${PHONE_TOKEN}$`) },
  { input: '(555) 123-4567', expectedPattern: new RegExp(`^${PHONE_TOKEN}$`) },
  { input: '(555)123-4567', expectedPattern: new RegExp(`^${PHONE_TOKEN}$`) },
  { input: '555 123 4567', expectedPattern: new RegExp(`^${PHONE_TOKEN}$`) },
  { input: '555.123.4567', expectedPattern: new RegExp(`^${PHONE_TOKEN}$`) },
  { input: '5551234567', expectedPattern: new RegExp(`^${PHONE_TOKEN}$`) },
  { input: '+1 555 123 4567', expectedPattern: new RegExp(`^${PHONE_TOKEN}$`) },
  { input: '+1-555-123-4567', expectedPattern: new RegExp(`^${PHONE_TOKEN}$`) },
  { input: '1-555-123-4567', expectedPattern: new RegExp(`^${PHONE_TOKEN}$`) },
  { input: '555-123-4567 ext 89', expectedPattern: new RegExp(`^${PHONE_TOKEN}$`) },
  { input: 'Call me at 555-123-4567.', expectedPattern: new RegExp(`^Call me at ${PHONE_TOKEN}\\.$`) },
  { input: 'Call 555-123-4567 or 555-987-6543', expectedPattern: new RegExp(`^Call ${PHONE_TOKEN} or ${PHONE_TOKEN}$`) },
  { input: '555–123–4567', expectedPattern: new RegExp(`^${PHONE_TOKEN}$`) },
  { input: '+1 (555).123-4567', expectedPattern: new RegExp(`^${PHONE_TOKEN}$`) },
  { input: '555-123-4567\nis my number', expectedPattern: new RegExp(`^${PHONE_TOKEN}\\nis my number$`) },
  { input: 'My number5551234567is not working', expectedPattern: new RegExp(`^My number${PHONE_TOKEN}is not working$`) },
  { input: 'Call 123-4567', expected: 'Call 123-4567' },
  { input: '2024-01-15', expected: '2024-01-15' },
  { input: 'Order 555-123-45678 failed', expected: 'Order 555-123-45678 failed' },
  { input: 'v1.2.3.4567', expected: 'v1.2.3.4567' },
]

export const emailCases:OpenRedactionCase[] = [
  { input: 'contact me at john.doe@example.com', expected: 'contact me at john.doe@example.com' },
  { input: 'john.doe+test@gmail.com', expectedPattern: new RegExp(`^${EMAIL_TOKEN}$`) },
  { input: 'alerts@billing.prod.company.com', expectedPattern: new RegExp(`^${EMAIL_TOKEN}$`) },
  { input: 'EMAIL ME AT JOHN.DOE@EXAMPLE.COM', expected: 'EMAIL ME AT JOHN.DOE@EXAMPLE.COM' },
  { input: 'EMAIL ME AT JOHN.DOE@GMAIL.COM', expectedPattern: new RegExp(`^EMAIL ME AT ${EMAIL_TOKEN}$`) },
  { input: 'Send it to john@example.com.', expectedPattern: new RegExp(`^Send it to ${EMAIL_TOKEN}\\.$`) },
  { input: '<john@example.com>', expectedPattern: new RegExp(`^<${EMAIL_TOKEN}>$`) },
  { input: '“john@example.com”', expectedPattern: new RegExp(`^“${EMAIL_TOKEN}”$`) },
  { input: '(john@Example.com)', expectedPattern: new RegExp(`^\\(${EMAIL_TOKEN}\\)$`) },
  { input: 'Email john@example.com or jane@example.com', expectedPattern: new RegExp(`^Email ${EMAIL_TOKEN} or ${EMAIL_TOKEN}$`) },
  { input: 'mailto:john@example.com', expectedPattern: new RegExp(`^mailto:\\s*${EMAIL_TOKEN}$`) },
  { input: 'john@Example.com\nis my email', expectedPattern: new RegExp(`^${EMAIL_TOKEN}\\nis my email$`) },
  { input: 'email me at john@', expected: 'email me at john@' },
  { input: 'contact me @john_doe', expected: 'contact me @john_doe' },
  { input: 'john [at] example [dot] com', expected: 'john [at] example [dot] com' },
  {
    input: 'User pasted john@example.com and 555-123-4567 and 123 Main St into input',
    expectedPattern: new RegExp(`^User pasted ${EMAIL_TOKEN} and ${PHONE_TOKEN} and ${ADDRESS_TOKEN} into input$`)
  },
]

export const cardCases:OpenRedactionCase[] = [
  { input: '4111 1111 1111 1111', expectedPattern: new RegExp(`^${CREDIT_CARD_TOKEN}$`) },
  { input: '4111-1111-1111-1111', expectedPattern: new RegExp(`^${CREDIT_CARD_TOKEN}$`) },
  { input: '4111111111111111', expectedPattern: new RegExp(`^${CREDIT_CARD_TOKEN}$`) },
  { input: '3782 822463 10005', expectedPattern: new RegExp(`^${CREDIT_CARD_TOKEN}$`) },
  { input: '6011 0000 0000 0004', expectedPattern: new RegExp(`^${CREDIT_CARD_TOKEN}$`) },
  { input: '5555 5555 5555 4444', expectedPattern: new RegExp(`^${CREDIT_CARD_TOKEN}$`) },
  { input: 'My card is 4111 1111 1111 1111.', expectedPattern: new RegExp(`^My card is ${CREDIT_CARD_TOKEN}\\.$`) },
  { input: 'Try 4111 1111 1111 1111 then 5555 5555 5555 4444', expectedPattern: new RegExp(`^Try ${CREDIT_CARD_TOKEN} then ${CREDIT_CARD_TOKEN}$`) },
  { input: '4111\t1111  1111\n1111', expectedPattern: new RegExp(`^${CREDIT_CARD_TOKEN}$`) },
  { input: '4111-1111 1111-1111', expectedPattern: new RegExp(`^${CREDIT_CARD_TOKEN}$`) },
  { input: 'cc: 4111 1111 1111 1111 exp 12/27', expectedPattern: new RegExp(`^cc: ${CREDIT_CARD_TOKEN} exp 12/27$`) },
  { input: '1234 5678 9012 3456', expected: '1234 5678 9012 3456' },
  { input: '2026-01-15 12:34:56', expected: '2026-01-15 12:34:56' },
]

export const governmentIdCases:OpenRedactionCase[] = [
  { input: 'My ssn is 123-45-6789', expectedPattern: new RegExp(`^My ssn is ${GOV_ID_TOKEN}$`) },
  { input: '123 45 6789', expectedPattern: new RegExp(`^${GOV_ID_TOKEN}$`) },
  { input: '123456789', expectedPattern: new RegExp(`^${GOV_ID_TOKEN}$`) },
  { input: 'SSN 123-45-6789.', expectedPattern: new RegExp(`^SSN ${GOV_ID_TOKEN}\\.$`) },
  { input: '123-45-6789 and 987-65-4321', expectedPattern: new RegExp(`^${GOV_ID_TOKEN} and ${GOV_ID_TOKEN}$`) },
  { input: '12-3456789', expectedPattern: new RegExp(`^${GOV_ID_TOKEN}$`) },
  { input: '2026-01-15', expected: '2026-01-15' },
  { input: '123-45-67890', expected: '123-45-67890' },
]

export const addressCases:OpenRedactionCase[] = [
  { input: '123 Main St', expectedPattern: new RegExp(`^${ADDRESS_TOKEN}$`) },
  { input: '123 Main St Apt 4B', expectedPattern: new RegExp(`^${ADDRESS_TOKEN}$`) },
  { input: '123 Main St #12', expectedPattern: new RegExp(`^${ADDRESS_TOKEN}$`) },
  { input: '123 Main St Springfield IL 62704', expectedPattern: new RegExp(`^${ADDRESS_TOKEN}$`) },
  { input: '456 E 7th Avenue', expectedPattern: new RegExp(`^${ADDRESS_TOKEN}$`) },
  { input: '789 Broadway Blvd. New York NY', expectedPattern: new RegExp(`^${ADDRESS_TOKEN}$`) },
  { input: '123 Main St\nApt 4B\nSpringfield, IL 62704', expectedPattern: new RegExp(`^${ADDRESS_TOKEN}$`) },
  { input: 'My address is 123 Main St apt 4b please ship', expectedPattern: new RegExp(`^My address is ${ADDRESS_TOKEN} please ship$`) },
  { input: 'PO Box 123, Springfield, IL 62704', expectedPattern: new RegExp(`^${ADDRESS_TOKEN}$`) },
  { input: 'Main St Springfield', expected: 'Main St Springfield' },
  { input: '62704', expected: '62704' },
  { input: '123 main character', expected: '123 main character' },
]

export const bankCases:OpenRedactionCase[] = [
  { input: 'routing 021000021', expectedPattern: new RegExp(`^routing ${BANK_TOKEN}$`) },
  { input: 'ABA: 0210-0002-1', expectedPattern: new RegExp(`^ABA: ${BANK_TOKEN}$`) },
  { input: 'routing 0210 0002 1', expectedPattern: new RegExp(`^routing ${BANK_TOKEN}$`) },
  { input: 'my routing is 021000021.', expectedPattern: new RegExp(`^my routing is ${BANK_TOKEN}\\.$`) },
  { input: 'routing 123456789', expected: 'routing 123456789' },
  { input: 'account 123456789', expectedPattern: new RegExp(`^account ${BANK_TOKEN}$`) },
  { input: 'acct 123456789', expectedPattern: new RegExp(`^acct ${BANK_TOKEN}$`) },
  { input: 'a/c 123456789', expectedPattern: new RegExp(`^a/c ${BANK_TOKEN}$`) },
  { input: 'account # 123456789', expectedPattern: new RegExp(`^account # ${BANK_TOKEN}$`) },
  { input: 'ACH info: 111000025 000123456789', expectedPattern: new RegExp(`^ACH info: ${BANK_TOKEN} ${BANK_TOKEN}$`) },
]
