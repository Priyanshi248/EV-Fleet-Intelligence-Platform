
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Database,
  RotateCcw,
  Loader2,
  AlertCircle,
  ShieldCheck,
  BatteryCharging,
  Wrench,
  Leaf,
  Zap,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { sendAssistantMessage } from '@/lib/api';

const SUGGESTED_QUESTIONS = [
  {
    icon: Wrench,
    label: 'Maintenance alerts',
    question: 'Which vehicles currently have unresolved maintenance alerts?',
  },
  {
    icon: BatteryCharging,
    label: 'Battery health',
    question: 'Summarize the latest battery health and remaining useful life predictions for each vehicle.',
  },
  {
    icon: Leaf,
    label: 'Net-Zero progress',
    question: 'Compare the saved Net-Zero scenarios and explain the highest reduction scenario.',
  },
  {
    icon: ShoppingBag,
    label: 'Procurement',
    question: 'What EV models are available in the procurement catalogue and what are their ranges and payload capacities?',
  },
  {
    icon: Zap,
    label: 'Charging data',
    question: 'How much energy has been recorded in the available charging sessions?',
  },
];




function getRelevantSources(question, answer, sources = []) {
  const q = String(question || '').toLowerCase();

  let allowedTypes = [];

  const has = (...words) =>
    words.some((word) => q.includes(word));

  // Check specific modules before general keywords such as battery or vehicle.
  if (
    has('supplier', 'supply chain', 'risk assessment', 'battery material')
  ) {
    allowedTypes = ['supplier_risk_assessment'];
  } else if (
    has('catalogue', 'catalog', 'ev models', 'purchase price',
      'usable range', 'payload capacity')
  ) {
    allowedTypes = ['ev_catalogue'];
  } else if (
    has('procurement', 'recommendation', 'recommend', 'best ev',
      'best vehicle', 'purchase recommendation')
  ) {
    allowedTypes = ['ev_catalogue', 'procurement_recommendation'];
  } else if (
    has('maintenance', 'alert', 'repair', 'inspection')
  ) {
    allowedTypes = ['maintenance_alert', 'fleet_vehicle'];
  } else if (
    has('battery', 'soh', 'rul', 'degradation', 'health')
  ) {
    allowedTypes = ['battery_prediction', 'fleet_vehicle'];
  } else if (
    has('charging', 'energy', 'electricity')
  ) {
    allowedTypes = ['charging_session', 'fleet_vehicle'];
  } else if (
    has('net-zero', 'net zero', 'emission', 'carbon')
  ) {
    allowedTypes = ['net_zero_scenario'];
  } else if (
    has('fleet', 'vehicle', 'vehicles', 'status')
  ) {
    allowedTypes = ['fleet_vehicle'];
  }

  if (!allowedTypes.length) {
    return sources.slice(0, 6);
  }

  let filtered = sources.filter((source) =>
    allowedTypes.includes(source.type)
  );

  const combinedText = `${question} ${answer}`;

  const vehicleMatches = [
    ...combinedText.matchAll(/\bEV[-\s]?0*(\d+)\b/gi),
  ].map((match) =>
    `EV-${String(Number(match[1])).padStart(3, '0')}`
  );

  if (vehicleMatches.length > 0) {
    const vehicleFiltered = filtered.filter((source) =>
      vehicleMatches.some((code) =>
        String(source.label || '').toUpperCase().includes(code)
      )
    );

    if (vehicleFiltered.length > 0) {
      filtered = vehicleFiltered;
    }
  }

  return filtered.slice(0, 8);
}


function renderAnswerText(content) {
  const lines = String(content || '').split('\n');

  return lines.map((line, lineIndex) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);

    return (
      <span key={lineIndex}>
        {parts.map((part, partIndex) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={partIndex} className="font-semibold text-slate-900">
                {part.slice(2, -2)}
              </strong>
            );
          }

          return <span key={partIndex}>{part}</span>;
        })}
        {lineIndex < lines.length - 1 ? '\n' : null}
      </span>
    );
  });
}

export default function AssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [expandedSources, setExpandedSources] = useState({});

  const scrollContainerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!scrollContainerRef.current) return;

    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, sending]);

  const submitMessage = async (value) => {
    const messageText = String(value || '').trim();

    if (!messageText || sending) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput('');
    setError('');
    setSending(true);

    try {
      const response = await sendAssistantMessage(messageText);

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer || 'The assistant returned an empty response.',
        provider: response.provider || 'unknown',
        model: response.model || null,
        notice: response.notice || null,
        sources: getRelevantSources(
          messageText,
          response.answer || '',
          response.sources || []
        ),
      };

      setMessages((previous) => [...previous, assistantMessage]);
    } catch (err) {
      setError(
        err.message ||
          'Unable to reach the assistant. Check that the backend is running.'
      );
    } finally {
      setSending(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitMessage(input);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const clearConversation = () => {
    if (sending) return;

    setMessages([]);
    setInput('');
    setError('');
    setExpandedSources({});
  };

  const toggleSources = (messageId) => {
    setExpandedSources((previous) => ({
      ...previous,
      [messageId]: !previous[messageId],
    }));
  };

  const providerLabel = (provider) => {
    if (provider === 'openrouter') return 'OpenRouter AI';
    if (provider === 'database_fallback') return 'Database fallback';
    return 'Assistant';
  };

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-7rem)] min-h-[620px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                AI Assistant
              </h1>
              <p className="text-sm text-slate-500">
                Ask questions about your EV fleet and operational data.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={clearConversation}
          disabled={sending || messages.length === 0}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          <RotateCcw className="w-4 h-4" />
          Clear conversation
        </button>
      </div>

      {/* Trust / data context */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="w-4 h-4" />
          Project-grounded responses
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-800">
          <Database className="w-4 h-4" />
          Uses retrieved PostgreSQL records
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-800">
          <Sparkles className="w-4 h-4" />
          Powered by OpenRouter when configured
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-slate-800">
              Fleet Intelligence Conversation
            </span>
          </div>

          <span className="text-[11px] text-slate-400">
            Session-only history
          </span>
        </div>

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5"
        >
          {messages.length === 0 && (
            <div className="max-w-3xl mx-auto py-5 sm:py-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 text-center mt-4">
                How can I help with your fleet?
              </h2>

              <p className="text-sm text-slate-500 text-center mt-2 max-w-xl mx-auto">
                Ask about vehicle status, battery predictions, maintenance
                alerts, charging sessions, procurement, supply-chain risks or
                emissions scenarios.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                {SUGGESTED_QUESTIONS.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => submitMessage(item.question)}
                      disabled={sending}
                      className="group flex items-start gap-3 p-4 rounded-xl border border-slate-200 text-left hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors disabled:opacity-50"
                    >
                      <div className="w-9 h-9 shrink-0 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-700">
                        <Icon className="w-4 h-4" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {item.question}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === 'user';

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[78%] min-w-0 ${
                    isUser ? 'order-first' : ''
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-7 whitespace-pre-wrap break-words ${
                      isUser
                        ? 'bg-emerald-700 text-white rounded-tr-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 rounded-tl-sm'
                    }`}
                  >
                    {isUser
                      ? message.content
                      : renderAnswerText(message.content)}
                  </div>

                  {!isUser && (
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
                            message.provider === 'openrouter'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          {providerLabel(message.provider)}
                        </span>

                        {message.model && (
                          <span className="text-[10px] text-slate-400">
                            {message.model}
                          </span>
                        )}
                      </div>

                      {message.notice && (
                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{message.notice}</span>
                        </div>
                      )}

                      {message.sources?.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleSources(message.id)}
                            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
                          >
                            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                              <Database className="w-4 h-4 text-emerald-600" />
                              Supporting records ({message.sources.length})
                            </span>

                            {expandedSources[message.id] ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          {expandedSources[message.id] && (
                            <div className="border-t border-slate-100 p-3 space-y-2">
                              {message.sources.map((source, index) => (
                                <div
                                  key={`${source.type}-${source.record_id ?? index}`}
                                  className="flex items-start justify-between gap-3 text-xs"
                                >
                                  <span className="text-slate-600">
                                    {source.label}
                                  </span>

                                  <span className="shrink-0 text-slate-400">
                                    {source.record_id != null
                                      ? `#${source.record_id}`
                                      : source.type}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}

          {sending && (
            <div className="flex gap-3">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>

              <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                Retrieving project data and preparing an answer...
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Suggested prompts during conversation */}
        {messages.length > 0 && !sending && (
          <div className="px-4 sm:px-5 pb-3 flex gap-2 overflow-x-auto">
            {SUGGESTED_QUESTIONS.slice(0, 4).map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => submitMessage(item.question)}
                className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-100 p-3 sm:p-4"
        >
          <div className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white p-2 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={2000}
              placeholder="Ask something about your EV fleet..."
              disabled={sending}
              className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 max-h-32 min-h-10"
            />

            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="w-10 h-10 shrink-0 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 px-1 pt-2">
            <p className="text-[10px] text-slate-400">
              Enter to send · Shift + Enter for a new line
            </p>

            <p className="text-[10px] text-slate-400">
              {input.length}/2000
            </p>
          </div>
        </form>
      </div>

      <p className="text-[11px] text-slate-400 text-center">
        Answers use retrieved project records. Simulated and demonstration
        values are not live fleet measurements. Conversation history is
        currently kept only in this page session.
      </p>
    </div>
  );
}
