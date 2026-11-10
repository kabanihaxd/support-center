import { TicketCategory } from '@shared/models';

export { DEMO_PASSWORD } from '../demo-accounts';

export const SEED_STAFF: readonly { id: string; name: string; email: string; role: 'admin' | 'agent'; jobTitle: string; active: boolean }[] = [
  { id: 'usr_admin', name: 'Olivia Bennett', email: 'admin@supportcenter.dev', role: 'admin', jobTitle: 'Support Lead', active: true },
  { id: 'usr_agent_1', name: 'Daniel Carter', email: 'agent@supportcenter.dev', role: 'agent', jobTitle: 'L2 Support Engineer', active: true },
  { id: 'usr_agent_2', name: 'Sophia Martinez', email: 'sophia.martinez@supportcenter.dev', role: 'agent', jobTitle: 'L1 Support Specialist', active: true },
  { id: 'usr_agent_3', name: 'Liam Johnson', email: 'liam.johnson@supportcenter.dev', role: 'agent', jobTitle: 'Network Engineer', active: true },
  { id: 'usr_agent_4', name: 'Ava Thompson', email: 'ava.thompson@supportcenter.dev', role: 'agent', jobTitle: 'L1 Support Specialist', active: true },
  { id: 'usr_agent_5', name: 'Noah Kim', email: 'noah.kim@supportcenter.dev', role: 'agent', jobTitle: 'Systems Administrator', active: true },
  { id: 'usr_agent_6', name: 'Mia Novak', email: 'mia.novak@supportcenter.dev', role: 'agent', jobTitle: 'L2 Support Engineer', active: false },
];

export const SEED_CUSTOMERS: readonly { name: string; company: string }[] = [
  { name: 'Emma Wilson', company: 'Northwind Traders' },
  { name: 'James Anderson', company: 'Contoso Ltd' },
  { name: 'Isabella Clark', company: 'Fabrikam Inc' },
  { name: 'Benjamin Lewis', company: 'Northwind Traders' },
  { name: 'Charlotte Walker', company: 'Adventure Works' },
  { name: 'Lucas Hall', company: 'Tailspin Toys' },
  { name: 'Amelia Young', company: 'Contoso Ltd' },
  { name: 'Henry Allen', company: 'Wide World Importers' },
  { name: 'Harper King', company: 'Fabrikam Inc' },
  { name: 'Alexander Wright', company: 'Litware' },
  { name: 'Evelyn Scott', company: 'Adventure Works' },
  { name: 'Michael Green', company: 'Proseware' },
  { name: 'Abigail Baker', company: 'Tailspin Toys' },
  { name: 'Ethan Adams', company: 'Wide World Importers' },
  { name: 'Emily Nelson', company: 'Litware' },
  { name: 'Jacob Hill', company: 'Proseware' },
  { name: 'Elizabeth Campbell', company: 'Northwind Traders' },
  { name: 'Logan Mitchell', company: 'Contoso Ltd' },
  { name: 'Sofia Roberts', company: 'Fabrikam Inc' },
  { name: 'Jackson Carter', company: 'Adventure Works' },
  { name: 'Avery Phillips', company: 'Litware' },
  { name: 'Sebastian Evans', company: 'Proseware' },
];

export const TICKET_TEMPLATES: Record<TicketCategory, readonly { title: string; description: string }[]> = {
  hardware: [
    { title: 'Laptop does not turn on after update', description: 'My laptop installed updates overnight and now it will not boot. The power LED blinks three times and the screen stays black.' },
    { title: 'Second monitor not detected', description: 'The external monitor connected through the docking station is no longer detected. I tried another cable with the same result.' },
    { title: 'Printer on 3rd floor is jamming', description: 'The shared printer near the meeting rooms jams on every second page. Several people in the team are affected.' },
    { title: 'Keyboard keys are not responding', description: 'Several keys (E, R and Enter) on my laptop keyboard stopped working. An external keyboard works fine.' },
    { title: 'Docking station keeps disconnecting', description: 'The docking station disconnects every few minutes, which drops my network connection and external displays.' },
    { title: 'Request for a new headset', description: 'My headset microphone is broken and customers cannot hear me during calls. Please provide a replacement.' },
  ],
  software: [
    { title: 'Outlook crashes when opening attachments', description: 'Outlook closes immediately when I open PDF attachments. Safe mode works, so it may be an add-in issue.' },
    { title: 'Cannot install the accounting app', description: 'The installer for the accounting application fails with error 1603. I need it for month-end closing.' },
    { title: 'Excel file is corrupted after saving', description: 'A shared Excel report became corrupted after saving. Excel says the file format or extension is not valid.' },
    { title: 'Teams calls have no audio', description: 'In Teams meetings I can see everyone but there is no audio in either direction. Other apps play sound normally.' },
    { title: 'License expired for design software', description: 'The design software shows a license-expired message and switched to read-only mode.' },
    { title: 'Browser redirects to unknown sites', description: 'Chrome sometimes opens unknown advertising pages. I am worried this might be malware.' },
  ],
  network: [
    { title: 'VPN disconnects every 10 minutes', description: 'When working from home the VPN connection drops roughly every 10 minutes and I lose access to internal systems.' },
    { title: 'Wi-Fi is very slow in meeting room B', description: 'The Wi-Fi in meeting room B is extremely slow, video calls freeze and screen sharing is not possible.' },
    { title: 'Cannot access shared network drive', description: 'The mapped drive S: shows as disconnected and I cannot open project files since this morning.' },
    { title: 'Internal portal is not reachable', description: 'The internal HR portal times out from the office network, but it works over mobile hotspot.' },
    { title: 'Office network down on 2nd floor', description: 'All wired connections on the 2nd floor are down. About 15 people are unable to work.' },
  ],
  access: [
    { title: 'Password reset for ERP account', description: 'My ERP account is locked after several failed login attempts. Please reset the password.' },
    { title: 'Access request: finance shared folder', description: 'I joined the finance team and need read/write access to the Finance shared folder.' },
    { title: 'MFA codes are not arriving', description: 'I changed my phone and no longer receive MFA codes, so I cannot sign in to any company app.' },
    { title: 'New employee onboarding accounts', description: 'A new colleague starts on Monday. Please create email, CRM and VPN accounts.' },
    { title: 'Remove access for departed employee', description: 'An employee left the company yesterday. Please disable all accounts and revoke VPN access.' },
    { title: 'Cannot sign in to CRM', description: 'The CRM shows "user not authorized" after the latest update, although I used it yesterday.' },
  ],
  other: [
    { title: 'Question about data backup policy', description: 'How often are our laptops backed up, and how can I restore a file deleted last week?' },
    { title: 'Request to set up a meeting room screen', description: 'We need help connecting the new TV in meeting room C to the conference system.' },
    { title: 'Phishing email received', description: 'I received a suspicious email asking me to confirm my password via a link. I did not click it.' },
    { title: 'Software recommendation for diagrams', description: 'Our team needs an approved tool for creating architecture diagrams. What can we use?' },
  ],
};

export const CUSTOMER_FOLLOW_UPS: readonly string[] = [
  'Any update on this? It is blocking my work.',
  'I restarted my computer as suggested, but the problem is still there.',
  'Thanks, I can confirm it works now.',
  'Attached a screenshot of the error message.',
  'This is also affecting two of my colleagues.',
  'Could someone take a look today, please?',
];

export const AGENT_REPLIES: readonly string[] = [
  'Thanks for reporting. I am looking into this now.',
  'Could you please restart the device and let me know if the issue persists?',
  'I have applied a fix on our side. Please check and confirm.',
  'I escalated this to the infrastructure team and will keep you updated.',
  'We identified the root cause and a patch is being deployed.',
  'Please try again now. Your access has been updated.',
];

export const INTERNAL_NOTES: readonly string[] = [
  'Same issue reported by another user last week — likely related to the latest update.',
  'Waiting for vendor response, ticket #4471 on their side.',
  'Checked logs: certificate expired on the gateway.',
];
