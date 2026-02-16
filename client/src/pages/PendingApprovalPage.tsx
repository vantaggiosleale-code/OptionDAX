import React, { useEffect } from 'react';
import { Clock, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../_core/hooks/useAuth';

export const PendingApprovalPage: React.FC = () => {
    const { user, refresh } = useAuth();

    // Auto-refresh ogni 10 secondi per verificare se l'account è stato approvato
    useEffect(() => {
        const interval = setInterval(() => {
            refresh();
        }, 10000); // 10 secondi

        return () => clearInterval(interval);
    }, [refresh]);

    // Se l'utente è stato approvato, ricarica la pagina per accedere alla dashboard
    useEffect(() => {
        if (user?.status === 'approved') {
            window.location.reload();
        }
    }, [user?.status]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <Clock className="w-10 h-10 text-yellow-400" />
                    </div>
                </div>

                {/* Titolo */}
                <h1 className="text-3xl font-bold text-white text-center mb-4">
                    Account in Attesa di Approvazione
                </h1>

                {/* Messaggio */}
                <p className="text-gray-300 text-center mb-6 leading-relaxed">
                    Grazie per esserti registrato su <span className="font-semibold text-blue-400">Option DAX</span>!
                    Il tuo account è attualmente in fase di revisione da parte del nostro team.
                </p>

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm text-gray-300">
                                Riceverai una <span className="font-semibold text-blue-400">notifica via email</span> non appena il tuo account sarà approvato.
                            </p>
                        </div>
                    </div>
                </div>

                {/* User Info */}
                {user && (
                    <div className="bg-white/5 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-400 mb-1">Account registrato:</p>
                        <p className="text-white font-medium">{user.email || user.name}</p>
                    </div>
                )}

                {/* Auto-refresh indicator */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifica automatica in corso...</span>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-white/10">
                    <p className="text-xs text-gray-500 text-center">
                        Hai bisogno di assistenza?{' '}
                        <a href="mailto:support@optiondax.it" className="text-blue-400 hover:text-blue-300 transition">
                            Contattaci
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};
