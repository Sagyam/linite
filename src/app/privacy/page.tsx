import { LegalDocument } from '@/components/common/legal-document';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Linite - Learn how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" lastUpdated="January 5, 2026">
      <h2>Introduction</h2>
      <p>
        Linite (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates{' '}
        <Link href="/">linite.sagyamthapa.com.np</Link> (the &ldquo;Service&rdquo;). This Privacy
        Policy explains how we collect, use, disclose, and safeguard your information when you use
        our Service.
      </p>
      <p>
        By using the Service, you agree to the collection and use of information in accordance with
        this policy.
      </p>

      <h2>Information We Collect</h2>

      <h3>1. Information You Provide</h3>
      <p>When you create an account or use our Service, we collect:</p>
      <ul>
        <li>
          <strong>Email address</strong>: Used for account creation and authentication
        </li>
        <li>
          <strong>Name</strong>: Display name from your OAuth provider
        </li>
        <li>
          <strong>Profile picture</strong>: Avatar image from your OAuth provider
        </li>
      </ul>

      <h3>2. Authentication Data</h3>
      <p>We use third-party OAuth providers for authentication:</p>
      <ul>
        <li>
          <strong>GitHub OAuth</strong>: When you sign in with GitHub, we receive your email, name,
          and profile picture
        </li>
        <li>
          <strong>Google OAuth</strong>: When you sign in with Google, we receive your email, name,
          and profile picture
        </li>
      </ul>
      <p>
        We store OAuth tokens (access tokens, refresh tokens, ID tokens) securely to maintain your
        authenticated session.
      </p>

      <h3>3. Automatically Collected Information</h3>
      <p>When you use our Service, we automatically collect:</p>
      <ul>
        <li>
          <strong>Session data</strong>: IP address, user agent, session tokens
        </li>
        <li>
          <strong>Usage data</strong>: App selections and installation command generation (not
          permanently stored)
        </li>
        <li>
          <strong>Rate limiting data</strong>: Request counts to prevent API abuse
        </li>
      </ul>

      <h3>4. Information We Do NOT Collect</h3>
      <ul>
        <li>
          <strong>Installation history</strong>: We do not track which apps you install or commands
          you execute
        </li>
        <li>
          <strong>Payment information</strong>: The Service is free and does not collect financial
          data
        </li>
        <li>
          <strong>Personal identification beyond OAuth</strong>: No phone numbers, addresses, or
          additional personal details
        </li>
        <li>
          <strong>Browsing behavior</strong>: No third-party tracking cookies or analytics beyond
          basic usage
        </li>
      </ul>

      <h2>How We Use Your Information</h2>
      <p>We use collected information to:</p>
      <ol>
        <li>
          <strong>Provide the Service</strong>: Generate package installation commands based on your
          selections
        </li>
        <li>
          <strong>Authentication</strong>: Verify your identity and maintain secure sessions
        </li>
        <li>
          <strong>Admin access</strong>: Grant administrative privileges to authorized users
        </li>
        <li>
          <strong>Rate limiting</strong>: Prevent API abuse and ensure fair usage
        </li>
        <li>
          <strong>Service improvement</strong>: Understand usage patterns to improve the Service
        </li>
        <li>
          <strong>Communication</strong>: Send service-related notifications (if necessary)
        </li>
      </ol>

      <h2>Data Storage and Security</h2>

      <h3>Storage Locations</h3>
      <p>Your data is stored in the following services:</p>
      <ul>
        <li>
          <strong>Turso (libSQL)</strong>: User accounts, sessions, and application catalog data
        </li>
        <li>
          <strong>Upstash Redis</strong>: Temporary rate limiting data
        </li>
        <li>
          <strong>Azure Blob Storage</strong>: Application icons (not user data)
        </li>
      </ul>

      <h3>Security Measures</h3>
      <p>We implement industry-standard security measures:</p>
      <ul>
        <li>
          <strong>Encryption</strong>: All data transmission uses HTTPS/TLS
        </li>
        <li>
          <strong>Secure authentication</strong>: OAuth 2.0 with secure token storage
        </li>
        <li>
          <strong>Access control</strong>: Role-based access for admin functionality
        </li>
        <li>
          <strong>Database security</strong>: Authenticated connections to Turso database
        </li>
        <li>
          <strong>Session management</strong>: Secure session tokens with expiration
        </li>
        <li>
          <strong>Rate limiting</strong>: Protection against abuse and DoS attacks
        </li>
      </ul>

      <h3>Data Retention</h3>
      <ul>
        <li>
          <strong>Active accounts</strong>: Data retained while your account is active
        </li>
        <li>
          <strong>Inactive accounts</strong>: May be deleted after extended periods of inactivity
        </li>
        <li>
          <strong>Session data</strong>: Automatically expired based on session timeout
        </li>
        <li>
          <strong>Rate limiting data</strong>: Cleared periodically (typically within 24 hours)
        </li>
      </ul>

      <h2>Third-Party Services</h2>
      <p>We use the following third-party services that may collect data:</p>

      <h3>Authentication Providers</h3>
      <ul>
        <li>
          <strong>GitHub</strong>:{' '}
          <a
            href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Privacy Policy
          </a>
        </li>
        <li>
          <strong>Google</strong>:{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Privacy Policy
          </a>
        </li>
      </ul>

      <h3>Infrastructure and Storage</h3>
      <ul>
        <li>
          <strong>Vercel</strong>: Hosting platform -{' '}
          <a
            href="https://vercel.com/legal/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vercel Privacy Policy
          </a>
        </li>
        <li>
          <strong>Turso</strong>: Database hosting -{' '}
          <a href="https://turso.tech/privacy-policy" target="_blank" rel="noopener noreferrer">
            Turso Privacy Policy
          </a>
        </li>
        <li>
          <strong>Azure</strong>: Blob storage for icons -{' '}
          <a
            href="https://privacy.microsoft.com/en-us/privacystatement"
            target="_blank"
            rel="noopener noreferrer"
          >
            Microsoft Privacy Policy
          </a>
        </li>
        <li>
          <strong>Upstash</strong>: Redis for rate limiting -{' '}
          <a href="https://upstash.com/privacy" target="_blank" rel="noopener noreferrer">
            Upstash Privacy Policy
          </a>
        </li>
      </ul>

      <h3>External Package APIs</h3>
      <p>We query these APIs to fetch package information (no user data is shared):</p>
      <ul>
        <li>Flathub API</li>
        <li>Snapcraft API</li>
        <li>Repology API</li>
        <li>AUR (Arch User Repository)</li>
      </ul>

      <h2>Your Rights</h2>
      <p>You have the right to:</p>
      <ol>
        <li>
          <strong>Access</strong>: Request a copy of your personal data
        </li>
        <li>
          <strong>Correction</strong>: Update or correct your account information
        </li>
        <li>
          <strong>Deletion</strong>: Request deletion of your account and associated data
        </li>
        <li>
          <strong>Withdraw consent</strong>: Revoke permission for data processing
        </li>
        <li>
          <strong>Data portability</strong>: Export your data in a machine-readable format
        </li>
        <li>
          <strong>Object</strong>: Object to certain types of data processing
        </li>
      </ol>
      <p>To exercise these rights, contact us at sagyamthapa32@gmail.com.</p>

      <h2>Account Deletion</h2>
      <p>To delete your account:</p>
      <ol>
        <li>Sign in to the Service</li>
        <li>Navigate to account settings</li>
        <li>Request account deletion</li>
      </ol>
      <p>Or contact us at sagyamthapa32@gmail.com.</p>
      <p>Upon deletion, we will:</p>
      <ul>
        <li>Remove your user profile data</li>
        <li>Invalidate all active sessions</li>
        <li>Delete authentication tokens</li>
        <li>Retain anonymized logs for security purposes (if applicable)</li>
      </ul>

      <h2>Children&apos;s Privacy</h2>
      <p>
        The Service is not intended for users under 13 years of age. We do not knowingly collect
        personal information from children under 13. If you believe we have collected data from a
        child under 13, contact us immediately.
      </p>

      <h2>International Data Transfers</h2>
      <p>
        Your data may be transferred to and stored in servers located outside your country of
        residence. By using the Service, you consent to such transfers. We ensure appropriate
        safeguards are in place for international data transfers.
      </p>

      <h2>Cookies and Tracking</h2>
      <p>We use minimal cookies and tracking:</p>
      <ul>
        <li>
          <strong>Essential cookies</strong>: Required for authentication and session management
        </li>
        <li>
          <strong>No advertising cookies</strong>: We do not use third-party advertising trackers
        </li>
        <li>
          <strong>No analytics beyond basics</strong>: Minimal usage tracking for service
          functionality
        </li>
      </ul>

      <h2>Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy periodically. Changes will be posted on this page with an
        updated &ldquo;Last Updated&rdquo; date. Continued use of the Service after changes
        constitutes acceptance of the updated policy.
      </p>
      <p>We will notify users of significant changes via:</p>
      <ul>
        <li>Email notification (for major changes)</li>
        <li>Banner on the Service</li>
        <li>GitHub repository announcement</li>
      </ul>

      <h2>Open Source</h2>
      <p>
        Linite is open source software licensed under the MIT License. The source code is available
        at{' '}
        <a
          href="https://github.com/Sagyam/linite"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://github.com/Sagyam/linite
        </a>
        . While the code is public, user data and authentication credentials are not exposed.
      </p>

      <h2>Contact Us</h2>
      <p>If you have questions or concerns about this Privacy Policy:</p>
      <ul>
        <li>
          <strong>Email</strong>: sagyamthapa32@gmail.com
        </li>
        <li>
          <strong>GitHub Issues</strong>:{' '}
          <a
            href="https://github.com/Sagyam/linite/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://github.com/Sagyam/linite/issues
          </a>
        </li>
        <li>
          <strong>GitHub Discussions</strong>:{' '}
          <a
            href="https://github.com/Sagyam/linite/discussions"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://github.com/Sagyam/linite/discussions
          </a>
        </li>
      </ul>

      <h2>Legal Compliance</h2>
      <p>We comply with applicable data protection laws, including:</p>
      <ul>
        <li>GDPR (General Data Protection Regulation) for EU users</li>
        <li>CCPA (California Consumer Privacy Act) for California users</li>
        <li>Other applicable regional privacy laws</li>
      </ul>

      <h2>Data Breach Notification</h2>
      <p>
        In the event of a data breach that compromises your personal information, we will:
      </p>
      <ol>
        <li>Investigate and contain the breach</li>
        <li>Notify affected users within 72 hours</li>
        <li>Provide details about the breach and steps taken</li>
        <li>Offer guidance on protective measures</li>
      </ol>
    </LegalDocument>
  );
}