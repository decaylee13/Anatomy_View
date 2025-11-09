import { useMemo, useState } from 'react';

function ChatSidebar({
  messages,
  onSubmit,
  isBusy,
  initialPrompts = [],
  title = 'Anatomy Assistant',
  subtitle = 'Guided exploration powered by Dedalus Labs.',
  placeholder = 'Ask the assistant…',
  processTrace = [],
  annotation = null
}) {
  const [pendingMessage, setPendingMessage] = useState('');
  const lastUserMessageIndex = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.role === 'user') {
        return index;
      }
    }
    return -1;
  }, [messages]);
  const annotationTargetIndex = useMemo(() => {
    if (!annotation || lastUserMessageIndex === -1) {
      return -1;
    }
    for (let index = lastUserMessageIndex + 1; index < messages.length; index += 1) {
      if (messages[index]?.role === 'assistant') {
        return index;
      }
    }
    return -1;
  }, [annotation, lastUserMessageIndex, messages]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isBusy) return;
    const trimmed = pendingMessage.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setPendingMessage('');
  };

  return (
    <aside className="flex h-full w-[26rem] flex-col overflow-hidden bg-slate-900/95 text-slate-100 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-white/60">{subtitle}</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {processTrace.length ? (
          <div className="space-y-3 rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4 text-xs text-slate-100 shadow-inner">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-sky-200">Agent process</p>
            <ul className="space-y-2">
              {processTrace.map((step) => {
                const status = step.status || 'complete';
                const indicatorClass =
                  status === 'error'
                    ? 'border-rose-400/80 bg-rose-500/70'
                    : status === 'in-progress'
                      ? 'border-sky-300/70 bg-sky-300/40 animate-pulse'
                      : 'border-emerald-300/70 bg-emerald-300/60';
                let detailLine = null;
                if (typeof step.detail === 'string') {
                  detailLine = step.detail;
                } else if (step.detail && typeof step.detail === 'object') {
                  detailLine = Object.entries(step.detail)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(' · ');
                }

                return (
                  <li key={step.id} className="flex items-start gap-3 transition-all duration-200 ease-out">
                    <span className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full border ${indicatorClass}`} aria-hidden="true" />
                    <div className="space-y-1">
                      <p className="font-medium text-slate-50">{step.label}</p>
                      {detailLine ? <p className="text-[11px] text-slate-200/70">{detailLine}</p> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

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
          messages.map((message, index) => {
            const isUser = message.role === 'user';
            const showAnnotationInside =
              annotation && index === annotationTargetIndex && message.role === 'assistant';

            return (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-lg ${isUser ? 'ml-auto bg-sky-500/30 text-sky-50' : 'mr-auto bg-emerald-500/30 text-emerald-50'}`}
              >
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/60">
                  {isUser ? 'You' : 'Assistant'}
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
                {showAnnotationInside ? (
                  <div className="mt-3 space-y-2 rounded-xl border border-white/15 bg-white/10 p-3 text-xs text-white/80">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">Scene annotation</p>
                    <h3 className="text-sm font-semibold text-white">{annotation.title}</h3>
                    <p className="text-sm leading-relaxed text-white/70">{annotation.description}</p>
                  </div>
                ) : null}
              </div>
            );
          })
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
