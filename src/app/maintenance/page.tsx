'use client';

import { useEffect, useState } from 'react';

export default function MaintenancePage() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // Animate loading bar
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowMessage(true), 300);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <html lang="en">
      <head>
        <title>Varbe - Maintenance</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <div className="maintenance-container">
          {/* Animated background grid */}
          <div className="grid-background" />
          
          {/* Floating particles */}
          <div className="particles">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`,
                }}
              />
            ))}
          </div>

          <div className="content-wrapper">
            {/* Logo/Brand */}
            <div className={`logo ${showMessage ? 'visible' : ''}`}>
              <span className="logo-text">VARBE</span>
              <span className="logo-dot">.</span>
            </div>

            {/* Loading Section */}
            <div className={`loading-section ${showMessage ? 'fade-up' : ''}`}>
              {!showMessage ? (
                <>
                  <div className="loading-bar-container">
                    <div 
                      className="loading-bar"
                      style={{ width: `${loadingProgress}%` }}
                    />
                    <div className="loading-glow" style={{ left: `${loadingProgress}%` }} />
                  </div>
                  <div className="loading-text">
                    <span className="loading-label">INITIALIZING</span>
                    <span className="loading-percent">{loadingProgress}%</span>
                  </div>
                </>
              ) : (
                <div className="message-container">
                  <div className="status-badge">
                    <span className="status-dot" />
                    <span>MAINTENANCE MODE</span>
                  </div>
                  
                  <h1 className="main-heading">
                    We&apos;re Working on
                    <br />
                    <span className="highlight">Something Amazing</span>
                  </h1>
                  
                  <p className="description">
                    We&apos;re currently performing essential maintenance and improvements
                    to bring you a better experience. Our team is working hard to get
                    everything back online as soon as possible.
                  </p>

                  <div className="info-cards">
                    <div className="info-card">
                      <div className="card-icon">⚡</div>
                      <div className="card-content">
                        <h3>Performance Upgrades</h3>
                        <p>Optimizing for faster load times</p>
                      </div>
                    </div>
                    <div className="info-card">
                      <div className="card-icon">🛡️</div>
                      <div className="card-content">
                        <h3>Security Updates</h3>
                        <p>Enhancing data protection</p>
                      </div>
                    </div>
                    <div className="info-card">
                      <div className="card-icon">✨</div>
                      <div className="card-content">
                        <h3>New Features</h3>
                        <p>Exciting updates coming soon</p>
                      </div>
                    </div>
                  </div>

                  <div className="footer-message">
                    <p>Thank you for your patience. We&apos;ll be back shortly!</p>
                    <div className="social-hint">
                      Follow us for updates
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <style jsx global>{`
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Space Mono', monospace;
              background: #000000;
              color: #ffffff;
              min-height: 100vh;
              overflow-x: hidden;
            }

            .maintenance-container {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              padding: 2rem;
              background: 
                radial-gradient(ellipse at 20% 50%, rgba(120, 0, 255, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 50%, rgba(255, 0, 100, 0.1) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 100%, rgba(0, 200, 255, 0.1) 0%, transparent 50%),
                #000000;
            }

            .grid-background {
              position: absolute;
              inset: 0;
              background-image: 
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
              background-size: 50px 50px;
              animation: gridMove 20s linear infinite;
            }

            @keyframes gridMove {
              0% { transform: translateY(0); }
              100% { transform: translateY(50px); }
            }

            .particles {
              position: absolute;
              inset: 0;
              overflow: hidden;
              pointer-events: none;
            }

            .particle {
              position: absolute;
              width: 4px;
              height: 4px;
              background: rgba(255, 255, 255, 0.3);
              border-radius: 50%;
              bottom: -10px;
              animation: float linear infinite;
            }

            @keyframes float {
              0% {
                transform: translateY(0) scale(1);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              90% {
                opacity: 1;
              }
              100% {
                transform: translateY(-100vh) scale(0.5);
                opacity: 0;
              }
            }

            .content-wrapper {
              position: relative;
              z-index: 10;
              max-width: 800px;
              width: 100%;
              text-align: center;
            }

            .logo {
              margin-bottom: 3rem;
              opacity: 0;
              transform: translateY(-20px);
              transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .logo.visible {
              opacity: 1;
              transform: translateY(0);
            }

            .logo-text {
              font-size: 3rem;
              font-weight: 700;
              letter-spacing: 0.5em;
              background: linear-gradient(135deg, #ffffff 0%, #888888 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }

            .logo-dot {
              font-size: 3rem;
              font-weight: 700;
              color: #ff0066;
            }

            .loading-section {
              transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .loading-section.fade-up {
              animation: fadeIn 0.8s ease-out forwards;
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .loading-bar-container {
              position: relative;
              height: 4px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 2px;
              overflow: visible;
              margin-bottom: 1rem;
            }

            .loading-bar {
              height: 100%;
              background: linear-gradient(90deg, #ff0066, #7000ff, #00d4ff);
              border-radius: 2px;
              transition: width 0.1s linear;
              box-shadow: 0 0 20px rgba(255, 0, 102, 0.5);
            }

            .loading-glow {
              position: absolute;
              top: 50%;
              width: 20px;
              height: 20px;
              background: radial-gradient(circle, rgba(255, 0, 102, 0.8) 0%, transparent 70%);
              transform: translate(-50%, -50%);
              pointer-events: none;
            }

            .loading-text {
              display: flex;
              justify-content: space-between;
              font-size: 0.75rem;
              letter-spacing: 0.2em;
              color: rgba(255, 255, 255, 0.6);
            }

            .loading-percent {
              font-variant-numeric: tabular-nums;
            }

            .message-container {
              animation: fadeIn 0.8s ease-out;
            }

            .status-badge {
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.5rem 1rem;
              background: rgba(255, 0, 102, 0.1);
              border: 1px solid rgba(255, 0, 102, 0.3);
              border-radius: 100px;
              font-size: 0.7rem;
              letter-spacing: 0.2em;
              margin-bottom: 2rem;
            }

            .status-dot {
              width: 8px;
              height: 8px;
              background: #ff0066;
              border-radius: 50%;
              animation: pulse 2s ease-in-out infinite;
            }

            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(0.8); }
            }

            .main-heading {
              font-size: clamp(2rem, 5vw, 3.5rem);
              font-weight: 700;
              line-height: 1.2;
              margin-bottom: 1.5rem;
              letter-spacing: -0.02em;
            }

            .highlight {
              background: linear-gradient(135deg, #ff0066, #7000ff);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }

            .description {
              font-size: 1rem;
              line-height: 1.8;
              color: rgba(255, 255, 255, 0.7);
              max-width: 600px;
              margin: 0 auto 3rem;
            }

            .info-cards {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 1rem;
              margin-bottom: 3rem;
            }

            .info-card {
              display: flex;
              align-items: flex-start;
              gap: 1rem;
              padding: 1.5rem;
              background: rgba(255, 255, 255, 0.03);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 12px;
              text-align: left;
              transition: all 0.3s ease;
            }

            .info-card:hover {
              background: rgba(255, 255, 255, 0.05);
              border-color: rgba(255, 0, 102, 0.2);
              transform: translateY(-2px);
            }

            .card-icon {
              font-size: 1.5rem;
              flex-shrink: 0;
            }

            .card-content h3 {
              font-size: 0.9rem;
              font-weight: 700;
              margin-bottom: 0.25rem;
            }

            .card-content p {
              font-size: 0.75rem;
              color: rgba(255, 255, 255, 0.5);
            }

            .footer-message {
              padding-top: 2rem;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .footer-message p {
              font-size: 0.9rem;
              color: rgba(255, 255, 255, 0.6);
              margin-bottom: 0.5rem;
            }

            .social-hint {
              font-size: 0.75rem;
              color: rgba(255, 255, 255, 0.4);
              letter-spacing: 0.1em;
            }

            @media (max-width: 640px) {
              .maintenance-container {
                padding: 1rem;
              }

              .logo-text {
                font-size: 2rem;
                letter-spacing: 0.3em;
              }

              .logo-dot {
                font-size: 2rem;
              }

              .info-cards {
                grid-template-columns: 1fr;
              }
            }
          `}</style>
        </div>
      </body>
    </html>
  );
}

