// Pushes pending progress (scheduling + Fehlerheft) and keeps the header dot honest:
// ochre = changes not yet saved to GitHub, vermilion = the last save failed.
import { $, toast } from './util.js';
import { syncProgress, hasUnsynced, isDemo } from './store.js';

export function updateSyncDot(state) {
  const dot = $('#syncDot');
  if (!dot) return;
  dot.className = 'sync-dot ' + (state || (hasUnsynced() && !isDemo() ? 'pending' : ''));
  dot.title = state === 'error' ? 'Speichern fehlgeschlagen' : hasUnsynced() ? 'Noch nicht gespeichert' : '';
}

export async function sync(summary) {
  updateSyncDot();
  try {
    const did = await syncProgress(summary);
    updateSyncDot();
    return did;
  } catch (e) {
    updateSyncDot('error');
    toast(`Nicht gespeichert: ${e.message}. Wird beim nächsten Öffnen nachgeholt.`, 'error');
    return false;
  }
}
