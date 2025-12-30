import { ImageResponse } from 'next/og';

// Image metadata
export const alt = 'Linite - Bulk Linux Package Installer';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%),
                             radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.05) 2%, transparent 0%)`,
            backgroundSize: '100px 100px',
            opacity: 0.5,
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          {/* Linite Logo */}
          <div
            style={{
              width: '140px',
              height: '140px',
              borderRadius: '28px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
              boxShadow: '0 25px 70px rgba(59, 130, 246, 0.4)',
            }}
          >
            <svg
              width="90"
              height="90"
              viewBox="0 0 90 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Terminal/Package icon */}
              <rect x="15" y="15" width="60" height="60" rx="6" stroke="white" strokeWidth="4" fill="none"/>
              {/* Command prompt lines */}
              <line x1="27" y1="27" x2="27" y2="63" stroke="white" strokeWidth="4" strokeLinecap="round"/>
              <line x1="63" y1="27" x2="63" y2="63" stroke="white" strokeWidth="4" strokeLinecap="round"/>
              {/* Arrow/bracket */}
              <path d="M 35 33 L 47 45 L 35 57" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
              marginBottom: '24px',
              letterSpacing: '-0.02em',
            }}
          >
            Linite
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: '32px',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: 0,
              maxWidth: '900px',
              lineHeight: 1.4,
            }}
          >
            Bulk install apps on Linux with a single command
          </p>

          {/* Features */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              marginTop: '48px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '16px 24px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                }}
              />
              <span style={{ color: 'white', fontSize: '24px' }}>Curated Apps</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '16px 24px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                }}
              />
              <span style={{ color: 'white', fontSize: '24px' }}>All Distros</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '16px 24px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                }}
              />
              <span style={{ color: 'white', fontSize: '24px' }}>One Command</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
