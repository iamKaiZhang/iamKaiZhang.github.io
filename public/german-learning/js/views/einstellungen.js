import { $, $$, escapeHtml, store, toast } from '../util.js';
import * as gh from '../github.js';
import * as S from '../store.js';
import { data } from '../store.js';
import { allScenes } from '../scenes.js';

export default {
  render(root) {
    const scenes = allScenes();
    const mode = store.get('wr_scene_mode', 'random');
    const voices = ('speechSynthesis' in window) ? speechSynthesis.getVoices().filter(v => v.lang?.toLowerCase().startsWith('de')) : [];
    root.innerHTML = `
      <section class="sheet">
        <p class="eyebrow">Einstellungen</p>
        <h2>Verbindung zu deinem Repo</h2>
        <p class="muted small">Wortreise liest und schreibt deine Lerndaten direkt in deinem GitHub-Repo. Der Token bleibt nur in diesem Browser.
          Nötig ist ein Fine-grained Token mit Lese- und Schreibzugriff auf „Contents“ für dieses eine Repo.</p>
        <form id="conn">
          <div class="field"><label for="repo">Repository</label><input id="repo" autocomplete="off" spellcheck="false" value="${escapeHtml(gh.ghRepo())}"></div>
          <div class="field"><label for="pat">GitHub-Token</label><input id="pat" type="password" autocomplete="off" spellcheck="false" placeholder="${gh.ghPat() ? '(gespeichert)' : 'github_pat_…'}"></div>
          <div class="row"><button class="btn" type="submit">Speichern und prüfen</button>${gh.ghPat() ? '<button class="link red" type="button" id="logout">Token entfernen</button>' : ''}</div>
        </form>
        <p class="small muted mt" id="connState">${S.isDemo() ? 'Zurzeit: Beispieldaten (kein Token).' : `Zurzeit verbunden mit ${escapeHtml(gh.ghRepo())}.`}</p>
      </section>

      <section class="sheet">
        <p class="eyebrow">Lernen</p>
        <div class="grid2">
          <div class="field"><label for="newPerDay">Neue Karten pro Tag</label><input id="newPerDay" type="number" min="0" max="50" value="${data.srs.settings.newPerDay ?? 10}"><span class="help">Jede Richtung zählt als eigene Karte.</span></div>
          <div class="field"><label for="dirs">Richtung</label><select id="dirs">
            <option value="both">Deutsch ↔ Englisch</option><option value="de">nur Deutsch → Englisch</option><option value="en">nur Englisch → Deutsch</option></select></div>
        </div>
        <div class="field"><label for="voice">Stimme für die Aussprache</label><select id="voice"><option value="">Standard</option>${voices.map(v => `<option ${store.get('wr_voice') === v.name ? 'selected' : ''}>${escapeHtml(v.name)}</option>`).join('')}</select>
          <span class="help">${voices.length ? 'Stimmen deines Geräts mit deutscher Sprache.' : 'Dein Browser bietet keine deutsche Stimme an.'}</span></div>
        <button class="btn" type="button" id="saveLearn">Speichern</button>
      </section>

      <section class="sheet">
        <p class="eyebrow">Hintergrund</p>
        <div class="choice-list" id="sceneMode">
          <button type="button" data-m="random" aria-pressed="${mode === 'random'}"><b>Bei jedem Öffnen ein anderer Ort</b><span>${scenes.length} Orte, nie zweimal hintereinander derselbe.</span></button>
          <button type="button" data-m="daily" aria-pressed="${mode === 'daily'}"><b>Ein Ort pro Tag</b><span>Der ganze Tag spielt an einem Ort.</span></button>
          <button type="button" data-m="fixed" aria-pressed="${mode === 'fixed'}"><b>Immer derselbe Ort</b><span>Wähle unten deinen Lieblingsort.</span></button>
        </div>
        <div class="field"><label for="fixedScene">Lieblingsort</label><select id="fixedScene">${scenes.map(s => `<option value="${escapeHtml(s.file)}" ${store.get('wr_scene_fixed') === s.file ? 'selected' : ''}>${escapeHtml(s.place)}</option>`).join('')}</select></div>
      </section>

      <section class="sheet">
        <p class="eyebrow">Daten in diesem Browser</p>
        <p class="muted small">Wortreise hält eine Kopie deiner Daten im Browser, damit die Seite sofort öffnet und offline funktioniert. ${S.hasUnsynced() ? '<b>Es gibt noch nicht gespeicherten Lernstand.</b>' : 'Alles ist gespeichert.'}</p>
        <div class="row"><button class="link" type="button" id="syncNow">Jetzt speichern</button><button class="link red" type="button" id="clear">Lokale Kopie löschen</button></div>
      </section>`;

    $('#dirs').value = data.srs.settings.directions || 'both';

    $('#conn').addEventListener('submit', async e => {
      e.preventDefault();
      const repo = $('#repo').value.trim() || gh.DEFAULT_REPO;
      const pat = $('#pat').value.trim();
      store.set('gh_repo', repo);
      if (pat) store.set('gh_pat', pat);
      if (!gh.ghPat()) { toast('Ohne Token zeigt Wortreise Beispieldaten.'); return; }
      $('#connState').textContent = 'Prüfe Verbindung …';
      try {
        const info = await gh.checkAccess();
        $('#connState').textContent = info.canWrite ? `Verbunden mit ${info.name}. Lesen und Schreiben funktioniert.` : `Verbunden mit ${info.name}, aber nur mit Lesezugriff. Für das Speichern braucht der Token Schreibrechte auf „Contents“.`;
        toast('Verbunden. Daten werden geladen …');
        setTimeout(() => { location.hash = '#heute'; location.reload(); }, 900);
      } catch (err) {
        $('#connState').textContent = err.message;
      }
    });
    $('#logout')?.addEventListener('click', () => { store.remove('gh_pat'); toast('Token entfernt.'); setTimeout(() => location.reload(), 600); });

    $('#saveLearn').addEventListener('click', () => {
      data.srs.settings.newPerDay = Math.max(0, Math.min(50, Number($('#newPerDay').value) || 0));
      data.srs.settings.directions = $('#dirs').value;
      store.set('wr_voice', $('#voice').value);
      S.markDirty();
      toast('Gespeichert.');
    });

    $('#sceneMode').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      store.set('wr_scene_mode', b.dataset.m);
      if (b.dataset.m === 'fixed') store.set('wr_scene_fixed', $('#fixedScene').value);
      $$('#sceneMode button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      toast('Gilt ab dem nächsten Öffnen.');
    });
    $('#fixedScene').addEventListener('change', e => store.set('wr_scene_fixed', e.target.value));

    $('#syncNow').addEventListener('click', async () => {
      try { const did = await S.syncProgress('manuell'); toast(did ? 'Gespeichert.' : 'Es gab nichts zu speichern.'); } catch (err) { toast(err.message, 'error'); }
    });
    let armed = false;
    $('#clear').addEventListener('click', e => {
      if (!armed) { armed = true; e.target.textContent = 'Wirklich löschen? Nicht gespeicherter Lernstand geht verloren.'; return; }
      try {
        for (const k of Object.keys(localStorage)) if (k.startsWith('wr_core') || k.startsWith('wr_dirty') || k.startsWith('wr_demo')) localStorage.removeItem(k);
      } catch { /* ignore */ }
      toast('Lokale Kopie gelöscht.');
      setTimeout(() => location.reload(), 700);
    });
  },
};
