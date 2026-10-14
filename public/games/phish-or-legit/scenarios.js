// Every email in the game. All companies and addresses are fictional.
// skill: one of the ids in ../core/profile.js (SKILLS)
// kind: 'phish' | 'legit'
// context: an optional one-line situation, so legit emails are fair ("you just asked for this").
// link: { text } is what the email shows; { href } is where it really goes (shown when the player inspects it).
// flags (phish): what gave it away. why (legit): what makes it safe.
import { EXTRA } from './scenarios-extra.js';
import { MORE } from './scenarios-more.js';

const CORE = [
  // ───────────── PHISH ─────────────
  {
    id: 'p-lookalike-pw',
    skill: 'email',
    kind: 'phish',
    from: { name: 'Contoso IT Helpdesk', addr: 'helpdesk@contos0.com' },
    subject: 'Your password expires in 24 hours',
    body: [
      'Dear user,',
      'Your Contoso network password will expire in 24 hours. To avoid losing access to email and files, confirm your password now.',
    ],
    link: { text: 'https://contoso.com/password-reset', href: 'https://contoso.com.secure-verify.net/signin' },
    flags: [
      'The sender domain is "contos0.com" with a zero instead of the letter o.',
      'The link text says contoso.com, but it really goes to secure-verify.net. Everything after the first single slash is what counts, and the real domain is the part just before it.',
      'Urgency (24 hours) and a generic "Dear user" greeting.',
    ],
  },
  {
    id: 'p-ceo-giftcards',
    skill: 'email',
    kind: 'phish',
    from: { name: 'Dana Whitfield (CEO)', addr: 'dana.whitfield.ceo@gmail-mail.com' },
    subject: 'Quick favour, are you at your desk?',
    body: [
      'Hi, I am stuck in meetings all day and cannot take calls. I need 5 gift cards for a client, £100 each. I will reimburse you today.',
      'Please keep this between us for now and send me the codes as soon as you have them.',
    ],
    flags: [
      'A senior person emailing from a free webmail address, not the company domain.',
      'It asks for gift cards, a classic payment method scammers use because it is hard to trace.',
      'Secrecy and "cannot take calls" stop you from checking it is real.',
    ],
  },
  {
    id: 'p-invoice-html',
    skill: 'email',
    kind: 'phish',
    from: { name: 'Accounts Receivable', addr: 'billing@northwind-supplies.biz' },
    subject: 'Overdue invoice #4471 - final notice',
    body: [
      'Hello, our records show invoice #4471 is overdue. The invoice is attached. Please open it and sign in to view the payment details.',
    ],
    attachment: 'Invoice_4471.html',
    flags: [
      'An .html attachment is not an invoice. It opens a fake login page in your browser to steal your password.',
      'You were not expecting this invoice from a supplier you know.',
      'A "final notice" for a first email is pressure.',
    ],
  },
  {
    id: 'p-parcel-fee',
    skill: 'email',
    kind: 'phish',
    from: { name: 'ParcelGo Delivery', addr: 'no-reply@parcelgo-redeliver.top' },
    subject: 'We could not deliver your parcel',
    body: [
      'Your parcel is waiting at our depot. A redelivery fee of £1.45 is required. Pay within 12 hours or the parcel will be returned.',
    ],
    link: { text: 'Pay redelivery fee', href: 'https://parcelgo-redeliver.top/pay?id=88213' },
    flags: [
      'A tiny fee is the trick: the real goal is your card details.',
      'The sender domain ends in .top and is not parcelgo.com.',
      'It does not name you or give a real tracking number. Real couriers do not take payment by email link.',
    ],
  },
  {
    id: 'p-bank-card',
    skill: 'email',
    kind: 'phish',
    from: { name: 'Northwind Bank Security', addr: 'security@northwindbank-alerts.com' },
    subject: 'Unusual sign-in detected - verify your card',
    body: [
      'We noticed an unusual sign-in to your account. To restore access, reply with your full card number, expiry date and CVV so we can verify you.',
    ],
    flags: [
      'No genuine bank asks for your full card number or CVV by email.',
      'The sender domain is "northwindbank-alerts.com", not the bank\'s own domain.',
      'Fear plus a request for secrets is the standard pattern.',
    ],
  },
  {
    id: 'p-mfa-approve',
    skill: 'identity',
    kind: 'phish',
    from: { name: 'Account Security Team', addr: 'verify@account-security-team.co' },
    subject: 'Action required: approve your sign-in',
    body: [
      'We detected a sign-in from a new device. To keep your account active, approve the verification request and enter the code shown on the next page.',
    ],
    link: { text: 'Approve sign-in', href: 'https://account-security-team.co/mfa/approve' },
    flags: [
      'Approving requests or typing codes into a page you reached from an email can hand an attacker your login.',
      'The sender is an unrelated domain, not your provider\'s.',
      'If you are worried, go to the service yourself and check, never through the email link.',
    ],
  },
  {
    id: 'p-docsign-salary',
    skill: 'email',
    kind: 'phish',
    from: { name: 'Fabrikam Sign', addr: 'documents@fabrikam-sign.net' },
    subject: 'Document waiting: Q3 salary review',
    body: [
      'A document has been shared with you and needs your signature. Sign in with your work email to view it.',
    ],
    link: { text: 'View document', href: 'https://fabrikam-sharepoint.login-docs.link/view' },
    flags: [
      '"Salary review" is bait: it is made to make you curious and worried.',
      'The link goes to login-docs.link, not a real file-sharing service.',
      'It asks you to sign in with work credentials to see a document.',
    ],
  },
  {
    id: 'p-qr-mfa',
    skill: 'identity',
    kind: 'phish',
    from: { name: 'IT Security', addr: 'it-security@contoso-helpdesk.org' },
    subject: 'Re-enrol your MFA before Friday',
    body: [
      'Our MFA system is being upgraded. To avoid being locked out, scan the QR code below with your phone to re-enrol before Friday.',
      '[ QR code image ]',
    ],
    flags: [
      'QR codes hide the destination, and they also slip past email filters because the link is inside an image.',
      'A deadline to pressure you.',
      'The sender domain is "contoso-helpdesk.org". Real IT teams announce MFA changes through channels you already know.',
    ],
  },
  {
    id: 'p-payroll-divert',
    skill: 'data',
    kind: 'phish',
    from: { name: 'Priya Nair', addr: 'priya.nair.work@outlook.com' },
    subject: 'Please update my bank details before payroll',
    body: [
      'Hi HR, I have changed banks. Please update my salary payment to the new account below before Friday\'s payroll. Sort code 00-11-22, account 00000000.',
      'Thanks, I cannot talk on the phone today.',
    ],
    flags: [
      'A bank-detail change by email from a personal address is payroll diversion fraud.',
      'It pushes you to act before payroll and avoids a phone call that would expose it.',
      'Always confirm bank changes with the real person using a number you already have.',
    ],
  },
  {
    id: 'p-refund-call',
    skill: 'email',
    kind: 'phish',
    from: { name: 'Billing Department', addr: 'invoice@subscription-renewals.info' },
    subject: 'Your subscription has been renewed: £349.99',
    body: [
      'Thank you for your payment of £349.99 for your annual protection plan. If you did not authorise this charge, call 0800 000 0000 now to cancel and receive a refund.',
    ],
    flags: [
      'A big charge you did not make is designed to make you call the number.',
      'Calling puts you on the line with a scammer who will ask for remote access to your computer.',
      'No account name, no real company, and a sender domain unrelated to any seller.',
    ],
  },
  {
    id: 'p-double-ext',
    skill: 'email',
    kind: 'phish',
    from: { name: 'Jordan Blake, Talent Partner', addr: 'jordan.blake@careers-hiring.co' },
    subject: 'Role description for the Senior Analyst position',
    body: [
      'I came across your profile and think you would be a great fit. Please open the attached role description and let me know your thoughts.',
    ],
    attachment: 'Role_Description.pdf.exe',
    flags: [
      '"Role_Description.pdf.exe" is a program, not a PDF. Windows may hide the last extension.',
      'It is flattery from a stranger plus an attachment to open.',
      'The sender domain does not match any real recruiter.',
    ],
  },
  {
    id: 'p-oauth',
    skill: 'identity',
    kind: 'phish',
    from: { name: 'Shared with you', addr: 'share@docviewer-pro.app' },
    subject: 'Q3 forecast.xlsx has been shared with you',
    body: [
      'Click below to open the file. You will be asked to allow "DocViewer Pro" to access your account.',
    ],
    link: { text: 'Open file', href: 'https://docviewer-pro.app/consent?scope=mail.read+files.readwrite.all' },
    flags: [
      'This is consent phishing: if you click Allow, the app can read your mail and files without ever needing your password.',
      'Look at the permissions the app asks for. A file viewer does not need to read all your email.',
      'The sender is an unknown app, not your company\'s file-sharing service.',
    ],
  },

  // ───────────── LEGIT ─────────────
  {
    id: 'l-pw-reset',
    skill: 'identity',
    kind: 'legit',
    context: 'You just clicked "Forgot password" on the Contoso website.',
    from: { name: 'Contoso', addr: 'no-reply@contoso.com' },
    subject: 'Reset your Contoso password',
    body: [
      'Hi Sam, we received a request to reset the password for your Contoso account. Use the link below within 30 minutes.',
      'If you did not ask for this, you can ignore this email and your password will stay the same.',
    ],
    link: { text: 'Reset password', href: 'https://contoso.com/account/reset?token=Zk29x' },
    why: 'You started this yourself seconds ago, the sender and the link are both on contoso.com, and it asks for nothing except that you choose a new password on the real site.',
  },
  {
    id: 'l-calendar',
    skill: 'email',
    kind: 'legit',
    from: { name: 'Alex Morgan', addr: 'alex.morgan@contoso.com' },
    subject: 'Invitation: Sprint planning, Thursday 10:00',
    body: [
      'Alex Morgan has invited you to Sprint planning.',
      'When: Thursday, 10:00-10:45. Where: Microsoft Teams meeting.',
    ],
    link: { text: 'Join the meeting', href: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_Nz' },
    why: 'A colleague on your own company domain, a normal meeting invite, and the link goes to the real Teams domain. Nothing asks for a password or payment.',
  },
  {
    id: 'l-newsletter',
    skill: 'email',
    kind: 'legit',
    context: 'You subscribed to this newsletter last month.',
    from: { name: 'Northwind Fitness Weekly', addr: 'news@northwind-fitness.com' },
    subject: 'This week: 3 mobility drills for desk workers',
    body: [
      'Three simple drills to loosen your hips and shoulders, plus our favourite protein breakfast.',
      'You are receiving this because you subscribed on our website. Unsubscribe any time at the bottom of this email.',
    ],
    link: { text: 'Read the full article', href: 'https://northwind-fitness.com/blog/mobility-drills' },
    why: 'You asked for it, the sender and links share one consistent domain, and it only offers reading and an unsubscribe option.',
  },
  {
    id: 'l-it-maint',
    skill: 'email',
    kind: 'legit',
    from: { name: 'Contoso IT Service Desk', addr: 'servicedesk@contoso.com' },
    subject: 'Planned maintenance Saturday 02:00-04:00',
    body: [
      'The file servers will be unavailable on Saturday between 02:00 and 04:00 for planned updates.',
      'No action is needed. Details are on the intranet status page as usual.',
    ],
    why: 'It is from your real IT domain, tells you no action is needed, and sends you to the intranet page you already know rather than a link. It asks for nothing.',
  },
  {
    id: 'l-order',
    skill: 'email',
    kind: 'legit',
    context: 'You bought a pair of trainers from Fabrikam Store an hour ago.',
    from: { name: 'Fabrikam Store', addr: 'orders@fabrikam-store.com' },
    subject: 'Order confirmed: FS-20931',
    body: [
      'Thanks for your order, Sam. Your Trail Runner 2 (size 9) will ship in 1-2 working days to the address you gave us.',
      'Order total: £64.00, paid by card ending 4821.',
    ],
    link: { text: 'View your order', href: 'https://fabrikam-store.com/orders/FS-20931' },
    why: 'You made this purchase, it uses your name and an order number, shows only the last four card digits, and the link goes to the same store domain.',
  },
  {
    id: 'l-manager-expense',
    skill: 'email',
    kind: 'legit',
    context: 'You and Taylor agreed yesterday that you would send your conference expenses.',
    from: { name: 'Taylor Reed', addr: 'taylor.reed@contoso.com' },
    subject: 'Re: Conference expenses',
    body: [
      'Thanks for sending these over. I have approved the train fare and hotel. I could not approve the dinner receipt because it was missing the itemised bill. Could you resend that one?',
    ],
    why: 'It is a reply in a conversation you started, from a colleague on the company domain, referring to details only they would know. Nothing is urgent, and it asks for a normal follow-up.',
  },
  {
    id: 'l-bank-statement',
    skill: 'email',
    kind: 'legit',
    from: { name: 'Northwind Bank', addr: 'statements@northwindbank.com' },
    subject: 'Your October statement is ready',
    body: [
      'Hi Sam, your latest statement is now available in the Northwind Bank app and online banking.',
      'We will never ask for your PIN, password or full card number by email.',
    ],
    why: 'It contains no link and no request. It tells you to open the app yourself, uses your name, and states that the bank will never ask for secrets by email.',
  },
  {
    id: 'l-security-alert',
    skill: 'identity',
    kind: 'legit',
    context: 'You signed in from your laptop a few minutes ago.',
    from: { name: 'Contoso Accounts', addr: 'security-noreply@accounts.contoso.com' },
    subject: 'New sign-in to your Contoso account',
    body: [
      'We noticed a new sign-in: Chrome on Windows, London, UK.',
      'If this was you, no action is needed. If it was not, review your account activity and change your password.',
    ],
    link: { text: 'Review account activity', href: 'https://accounts.contoso.com/activity' },
    why: 'It matches something you really just did, the sender and link are on the real accounts.contoso.com address, and "if this was you, do nothing" is the safe default. Real security alerts look like this.',
  },
  {
    id: 'l-hr-benefits',
    skill: 'email',
    kind: 'legit',
    context: 'HR announced at the all-hands that benefits enrolment opens next week.',
    from: { name: 'Contoso People Team', addr: 'people@contoso.com' },
    subject: 'Benefits enrolment opens Monday',
    body: [
      'As announced at the all-hands, benefits enrolment opens on Monday and closes in three weeks.',
      'You can enrol through the benefits section of the staff portal at the usual address.',
    ],
    why: 'It matches what was announced publicly, comes from the real internal domain, gives you three weeks rather than hours, and points to the portal you already use.',
  },
  {
    id: 'l-parcel-out',
    skill: 'email',
    kind: 'legit',
    context: 'You ordered a desk lamp last week and have the tracking number.',
    from: { name: 'ParcelGo', addr: 'tracking@parcelgo.com' },
    subject: 'Your parcel is out for delivery today',
    body: [
      'Your parcel PG-7712-3398 is out for delivery and should arrive between 12:00 and 16:00.',
    ],
    link: { text: 'Track your parcel', href: 'https://parcelgo.com/track/PG-7712-3398' },
    why: 'It matches a parcel you are waiting for and quotes the same tracking number, the domain is the real one, and nothing asks you to pay or sign in.',
  },
  {
    id: 'l-meeting-notes',
    skill: 'email',
    kind: 'legit',
    context: 'You were in this planning meeting an hour ago.',
    from: { name: 'Jamie Cole', addr: 'jamie.cole@contoso.com' },
    subject: 'Notes from this morning\'s planning meeting',
    body: [
      'Hi all, here are the notes and action items from this morning. Please check your name against the actions and shout if I got anything wrong.',
    ],
    attachment: 'Q3-planning-notes.pdf',
    why: 'You were at the meeting, the sender is a colleague on your company domain, and the attachment is a genuine .pdf matching what was discussed.',
  },
  {
    id: 'l-receipt',
    skill: 'email',
    kind: 'legit',
    context: 'You subscribed to Fabrikam Music two days ago.',
    from: { name: 'Fabrikam Music Billing', addr: 'billing@fabrikam-music.com' },
    subject: 'Receipt for your subscription',
    body: [
      'Hi Sam, thanks for your payment of £9.99 for Fabrikam Music Premium (monthly), charged to the card ending 4821.',
      'Manage or cancel your subscription any time in your account settings.',
    ],
    link: { text: 'Manage subscription', href: 'https://fabrikam-music.com/account/billing' },
    why: 'It confirms something you signed up for, at the amount you expect, with your name and last four digits. It offers a cancel option in your account on the same domain, and does not ask you to call anyone.',
  },
];

// Everything the game draws from.
export const SCENARIOS = [...CORE, ...EXTRA, ...MORE];
