/**
 * TEMPLATE legal text. Replace bracketed values and have qualified counsel
 * review before publishing. Kept in code so the in-app pages and the public
 * web pages (/privacy, /terms) always match.
 */
export const LEGAL_ENTITY = '[BookNoble legal entity name]';
export const CONTACT_EMAIL = '[privacy@booknoble.app]';
export const EFFECTIVE_DATE = '[Effective date]';

export interface LegalSection {
  heading: string;
  body: string;
}

export const PRIVACY: LegalSection[] = [
  {
    heading: 'Who we are',
    body: `BookNoble is provided by ${LEGAL_ENTITY}. This policy explains what we collect when businesses use the BookNoble app and when their customers book through a BookNoble booking page. Contact: ${CONTACT_EMAIL}.`,
  },
  {
    heading: 'Information we collect',
    body: 'Business owners: account email, encrypted password (handled by our authentication provider), business profile, services, hours, and records you enter (clients, appointments, invoices, notes). Customers who book: name, email and/or phone number, chosen service and time, and any note they add. Technical data: crash reports and basic diagnostics needed to keep the service working.',
  },
  {
    heading: 'Payments',
    body: 'Deposits and invoices are paid on a checkout page operated by our payment processor (Stripe) on the business’s own Stripe account. BookNoble does not receive or store full card numbers. Subscriptions purchased in the iOS or Android app are processed by Apple or Google.',
  },
  {
    heading: 'How we use information',
    body: 'To provide booking, scheduling, reminders, invoicing and analytics; to secure accounts and prevent abuse; to send service messages such as booking confirmations and reminders; and to comply with law. We do not sell personal information and do not use it for third-party advertising or tracking.',
  },
  {
    heading: 'Who can see it',
    body: 'Each business can see only its own clients and records; this is enforced in our database with row-level security. Customers’ details are shared only with the business they book. Service providers that process data for us: hosting and database (Supabase), payments (Stripe), email/SMS delivery providers for reminders, and app stores for subscriptions.',
  },
  {
    heading: 'Retention and deletion',
    body: 'We keep data while the account is active. Business owners can delete their account and all business data in the app (Settings → Delete account) or request deletion on the web at /delete-account. Customers may ask the business, or contact us, to delete their booking information. Backups are purged on a rolling schedule of up to [30] days.',
  },
  {
    heading: 'Your rights',
    body: 'Depending on where you live, you may have rights to access, correct, delete or export your information, and to object to certain processing. Contact us to exercise them.',
  },
  {
    heading: 'Children',
    body: 'BookNoble is intended for business owners aged 18+ and is not directed to children under 13.',
  },
  { heading: 'Changes', body: `We will post updates here and update the effective date. Effective: ${EFFECTIVE_DATE}.` },
];

export const TERMS: LegalSection[] = [
  {
    heading: 'The service',
    body: `These terms govern use of BookNoble, provided by ${LEGAL_ENTITY}. BookNoble is software for scheduling and managing appointment-based businesses. Businesses are responsible for the services they provide to their customers.`,
  },
  {
    heading: 'Accounts',
    body: 'You must provide accurate information, keep your credentials secure, and be at least 18. You are responsible for activity on your account and for having permission to store your clients’ information.',
  },
  {
    heading: 'Subscriptions',
    body: 'Free, Starter ($9.99/month) and Pro ($19.99/month) plans are offered; prices may vary by region and are shown before purchase. Paid plans renew automatically each month until cancelled. Purchases in the iOS or Android app are billed by Apple or Google and managed in your store account; cancel at least 24 hours before renewal to avoid the next charge. Refunds for store purchases follow the store’s policies.',
  },
  {
    heading: 'Customer payments',
    body: 'Payments your customers make to you (deposits, invoices) are processed by Stripe under Stripe’s terms on your own Stripe account. BookNoble is not a party to those payments, does not hold funds, and does not provide money transmission.',
  },
  {
    heading: 'Acceptable use',
    body: 'Do not misuse the service, send spam, upload unlawful content, attempt to access other businesses’ data, or interfere with the service’s security.',
  },
  {
    heading: 'Availability and liability',
    body: 'We work to keep BookNoble reliable but provide it “as is”. To the extent permitted by law, our liability is limited to the amount you paid us in the 12 months before the claim. [Jurisdiction-specific terms to be completed by counsel.]',
  },
  {
    heading: 'Termination',
    body: 'You may delete your account at any time in the app. We may suspend accounts that violate these terms.',
  },
  { heading: 'Contact', body: `Questions: ${CONTACT_EMAIL}. Effective: ${EFFECTIVE_DATE}.` },
];
