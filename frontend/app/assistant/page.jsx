'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Check, 
  Copy, 
  RotateCcw, 
  Info,
  ChevronRight,
  BatteryCharging,
  Wrench,
  Leaf,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { aiAssistantKnowledge } from '@/data/mockData';

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'user',
      text: 'Which vehicles have the highest risk of battery failure?',
      time: '10:34 AM'
    },
    {
      id: 'm2',
      sender: 'assistant',
      text: `Based on the latest analysis, the following vehicles have the highest risk of battery failure:

1. **EV-004 (BYD e6)** – **High risk** (Battery temperature high)
2. **EV-010 (Tata Punch EV)** – **High risk** (SOH dropped to 70%)
3. **EV-017 (MG ZS EV)** – **Medium risk** (Unusual charging pattern)

These vehicles are recommended for inspection within the next 2 weeks.`,
      time: '10:35 AM'
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    "Which vehicles need maintenance?",
    "Explain the battery health of EV-001",
    "Recommend EVs for 200 km daily route",
    "Show supply chain risks",
    "How much CO₂ can we save?",
    "Compare Tata Ace EV vs eDeliver"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      time: userTime
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    // Find closest knowledge match
    setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      let matchedResponse = aiAssistantKnowledge.find(k => 
        k.triggers.some(trigger => lowerQuery.includes(trigger.toLowerCase()))
      );

      let responseText = '';
      if (matchedResponse) {
        responseText = matchedResponse.answer;
      } else {
        responseText = `I analyzed your fleet query regarding **"${query}"**. 

Here are current telemetry takeaways:
- **Fleet SOH Average:** 92% across 120 deployed electric vehicles.
- **Active Alerts:** 8 vehicles flagged (3 High, 4 Medium, 1 Low).
- **Carbon Reduction:** 245 tons of CO₂ saved to date (+18% YoY).

You can also ask me for specific vehicle telemetry (e.g. *EV-001*), route procurement recommendations, or battery supply chain risks.`;
      }

      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev, 
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: responseText,
          time: botTime
        }
      ]);
      setIsTyping(false);
    }, 600);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'm1',
        sender: 'user',
        text: 'Which vehicles have the highest risk of battery failure?',
        time: '10:34 AM'
      },
      {
        id: 'm2',
        sender: 'assistant',
        text: `Based on the latest analysis, the following vehicles have the highest risk of battery failure:

1. **EV-004 (BYD e6)** – **High risk** (Battery temperature high)
2. **EV-010 (Tata Punch EV)** – **High risk** (SOH dropped to 70%)
3. **EV-017 (MG ZS EV)** – **Medium risk** (Unusual charging pattern)

These vehicles are recommended for inspection within the next 2 weeks.`,
        time: '10:35 AM'
      }
    ]);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      {/* 1. Page Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Assistant</h1>
          <p className="text-sm text-slate-500 mt-0.5">Get insights, explanations and recommendations about your EV fleet.</p>
        </div>

        <button
          onClick={handleResetChat}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* 2. Main Chat Container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
        {/* Scrollable Message Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Welcome Bot Greeting Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-slate-50 to-blue-50/60 border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            {/* Cute AI Bot Avatar Graphic */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <Bot className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Hello! I&apos;m your EV Fleet Assistant.
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                Ask me anything about your fleet, battery health, maintenance, procurement, supply chain or sustainability.
              </p>
            </div>
          </div>

          {/* Clickable Suggested Prompt Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Suggested Questions:
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 my-2"></div>

          {/* Messages Stream */}
          <div className="space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm ${
                    isUser 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-emerald-500 text-white'
                  }`}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-[#1e293b] text-white rounded-tr-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-line prose prose-sm max-w-none text-inherit">
                      {msg.text}
                    </div>

                    <div className={`mt-2 text-[10px] ${isUser ? 'text-slate-400 text-right' : 'text-slate-400'}`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-1 text-[11px] font-medium text-slate-400">Synthesizing telemetry & ML predictions...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 3. Bottom Chat Input Box */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder:text-slate-400"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || isTyping}
            className="w-10 h-10 rounded-xl bg-[#10b981] hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow-sm flex-shrink-0"
            aria-label="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

