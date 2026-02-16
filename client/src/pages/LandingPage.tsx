import { useState } from 'react';
import { getLoginUrl } from '@/const';
import { AlertCircle } from 'lucide-react';

export function LandingPage() {
  const [disclamerAccepted, setDisclaimerAccepted] = useState(false);

  const handleGoogleLogin = () => {
    if (disclamerAccepted) {
      // Redirect to Google OAuth login (Google only)
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full shadow-lg overflow-hidden bg-white">
            <img 
              src="/logo-circle.png" 
              alt="Option DAX Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Option DAX</h1>
          <p className="text-slate-400 text-lg">Trading Options Analytics</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">Accedi alla Piattaforma</h2>
          <p className="text-slate-400 mb-8">Accesso riservato ai frequentanti del corso</p>

          {/* Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={!disclamerAccepted}
            className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-3 transition-all duration-200 mb-6 ${
              disclamerAccepted
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-lg hover:shadow-xl'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Accedi con Google
          </button>

          {/* Disclaimer Checkbox */}
          <div className="bg-slate-700 rounded-lg p-4 mb-6 border border-slate-600">
            <div className="flex gap-3">
              <input
                type="checkbox"
                id="disclaimer"
                checked={disclamerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                className="w-5 h-5 rounded border-slate-500 text-blue-600 cursor-pointer flex-shrink-0 mt-0.5"
              />
              <label htmlFor="disclaimer" className="cursor-pointer flex-1">
                <p className="text-sm text-slate-300 leading-relaxed">
                  <span className="font-semibold text-white">Dichiaro di aver frequentato il corso Option DAX</span> e accetto che questa piattaforma è riservata esclusivamente ai partecipanti al corso. Mi impegno a non diffondere l'accesso o i contenuti all'esterno.
                </p>
              </label>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-1">Approvazione Richiesta</p>
              <p>La tua iscrizione dovrà essere approvata da un amministratore. Riceverai una email di conferma una volta approvato.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>© 2026 Option DAX Trading System</p>
          <p className="mt-2">Software by Opzionetika</p>
        </div>
      </div>
    </div>
  );
}
