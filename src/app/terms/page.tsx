import { LegalDocument } from '@/components/common/legal-document';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Linite - Rules and guidelines for using our service.',
};

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service" lastUpdated="January 5, 2026">
      <h2>Agreement to Terms</h2>
      <p>
        By accessing or using Linite (the &ldquo;Service&rdquo;), you agree to be bound by these
        Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, do not use the
        Service.
      </p>

      <h2>Description of Service</h2>
      <p>Linite is a web-based tool that:</p>
      <ol>
        <li>Provides a curated catalog of Linux applications</li>
        <li>Generates package installation commands for various Linux distributions</li>
        <li>Aggregates package information from multiple sources (Flatpak, Snap, APT, AUR, etc.)</li>
        <li>Offers an administrative interface for managing the application catalog</li>
      </ol>
      <p>The Service is provided free of charge.</p>

      <h2>User Accounts</h2>

      <h3>Account Creation</h3>
      <ul>
        <li>You may browse the Service without an account</li>
        <li>Admin features require authentication via GitHub or Google OAuth</li>
        <li>You must provide accurate and complete information</li>
        <li>You are responsible for maintaining the confidentiality of your account</li>
        <li>You must be at least 13 years old to create an account</li>
      </ul>

      <h3>Account Responsibilities</h3>
      <p>You agree to:</p>
      <ul>
        <li>Keep your account credentials secure</li>
        <li>Notify us immediately of any unauthorized access</li>
        <li>Accept responsibility for all activities under your account</li>
        <li>Not share your account with others</li>
        <li>Not create multiple accounts to circumvent limitations</li>
      </ul>

      <h3>Account Termination</h3>
      <p>We reserve the right to:</p>
      <ul>
        <li>Suspend or terminate accounts that violate these Terms</li>
        <li>Remove content that violates these Terms</li>
        <li>Refuse service to anyone for any reason</li>
      </ul>
      <p>You may delete your account at any time through account settings or by contacting us.</p>

      <h2>Acceptable Use</h2>

      <h3>You MAY:</h3>
      <ul>
        <li>Use the Service for personal, educational, or commercial purposes</li>
        <li>Generate installation commands for any supported Linux distribution</li>
        <li>Share generated commands with others</li>
        <li>Contribute to the project via GitHub</li>
        <li>Use the Service in compliance with applicable laws</li>
      </ul>

      <h3>You MAY NOT:</h3>
      <ul>
        <li>Use the Service for any illegal purpose</li>
        <li>Attempt to gain unauthorized access to the Service</li>
        <li>Interfere with or disrupt the Service or servers</li>
        <li>Bypass rate limiting or security measures</li>
        <li>Scrape or harvest data using automated tools without permission</li>
        <li>Impersonate others or misrepresent your affiliation</li>
        <li>Upload malicious code, viruses, or harmful content</li>
        <li>Use the Service to distribute malware or malicious packages</li>
        <li>Abuse the admin interface (if you have access)</li>
        <li>Overload the Service with excessive requests</li>
      </ul>

      <h2>Package Installation Commands</h2>

      <h3>No Guarantee of Accuracy</h3>
      <ul>
        <li>Generated commands are provided &ldquo;as is&rdquo;</li>
        <li>We do not guarantee package availability, compatibility, or safety</li>
        <li>Package information is sourced from third-party APIs</li>
        <li>Packages may be outdated, unavailable, or incorrectly described</li>
      </ul>

      <h3>User Responsibility</h3>
      <p>You acknowledge that:</p>
      <ul>
        <li>
          <strong>You execute commands at your own risk</strong>
        </li>
        <li>You are responsible for reviewing commands before execution</li>
        <li>You should understand what each command does</li>
        <li>We are not liable for any damage caused by executing commands</li>
        <li>Package installation may require system administrative privileges</li>
        <li>Installing packages can modify your system</li>
      </ul>

      <h3>Third-Party Packages</h3>
      <ul>
        <li>
          Packages are maintained by third parties (distributions, Flathub, Snap, AUR, etc.)
        </li>
        <li>We do not control package content, quality, or security</li>
        <li>
          We are not responsible for package bugs, vulnerabilities, or malicious content
        </li>
        <li>You should verify packages from their official sources</li>
      </ul>

      <h2>Intellectual Property</h2>

      <h3>Our Rights</h3>
      <ul>
        <li>The Linite name, logo, and branding are our property</li>
        <li>The Service design and user interface are our property</li>
        <li>The application catalog curation is our work product</li>
        <li>The Service is licensed under the MIT License (see LICENSE file)</li>
      </ul>

      <h3>Open Source</h3>
      <ul>
        <li>Linite is open source software</li>
        <li>You may view, fork, and contribute to the source code on GitHub</li>
        <li>Contributions are subject to the MIT License</li>
        <li>The MIT License permits use, modification, and distribution with attribution</li>
      </ul>

      <h3>Third-Party Content</h3>
      <ul>
        <li>Application names, logos, and descriptions belong to their respective owners</li>
        <li>Package metadata is provided by third-party sources</li>
        <li>We claim no ownership of third-party applications or packages</li>
      </ul>

      <h2>User-Generated Content</h2>
      <p>If you have admin access and add content to the catalog:</p>
      <ul>
        <li>You grant us a license to use, display, and distribute the content</li>
        <li>You represent that you have rights to the content</li>
        <li>You are responsible for ensuring content accuracy</li>
        <li>We may remove or modify content at our discretion</li>
      </ul>

      <h2>Admin Access</h2>
      <p>Admin privileges are granted at our sole discretion:</p>
      <ul>
        <li>Admin access is for managing the application catalog</li>
        <li>Admins must not abuse their privileges</li>
        <li>Admins are responsible for content they add or modify</li>
        <li>We may revoke admin access at any time</li>
        <li>Admin actions are logged and monitored</li>
      </ul>

      <h2>External APIs and Services</h2>
      <p>The Service relies on third-party APIs:</p>
      <ul>
        <li>Flathub API</li>
        <li>Snapcraft API</li>
        <li>Repology API</li>
        <li>AUR (Arch User Repository) API</li>
      </ul>
      <p>We are not responsible for:</p>
      <ul>
        <li>Availability or downtime of external APIs</li>
        <li>Accuracy of data from external APIs</li>
        <li>Changes to external APIs that affect the Service</li>
      </ul>

      <h2>Rate Limiting</h2>
      <p>To ensure fair usage:</p>
      <ul>
        <li>API requests may be rate-limited</li>
        <li>Excessive requests may result in temporary blocks</li>
        <li>Automated access requires prior approval</li>
        <li>Contact us for higher rate limits or API access</li>
      </ul>

      <h2>Disclaimers</h2>

      <h3>NO WARRANTY</h3>
      <p>
        THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
        WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
      </p>
      <ul>
        <li>Warranties of merchantability</li>
        <li>Fitness for a particular purpose</li>
        <li>Non-infringement</li>
        <li>Accuracy, reliability, or completeness</li>
        <li>Uninterrupted or error-free operation</li>
        <li>Security from unauthorized access</li>
      </ul>

      <h3>NO SYSTEM DAMAGE LIABILITY</h3>
      <p>
        WE ARE NOT LIABLE FOR ANY DAMAGE TO YOUR COMPUTER SYSTEM, DATA LOSS, OR OTHER HARM
        RESULTING FROM:
      </p>
      <ul>
        <li>Use of the Service</li>
        <li>Execution of generated commands</li>
        <li>Installation of packages</li>
        <li>Reliance on package information</li>
        <li>Service downtime or errors</li>
      </ul>

      <h2>Limitation of Liability</h2>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
      <ul>
        <li>
          WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
          DAMAGES
        </li>
        <li>
          OUR TOTAL LIABILITY DOES NOT EXCEED $100 OR THE AMOUNT YOU PAID US (WHICH IS ZERO)
        </li>
        <li>THIS APPLIES EVEN IF WE WERE ADVISED OF THE POSSIBILITY OF DAMAGES</li>
      </ul>
      <p>
        Some jurisdictions do not allow liability limitations, so these may not apply to you.
      </p>

      <h2>Indemnification</h2>
      <p>
        You agree to indemnify and hold us harmless from any claims, damages, losses, or expenses
        (including legal fees) arising from:
      </p>
      <ul>
        <li>Your use of the Service</li>
        <li>Your violation of these Terms</li>
        <li>Your violation of any rights of others</li>
        <li>Content you submit (if applicable)</li>
        <li>Execution of commands generated by the Service</li>
      </ul>

      <h2>Service Modifications</h2>
      <p>We reserve the right to:</p>
      <ul>
        <li>Modify or discontinue the Service at any time</li>
        <li>Change features, functionality, or availability</li>
        <li>Update these Terms with notice</li>
        <li>Add or remove supported distributions or package sources</li>
      </ul>
      <p>We will provide notice of significant changes:</p>
      <ul>
        <li>Via email for major changes</li>
        <li>On the website</li>
        <li>In the GitHub repository</li>
      </ul>
      <p>Continued use after changes constitutes acceptance.</p>

      <h2>Third-Party Links</h2>
      <p>The Service may contain links to third-party websites:</p>
      <ul>
        <li>We are not responsible for third-party content</li>
        <li>Third-party sites have their own terms and privacy policies</li>
        <li>We do not endorse third-party sites</li>
      </ul>

      <h2>Termination</h2>
      <p>We may terminate or suspend your access immediately:</p>
      <ul>
        <li>For violations of these Terms</li>
        <li>For abusive behavior</li>
        <li>For illegal activity</li>
        <li>At our sole discretion</li>
      </ul>
      <p>Upon termination:</p>
      <ul>
        <li>Your right to use the Service ceases</li>
        <li>We may delete your account and data</li>
        <li>Provisions intended to survive termination remain in effect</li>
      </ul>

      <h2>Governing Law</h2>
      <p>These Terms are governed by:</p>
      <ul>
        <li>The laws of Nepal</li>
        <li>Without regard to conflict of law provisions</li>
      </ul>
      <p>Disputes will be resolved in the courts of Nepal.</p>

      <h2>Dispute Resolution</h2>
      <p>Before filing a lawsuit:</p>
      <ol>
        <li>Contact us at sagyamthapa32@gmail.com</li>
        <li>Attempt to resolve the issue informally</li>
        <li>Provide at least 30 days for resolution</li>
      </ol>

      <h2>Severability</h2>
      <p>If any provision of these Terms is found unenforceable:</p>
      <ul>
        <li>The unenforceable provision is modified to be enforceable</li>
        <li>Other provisions remain in full effect</li>
      </ul>

      <h2>Entire Agreement</h2>
      <p>
        These Terms, together with the <Link href="/privacy">Privacy Policy</Link>, constitute the
        entire agreement between you and us regarding the Service.
      </p>

      <h2>No Waiver</h2>
      <p>
        Our failure to enforce any provision does not waive our right to enforce it later.
      </p>

      <h2>Assignment</h2>
      <p>
        You may not assign these Terms without our consent. We may assign these Terms to any
        successor or affiliate.
      </p>

      <h2>Force Majeure</h2>
      <p>
        We are not liable for delays or failures caused by circumstances beyond our control,
        including:
      </p>
      <ul>
        <li>Natural disasters</li>
        <li>War, terrorism, or civil unrest</li>
        <li>Internet or network failures</li>
        <li>Third-party service outages</li>
        <li>Government actions</li>
      </ul>

      <h2>Contact Information</h2>
      <p>For questions about these Terms:</p>
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

      <h2>Open Source License</h2>
      <p>The Linite source code is licensed under the MIT License:</p>
      <pre>
        {`MIT License

Copyright (c) 2026 Sagyam Thapa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
      </pre>

      <h2>Acknowledgment</h2>
      <p>By using the Service, you acknowledge that:</p>
      <ul>
        <li>You have read and understood these Terms</li>
        <li>You agree to be bound by these Terms</li>
        <li>You are authorized to accept these Terms</li>
        <li>You understand the risks of installing packages on your system</li>
      </ul>

      <p className="text-center font-semibold mt-8">Thank you for using Linite!</p>
    </LegalDocument>
  );
}