import { useState, useEffect } from "react";

export default function LandingPage() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setReady(true), 80);
        return () => clearTimeout(t);
    }, []);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;800&family=Outfit:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #080808;
          font-family: 'Outfit', sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
          height: 100vh;
        }

        .bg {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 50% 0%, rgba(212,160,23,0.11) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 15% 80%, rgba(212,160,23,0.05) 0%, transparent 60%);
        }

        .grid-bg {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 75%);
        }

        .page {
          position: relative;
          z-index: 1;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        @keyframes logoIn {
          from { opacity: 0; transform: scale(0.82) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,160,23,0.25); }
          50%       { box-shadow: 0 0 0 18px rgba(212,160,23,0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .logo-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          margin-bottom: 52px;
          opacity: 0;
          animation: logoIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.08s forwards;
        }

        .logo-mark {
          width: 72px;
          height: 72px;
          background: #D4A017;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 3s ease-in-out 1s infinite;
          position: relative;
        }
        .logo-mark::after {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 21px;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent 60%);
          pointer-events: none;
        }

        .logo-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          font-size: 1.5rem;
          letter-spacing: -0.04em;
          background: linear-gradient(
            90deg,
            #888 0%,
            #f2f2f2 30%,
            #D4A017 50%,
            #f2f2f2 70%,
            #888 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear 0.8s infinite;
        }

        .actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          opacity: 0;
          animation: fadeUp 0.6s ease 0.45s forwards;
        }

        .btn-login {
          background: #D4A017;
          color: #080808;
          border: none;
          border-radius: 12px;
          padding: 14px 40px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.92rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 28px rgba(212,160,23,0.25);
          min-width: 200px;
        }
        .btn-login:hover {
          background: #E8B84B;
          transform: translateY(-2px);
          box-shadow: 0 8px 36px rgba(212,160,23,0.35);
        }
        .btn-login:active { transform: translateY(0); }

        .btn-info {
          background: transparent;
          color: rgba(255,255,255,0.35);
          border: none;
          padding: 8px 16px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: color 0.2s;
        }
        .btn-info:hover { color: rgba(255,255,255,0.7); }

        .version {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.68rem;
          color: rgba(255,255,255,0.15);
          letter-spacing: 0.08em;
          font-weight: 500;
          opacity: 0;
          animation: fadeUp 0.5s ease 0.7s forwards;
          white-space: nowrap;
        }
      `}</style>

            <div className="bg" />
            <div className="grid-bg" />

            <div className="page">
                <div className="logo-wrap">
                    <div className="logo-mark">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect x="3"  y="3"  width="11" height="11" rx="2" fill="#080808"/>
                            <rect x="18" y="3"  width="11" height="11" rx="2" fill="#080808" opacity="0.5"/>
                            <rect x="3"  y="18" width="11" height="11" rx="2" fill="#080808" opacity="0.5"/>
                            <rect x="18" y="18" width="11" height="11" rx="2" fill="#080808"/>
                        </svg>
                    </div>
                    <span className="logo-name">Gestionale</span>
                </div>

                <div className="actions">
                    <button className="btn-login" onClick={() => window.location.href = "/login"}>
                        Accedi al sistema
                    </button>
                    <button className="btn-info" onClick={() => window.location.href = "/info"}>
                        Come funziona?
                    </button>
                </div>
            </div>

            <span className="version">v2.0 · © 2025</span>
        </>
    );
}