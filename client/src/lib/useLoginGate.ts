import { useState } from 'react';
import { getStoredSecret, setStoredSecret, clearStoredSecret, apiFetch } from './api';

export function useLoginGate() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  async function check(secret?: string): Promise<boolean> {
    if (secret) setStoredSecret(secret);
    setChecking(true);
    setError('');
    try {
      // Use a protected endpoint — /api/ping is exempt from auth (health check)
      // so it can't tell us whether a password is required.
      await apiFetch('/api/keys');
      setAuthed(true);
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('authentication') || msg.includes('401') || msg.includes('Unauthorized')) {
        if (secret !== undefined) {
          setError('Wrong password.');
        } else {
          // First load — server requires auth, show the prompt
          setAuthed(false);
        }
      } else if (secret !== undefined) {
        setError('Could not reach server.');
      } else {
        // Network error on startup — assume open/dev mode
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

export { getStoredSecret };
