import React, { useEffect, useState } from "react";
import { INVITATION } from "./App";
import { AUDIENCES, AUDIENCE_KEYS, type AudienceKey } from "./audience";

type Prefix = "Mr." | "Mrs." | "Miss" | "Mr. & Mrs." | "Family" | "Dear";

/* "Dear" adds nothing: the greeting already starts with "ආදරණීය" (Dear). */
const PREFIXES: Array<{ value: Prefix; format: (name: string) => string }> = [
  { value: "Mr.", format: (n) => `Mr. ${n}` },
  { value: "Mrs.", format: (n) => `Mrs. ${n}` },
  { value: "Miss", format: (n) => `Miss ${n}` },
  { value: "Mr. & Mrs.", format: (n) => `Mr. & Mrs. ${n}` },
  { value: "Family", format: (n) => `${n} and Family` },
  { value: "Dear", format: (n) => n },
];

const GREETING = "ආදරණීය";

function buildDisplayName(prefix: Prefix, guestName: string) {
  const name = guestName.trim().replace(/\s+/g, " ");
  const option = PREFIXES.find((p) => p.value === prefix) ?? PREFIXES[0];
  return option.format(name);
}

function buildLink(displayName: string, audience: AudienceKey) {
  return `${window.location.origin}/${encodeURIComponent(displayName)}?a=${audience}`;
}

function buildMessage(displayName: string, link: string, audience: AudienceKey) {
  const { groom, bride } = INVITATION.couple;
  return `${GREETING} ${displayName} ❤️

එක්ව නව ජීවන ගමනක් ආරම්භ කරන, අපගේ ජීවිතයේ විශේෂිතම දිනය සමරන්නට ${AUDIENCES[audience].phrase} ප්‍රීතිමත් හදවතින් ආදරයෙන් ආරාධනා කරමු.

අපගේ විවාහ ආරාධනය සහ සියලු උත්සව විස්තර පහත සබැඳියෙන් බලන්න 🌐:

${link}

ඔබගේ පැමිණීම අපට ඉතා වටිනා වන අතර, මේ සුන්දර මොහොත ඔබ සමඟ සැමරීමට ලැබීම අපට මහත් ගෞරවයකි.

ආදරයෙන්,
❤️ ${groom} සහ ${bride}`;
}

interface HistoryItem {
  id: string;
  displayName: string;
  audience: AudienceKey;
  url: string;
  createdAt: string;
}

const HISTORY_KEY = "generatedLinks.v3";

/* Sensible audience default for each prefix (can still be changed) */
const DEFAULT_AUDIENCE: Record<Prefix, AudienceKey> = {
  "Mr.": "you",
  "Mrs.": "you",
  Miss: "you",
  "Mr. & Mrs.": "couple",
  Family: "family",
  Dear: "you",
};

function loadHistory(): HistoryItem[] {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable — history is a convenience only */
  }
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers without clipboard permission
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

export default function Admin() {
  const [prefix, setPrefix] = useState<Prefix>("Mr.");
  const [guestName, setGuestName] = useState("");
  const [audience, setAudience] = useState<AudienceKey>("you");
  const [result, setResult] = useState<{ displayName: string; link: string; message: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => setHistory(loadHistory()), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    const displayName = buildDisplayName(prefix, guestName);
    const link = buildLink(displayName, audience);
    setResult({ displayName, link, message: buildMessage(displayName, link, audience) });

    const item: HistoryItem = {
      id: crypto.randomUUID(),
      displayName,
      audience,
      url: link,
      createdAt: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    const next = [item, ...history.filter((h) => h.url !== link)].slice(0, 100);
    setHistory(next);
    saveHistory(next);
  };

  const copy = async (text: string, okMessage: string) => {
    setToast((await copyText(text)) ? okMessage : "පිටපත් කිරීම අසාර්ථකයි");
  };

  const removeItem = (id: string) => {
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    saveHistory(next);
  };

  const inputClass =
    "w-full bg-ivory border border-gold/35 rounded-xl px-4 py-3 text-ink text-lg focus:outline-none focus:border-gold-deep focus:ring-2 focus:ring-gold/20 transition-all";
  const secondaryBtn =
    "flex-1 rounded-full border border-gold/50 bg-ivory px-5 py-3 text-gold-deep text-base hover:bg-gold-pale/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="h-[100dvh] overflow-y-auto bg-paper text-ink py-10 md:py-14 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="text-center">
          <p className="font-display italic text-lg tracking-[0.25em] text-gold-deep/70">Invitation Links</p>
          <h1 className="mt-2 text-3xl md:text-4xl text-foil">ආරාධනා සබැඳි සාදන්න</h1>
          <p className="mt-2 text-ink/60">
            {INVITATION.couple.bride} සහ {INVITATION.couple.groom} — {INVITATION.date.displayNumeric}
          </p>
        </header>

        {/* Generator */}
        <form onSubmit={handleGenerate} className="paper-card rounded-[1.5rem] border border-gold/40 p-6 md:p-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            <label className="md:col-span-2 space-y-2 block">
              <span className="text-gold-deep/80">උපසර්ගය (Prefix)</span>
              <select
                value={prefix}
                onChange={(e) => {
                  const next = e.target.value as Prefix;
                  setPrefix(next);
                  setAudience(DEFAULT_AUDIENCE[next]);
                }}
                className={inputClass}
              >
                {PREFIXES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.value}
                  </option>
                ))}
              </select>
            </label>

            <label className="md:col-span-3 space-y-2 block">
              <span className="text-gold-deep/80">අමුත්තාගේ නම (Guest Name)</span>
              <input
                type="text"
                placeholder="e.g. Sanjaya"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className={`${inputClass} placeholder:text-ink/30`}
                required
              />
            </label>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-gold-deep/80 mb-2">ආරාධනා කරන්නේ</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {AUDIENCE_KEYS.map((key) => {
                const active = audience === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setAudience(key)}
                    className={`rounded-xl border px-4 py-3 text-base transition-colors ${
                      active ? "border-gold-deep bg-gold/15 text-ink" : "border-gold/30 bg-ivory text-ink/70 hover:border-gold/60"
                    }`}
                  >
                    {AUDIENCES[key].label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {guestName.trim() && (
            <div className="rounded-xl border border-gold/25 bg-ivory/70 px-4 py-3 text-base space-y-1">
              <p className="text-ink/60">
                පණිවිඩය: <span className="text-ink">{GREETING} {buildDisplayName(prefix, guestName)} ❤️</span>
              </p>
              <p className="text-ink/60">
                වෙබ් අඩවිය:{" "}
                <span className="text-ink">
                  {buildDisplayName(prefix, guestName)}, {AUDIENCES[audience].phrase} ආදරයෙන් ආරාධනා කරමු.
                </span>
              </p>
            </div>
          )}

          <button type="submit" className="w-full btn-gold text-ivory rounded-full py-3.5 text-lg">
            Generate Link — සබැඳිය සාදන්න
          </button>
        </form>

        {/* Result */}
        <section className="paper-card rounded-[1.5rem] border border-gold/40 p-6 md:p-8 space-y-5">
          {result ? (
            <>
              <div>
                <p className="text-gold-deep/80 text-base">සබැඳිය</p>
                <a
                  href={result.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all font-display text-lg text-gold-deep underline decoration-gold/40 underline-offset-4"
                >
                  {result.link}
                </a>
              </div>

              <div>
                <p className="text-gold-deep/80 text-base">පණිවිඩය</p>
                <pre className="mt-2 whitespace-pre-wrap break-words font-[inherit] text-base leading-relaxed bg-ivory/70 border border-gold/25 rounded-xl p-4 max-h-80 overflow-y-auto">
                  {result.message}
                </pre>
              </div>
            </>
          ) : (
            <p className="text-center text-ink/45 py-4">සබැඳියක් සෑදූ පසු මෙහි පෙන්වනු ඇත.</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={!result}
              onClick={() => result && copy(result.link, "සබැඳිය පිටපත් විය! (Link copied!)")}
              className={secondaryBtn}
            >
              Copy Link Only
            </button>
            <button
              type="button"
              disabled={!result}
              onClick={() => result && copy(result.message, "පණිවිඩය පිටපත් විය! (Message copied!)")}
              className={secondaryBtn}
            >
              Copy Full Message
            </button>
          </div>
        </section>

        {/* History */}
        {history.length > 0 && (
          <section className="paper-card rounded-[1.5rem] border border-gold/40 p-6 md:p-8">
            <h2 className="text-xl text-gold-deep mb-4">මෑතදී සෑදූ සබැඳි</h2>
            <ul className="space-y-3">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gold/20 bg-ivory/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-ink truncate">
                      {h.displayName} <span className="text-ink/50">· {AUDIENCES[h.audience].phrase}</span>
                    </p>
                    <p className="font-display text-sm text-ink/50">{h.createdAt.replace(",", "")}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => copy(h.url, "සබැඳිය පිටපත් විය! (Link copied!)")}
                      className="rounded-full border border-gold/40 px-3 py-1.5 text-sm text-gold-deep hover:bg-gold-pale/50"
                    >
                      Link
                    </button>
                    <button
                      type="button"
                      onClick={() => copy(buildMessage(h.displayName, h.url, h.audience), "පණිවිඩය පිටපත් විය! (Message copied!)")}
                      className="rounded-full border border-gold/40 px-3 py-1.5 text-sm text-gold-deep hover:bg-gold-pale/50"
                    >
                      Message
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(h.id)}
                      aria-label="Delete"
                      className="rounded-full px-3 py-1.5 text-sm text-ink/40 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-cocoa text-gold-pale px-5 py-2.5 shadow-lg text-base">
          {toast}
        </div>
      )}
    </div>
  );
}
