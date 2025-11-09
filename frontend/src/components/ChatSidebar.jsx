import { useState } from 'react';

function ChatSidebar({
  isOpen,
  onClose,
  messages,
  onSubmit,
  isBusy,
  initialPrompts = [],
  title = 'Anatomy Assistant',
  subtitle = 'Guided exploration powered by Dedalus Labs.',
  placeholder = 'Ask the assistant…'
}) {
  const [pendingMessage, setPendingMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isBusy) return;
    const trimmed = pendingMessage.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setPendingMessage('');
  };

  return (
    <aside
      className={`relative flex h-full flex-col overflow-hidden bg-slate-900/95 text-slate-100 shadow-2xl transition-[transform,width] duration-300 ease-in-out ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      style={{ width: isOpen ? '26rem' : '0rem', transform: `translateX(${isOpen ? '0%' : '100%'})` }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 rounded-l-3xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg"
      >
        {isOpen ? 'Hide Chat' : 'Open Chat'}
      </button>

      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-white/60">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/70 transition hover:bg-white/20"
        >
          Hide
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {messages.length === 0 ? (
          <div className="space-y-3 text-sm text-white/70">
            <p>Start the conversation by trying one of these prompts:</p>
            <ul className="list-disc space-y-1 pl-5">
              {initialPrompts.map((prompt) => (
                <li
                  key={prompt}
                  className={`cursor-pointer text-white/80 ${isBusy ? 'opacity-60' : ''}`}
                  onClick={() => {
                    if (!isBusy) onSubmit(prompt);
                  }}
                >
                  {prompt}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-lg ${
                message.role === 'user' ? 'ml-auto bg-sky-500/30 text-sky-50' : 'mr-auto bg-emerald-500/30 text-emerald-50'
              }`}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/60">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </p>
              <p className="whitespace-pre-line">{message.text}</p>
              {message.status === 'loading' ? (
                <p className="mt-2 text-xs text-white/60">Connecting to Gemini…</p>
              ) : null}
              {message.highlightSummaries?.length ? (
                <div className="mt-3 space-y-2 rounded-xl border border-white/20 bg-white/5 p-3 text-xs text-white/80">
                  <p className="font-semibold uppercase tracking-wide text-white/60">Highlighted regions</p>
                  <ul className="space-y-2">
                    {message.highlightSummaries.map((highlight, highlightIndex) => (
                      <li key={`${highlight.regionLabel}-${highlightIndex}`} className="flex gap-3">
                        <span
                          className="mt-0.5 h-3 w-3 flex-shrink-0 rounded-full border border-white/40"
                          style={{ backgroundColor: highlight.color }}
                          aria-hidden="true"
                        />
                        <div className="space-y-1">
                          <p className="font-semibold text-white">{highlight.regionLabel}</p>
                          {highlight.comment ? <p className="leading-snug text-white/80">{highlight.comment}</p> : null}
                          <p className="text-[10px] uppercase tracking-wide text-white/60">{highlight.color}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {message.toolResults?.length ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-white/70">
                  <p className="mb-1 font-semibold uppercase tracking-wide text-white/60">Execution log</p>
                  <ul className="space-y-1">
                    {message.toolResults.map((result, resultIndex) => (
                      <li key={`${result.name}-${resultIndex}`}>
                        <span className="font-semibold text-white">{result.name}</span>{' '}
                        <span className="uppercase tracking-wide text-white/60">({result.status})</span>{' '}
                        {result.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-white/10 px-6 py-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={pendingMessage}
            onChange={(event) => setPendingMessage(event.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
            disabled={isBusy}
          />
          <button
            type="submit"
            className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600"
            disabled={isBusy}
          >
            {isBusy ? 'Thinking…' : 'Send'}
          </button>
        </div>
      </form>
    </aside>
  );
}

export default ChatSidebar;
