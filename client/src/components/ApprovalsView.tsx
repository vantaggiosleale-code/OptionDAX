import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface PendingApproval {
  id: number;
  userId: number;
  status: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}

export function ApprovalsView() {
  const [pendingUsers, setPendingUsers] = useState<PendingApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Fetch pending approvals
  const { data: pending, refetch } = trpc.approvals.getPending.useQuery(undefined, {
    enabled: true,
  });

  useEffect(() => {
    if (pending) {
      setPendingUsers(pending);
      setIsLoading(false);
    }
  }, [pending]);

  // Approve mutation
  const approveMutation = trpc.approvals.approve.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Reject mutation
  const rejectMutation = trpc.approvals.reject.useMutation({
    onSuccess: () => {
      setSelectedUserId(null);
      setRejectionReason('');
      setIsRejecting(false);
      refetch();
    },
  });

  const handleApprove = (userId: number) => {
    approveMutation.mutate({ userId });
  };

  const handleReject = (userId: number) => {
    setSelectedUserId(userId);
    setIsRejecting(true);
  };

  const handleConfirmReject = () => {
    if (selectedUserId) {
      rejectMutation.mutate({
        userId: selectedUserId,
        rejectionReason: rejectionReason || undefined,
      });
    }
  };

  const handleCancelReject = () => {
    setSelectedUserId(null);
    setRejectionReason('');
    setIsRejecting(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-400">Caricamento richieste di approvazione...</span>
      </div>
    );
  }

  if (pendingUsers.length === 0) {
    return (
      <div className="p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Nessuna Richiesta in Sospeso</h3>
        <p className="text-gray-400">Tutti gli account sono stati approvati o rifiutati.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <h2 className="text-xl font-bold text-muted-foreground">
          Richieste di Approvazione ({pendingUsers.length})
        </h2>
      </div>

      <div className="space-y-3">
        {pendingUsers.map((user) => (
          <div
            key={user.userId}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-white font-semibold">{user.userName}</h3>
                <p className="text-gray-400 text-sm">{user.userEmail}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Richiesta il {new Date(user.createdAt).toLocaleDateString('it-IT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleApprove(user.userId)}
                  disabled={approveMutation.isPending}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Approva
                </button>

                <button
                  onClick={() => handleReject(user.userId)}
                  disabled={rejectMutation.isPending}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Rifiuta
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rejection reason modal */}
      {isRejecting && selectedUserId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-4">Motivo del Rifiuto</h3>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Inserisci il motivo del rifiuto (opzionale)..."
              className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-4"
              rows={4}
            />

            <div className="flex gap-3">
              <button
                onClick={handleCancelReject}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md font-medium transition"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={rejectMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition flex items-center justify-center gap-2"
              >
                {rejectMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Conferma Rifiuto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
