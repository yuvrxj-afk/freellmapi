import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { setStoredSecret, clearStoredSecret, apiFetch } from '@/lib/api';

export function useLoginGate() {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  async function check(secret?: string): Promise<boolean> {
    if (secret) setStoredSecret(secret);
    setChecking(true);
    setError('');
    try {
      await apiFetch('/api/ping');
      setAuthed(true);
      return true;
    } catch (e: any) {
      if (e.message?.includes('authentication') || e.message?.includes('401')) {
        setError('Wrong password.');
      } else if (secret !== undefined) {
        // Network error during explicit login attempt — still block
        setError('Could not reach server.');
      } else {
        // Startup check failed (server unreachable) — assume open/dev mode
        setAuthed(true);
        return true;
      }
      clearStoredSecret();
      setAuthed(false);
      return false;
    } finally {
      setChecking(false);
    }
  }

  function logout() {
    clearStoredSecret();
    setAuthed(false);
    setError('');
  }

  return { authed, checking, error, check, logout };
}

export function LoginScreen({
  checking,
  error,
  onSubmit,
}: {
  checking: boolean;
  error: string;
  onSubmit: (password: string) => void;
}) {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        {/* Brand mark */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <span className="inline-block size-2 rounded-full bg-foreground" />
          <span className="font-semibold tracking-tight text-sm">FreeLLMAPI</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="dashboard-password"
              className="text-sm font-medium text-foreground"
            >
              Dashboard password
            </label>
            <input
              id="dashboard-password"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                         ring-offset-background placeholder:text-muted-foreground
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                         focus-visible:ring-offset-2 disabled:opacity-50"
              disabled={checking}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={checking || !value.trim()}>
            {checking ? 'Checking…' : 'Unlock dashboard'}
          </Button>
        </form>
      </div>
    </div>
  );
}
