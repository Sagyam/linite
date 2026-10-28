import { ImageResponse } from 'next/og';

// Image metadata
export const alt = 'Linite: pick your apps, get one command';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// The dark theme of the site: the portfolio's navy, a sky glow, the mark, and the command it produces.
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(60% 55% at 50% 0%, rgba(78, 184, 240, 0.22), transparent 70%), #020817',
          color: '#f8fafc',
        }}
      >
        <svg width="132" height="132" viewBox="0 0 256 256">
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1688c4" />
              <stop offset="1" stopColor="#0c2f4c" />
            </linearGradient>
          </defs>
          <rect width="256" height="256" rx="58" fill="url(#bg)" />
          <rect x="52" y="52" width="66" height="66" rx="18" fill="#f4f1ea" />
          <rect x="138" y="52" width="66" height="66" rx="18" fill="#f4f1ea" />
          <rect x="52" y="138" width="66" height="66" rx="18" fill="#f4f1ea" />
          <path
            d="M142 146 L164 168 L142 190 M176 192 L204 192"
            fill="none"
            stroke="#f2b134"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div
          style={{
            display: 'flex',
            marginTop: 44,
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: '-0.03em',
          }}
        >
          Pick your apps. Get&nbsp;<span style={{ color: '#4eb8f0' }}>one command</span>.
        </div>

        <div style={{ display: 'flex', marginTop: 20, fontSize: 30, color: '#94a3b8' }}>
          A bulk app installer for Ubuntu, Fedora, Arch, NixOS and more.
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 48,
            padding: '20px 32px',
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.04)',
            fontFamily: 'monospace',
            fontSize: 28,
          }}
        >
          <span style={{ color: '#f2b134', marginRight: 16 }}>$</span>
          sudo apt install -y firefox vlc gimp obs-studio
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
