'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { buildZodiacData } from '@/lib/zodiac';
import { calculateBaziWithInterpretation } from '@/lib/bazi';
import { buildSystemPrompt } from '@/lib/prompts';
import type { MasterType, ChatMessage } from '@/types/user';
import type { ZodiacData, BaziData } from '@/types/user';
import type { BaziInterpretation, HiddenStem } from '@/types/bazi';
import ChatBubble from '@/components/ChatBubble';
import DailyFortuneCard from '@/components/DailyFortuneCard';
import SharePoster from '@/components/SharePoster';

// ===== Wuxing Bar =====
function WuxingBar({ name, count, maxCount, colorClass }: { name: string; count: number; maxCount: number; colorClass: string }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(maxCount > 0 ? (count / maxCount) * 100 : 0);
    }, 100);
    return () => clearTimeout(timer);
  }, [count, maxCount]);

  return (
    <div className="flex items-center gap-3">
      <span className={`w-5 text-center font-semibold text-sm ${colorClass}`}>{name}</span>
      <div className="flex-1 h-2 bg-[#1A1A2E] rounded overflow-hidden">
        <div
          ref={ref}
          className={`h-full rounded transition-all duration-1000 ease-out ${colorClass.replace('text-', 'bg-gradient-to-r from-')}`}
          style={{
            width: `${width}%`,
            background: {
              'text-[#D1D5DB]': 'linear-gradient(90deg,#9CA3AF,#D1D5DB)',
              'text-[#4ADE80]': 'linear-gradient(90deg,#16A34A,#4ADE80)',
              'text-[#22D3EE]': 'linear-gradient(90deg,#0891B2,#22D3EE)',
              'text-[#F87171]': 'linear-gradient(90deg,#DC2626,#F87171)',
              'text-[#A78BFA]': 'linear-gradient(90deg,#7C3AED,#A78BFA)',
            }[colorClass] ?? '#6366F1',
          }}
        />
      </div>
      <span className="w-5 text-right text-xs text-[#475569]">{count}</span>
    </div>
  );
}

// ===== AI Chat Section =====
function ChatSection({
  zodiacData,
  baziData,
  currentMaster,
  onMasterChange,
}: {
  zodiacData: ZodiacData;
  baziData: BaziData;
  currentMaster: MasterType;
  onMasterChange: (m: MasterType) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [masterDropdownOpen, setMasterDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMasterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const masterLabels: Record<MasterType, string> = {
    mínglǐ: '命理大师',
    xīngzuò: '星座导师',
    tǎluò: '塔罗师',
  };

  const masterAvatars: Record<MasterType, string> = {
    mínglǐ: '🧙',
    xīngzuò: '✨',
    tǎluò: '🔮',
  };

  // Initial greeting
  useEffect(() => {
    const greetings: Record<MasterType, string> = {
      mínglǐ: `您好！我已了解您的命盘。您的八字格局颇为独特，日主气势不凡。有什么想聊的吗？`,
      xīngzuò: `哈喽！我看了一下你的星盘，太阳星座的能量非常强烈呢！想聊点什么？`,
      tǎluò: `*洗牌中* 我已就位。来吧，告诉我你的问题，我会为你指引方向。`,
    };
    const greeting = greetings[currentMaster] ?? '你好！有什么想了解的？';
    setMessages([{
      id: 'init',
      role: 'assistant',
      content: greeting,
      timestamp: Date.now(),
    }]);
  }, [currentMaster]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsTyping(true);
    setStreamingContent('');

    try {
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      chatHistory.push({ role: 'user', content: text });

      const systemPrompt = buildSystemPrompt(currentMaster, zodiacData, baziData);
      const allMessages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
      ];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, masterType: currentMaster }),
      });

      if (!res.ok) {
        setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: '抱歉，我现在有些走神，请稍后再试试。', timestamp: Date.now() }]);
        setIsTyping(false);
        setStreamingContent('');
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'chunk') {
              fullContent += data.content;
              setStreamingContent(fullContent);
            }
          } catch {}
        }
      }

      // Commit completed message
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: fullContent, timestamp: Date.now() }]);
      setStreamingContent('');
    } catch {
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: '网络有点不给力，请稍后再试试～', timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
      setStreamingContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const nowStr = () => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
  };

  return (
    <div className="content-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#2D2D44] gap-4">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="text-xl">{masterAvatars[currentMaster]}</span>
          <span className="font-semibold whitespace-nowrap">AI 大师对话</span>
        </div>

        {/* Custom dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setMasterDropdownOpen(v => !v)}
            className="input-field py-1.5 px-3 text-sm bg-[#1A1A2E] border-[#2D2D44] flex items-center gap-2 min-w-[120px] justify-between"
          >
            <span>{masterAvatars[currentMaster]} {masterLabels[currentMaster]}</span>
            <span className={`transition-transform duration-200 ${masterDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {masterDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-full min-w-[140px] bg-[#1A1A2E] border border-[#2D2D44] rounded-lg shadow-xl z-50 overflow-hidden">
              {(['mínglǐ', 'xīngzuò', 'tǎluò'] as MasterType[]).map(type => (
                <button
                  key={type}
                  onClick={() => { onMasterChange(type); setMasterDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                    currentMaster === type
                      ? 'bg-[rgba(99,102,241,0.2)] text-[#818CF8]'
                      : 'text-[#94A3B8] hover:bg-[#252540] hover:text-white'
                  }`}
                >
                  <span>{masterAvatars[type]}</span>
                  <span>{masterLabels[type]}</span>
                  {currentMaster === type && <span className="ml-auto text-[#818CF8]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="h-[340px] overflow-y-auto mb-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
        {messages.map(msg => (
          <ChatBubble
            key={msg.id}
            content={msg.content}
            role={msg.role}
            timestamp={nowStr()}
          />
        ))}

        {/* Streaming indicator */}
        {isTyping && (
          <div className="flex gap-3 animate-[msgIn_0.4s_ease-out]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366F1] to-[#EC4899] flex items-center justify-center text-lg flex-shrink-0 shadow-lg shadow-indigo-500/20">
              ✨
            </div>
            <div className="bg-[#1A1A2E] border border-[#2D2D44] rounded-2xl px-5 py-4 max-w-[82%]">
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full bg-[#818CF8] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#818CF8] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#818CF8] animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-[#475569] ml-2">正在解读中...</span>
              </div>
              {streamingContent && (
                <p className="text-sm text-[#94A3B8] mt-2 leading-relaxed">{streamingContent}</p>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex gap-3 items-end pt-4 border-t border-[#2D2D44]">
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="输入你想问的问题..."
          rows={1}
          className="input-field flex-1 px-4 py-3 text-sm resize-none min-h-[46px] max-h-[120px]"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isTyping}
          className="w-12 h-12 btn-primary flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ↑
        </button>
      </div>

      <style>{`
        @keyframes msgIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes typingBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}

// ===== Result Page =====
export default function ResultPage() {
  const router = useRouter();
  const { zodiacData, baziData, setZodiacData, setBaziData, currentMaster, setCurrentMaster, addHistory, setBirthInfo } = useUserStore();
  const [zodiac, setZodiac] = useState<ZodiacData | null>(null);
  const [bazi, setBazi] = useState<BaziData | null>(null);
  const [baziInterp, setBaziInterp] = useState<BaziInterpretation | null>(null);
  const [activeTab, setActiveTab] = useState<'constellation' | 'bazi' | 'chat'>('constellation');
  const [birthInfo, setBirthInfoLocal] = useState<{ year: number; month: number; day: number; hour: number; gender: 'male' | 'female' } | null>(null);
  const [showPoster, setShowPoster] = useState(false);
  const [ready, setReady] = useState(false);

  // Force scroll to top BEFORE paint
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Initialize synchronously from sessionStorage on mount
  useEffect(() => {
    // Reset scroll position and disable browser scroll restoration
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    // Read from sessionStorage directly (同步)
    const stored = sessionStorage.getItem('xinghe_birthInfo');
    if (!stored) {
      router.push('/');
      return;
    }

    const info = JSON.parse(stored);
    setBirthInfo(info);
    setBirthInfoLocal(info);

    // Calculate data
    const z = buildZodiacData(info.year, info.month, info.day, info.hour);
    const { result: b, interpretation: interp } = calculateBaziWithInterpretation(info.year, info.month, info.day, info.hour, info.gender);

    setZodiac(z);
    setBazi(b);
    setBaziInterp(interp);
    setZodiacData(z);
    setBaziData(b);
    addHistory({
      id: `h-${info.year}-${info.month}-${info.day}-${info.hour}`,
      birthInfo: info,
      zodiacData: z,
      baziData: b,
      createdAt: Date.now(),
    });
    setReady(true);
  }, []);

  const handleBack = () => {
    router.push('/');
  };

  const handleRestart = () => {
    sessionStorage.removeItem('xinghe_birthInfo');
    router.push('/');
  };

  if (!ready || !zodiac || !bazi || !baziInterp) {
    return (
      <div className="page-bg min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-[#94A3B8] animate-pulse">正在解析你的星图...</div>
      </div>
    );
  }

  const maxWuxing = Math.max(...Object.values(bazi.wuxing), 1);
  const wuxingLabels: Array<{ key: keyof typeof bazi.wuxing; name: string; color: string }> = [
    { key: 'metal', name: '金', color: 'text-[#D1D5DB]' },
    { key: 'wood',  name: '木', color: 'text-[#4ADE80]' },
    { key: 'water', name: '水', color: 'text-[#22D3EE]' },
    { key: 'fire',  name: '火', color: 'text-[#F87171]' },
    { key: 'earth', name: '土', color: 'text-[#A78BFA]' },
  ];

  return (
    <div className="page-bg relative z-[1] pb-8">
      {/* Nav */}
      <nav className="nav-bar">
        <button onClick={handleBack} className="btn-secondary px-4 py-2 text-sm">← 返回</button>
        <div className="nav-logo">✦ 星合</div>
        <div className="flex gap-2">
          <button onClick={() => setShowPoster(true)} className="btn-primary px-4 py-2 text-sm">🎨 海报</button>
          <Link href="/history" className="btn-secondary px-4 py-2 text-sm">📜 历史</Link>
          <button onClick={handleRestart} className="btn-secondary px-4 py-2 text-sm">🔄 重新输入</button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-[1100px] mx-auto px-4 pt-24">

        {/* Welcome header */}
        <div className="text-center mb-8 animate-[fadeUp_0.6s_ease-out]">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            ✧ 欢迎，<span className="text-[#F59E0B]">探索者</span> ✧
          </h1>
          <div className="flex items-center justify-center gap-4 flex-wrap text-sm text-[#94A3B8]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#13131F] border border-[#2D2D44] rounded-full">
              <span>{zodiac.sun.symbol}</span> 太阳{zodiac.sun.name}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#13131F] border border-[#2D2D44] rounded-full">
              <span>☽</span> 月亮{zodiac.moon.name}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#13131F] border border-[#2D2D44] rounded-full">
              <span>↑</span> 上升{zodiac.rising.name}
            </span>
          </div>
        </div>

        {/* 今日运势 — 置顶展示 */}
        {birthInfo && zodiac && (
          <div className="mb-8 animate-[fadeUp_0.7s_ease-out]">
            <DailyFortuneCard
              year={birthInfo.year}
              month={birthInfo.month}
              day={birthInfo.day}
              hour={birthInfo.hour}
              gender={birthInfo.gender}
              sunSign={zodiac.sun.name}
              sunSymbol={zodiac.sun.symbol}
            />
          </div>
        )}

        {/* Mobile tabs */}
        <div className="mobile-tab-bar mb-6">
          <button
            className={`mobile-tab ${activeTab === 'constellation' ? 'active' : ''}`}
            onClick={() => setActiveTab('constellation')}
          >
            <span className="text-2xl">✨</span>
            星座
          </button>
          <button
            className={`mobile-tab ${activeTab === 'bazi' ? 'active' : ''}`}
            onClick={() => setActiveTab('bazi')}
          >
            <span className="text-2xl">🀄</span>
            八字
          </button>
          <button
            className={`mobile-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <span className="text-2xl">🧙</span>
            大师
          </button>
        </div>

        {/* Cards grid — 左右等高，内容超长时内部滚动 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6 items-stretch">

          {/* Constellation Card — 全展开版 */}
          <div className={`content-card mobile-tab-content h-full overflow-y-auto ${activeTab === 'constellation' ? 'active' : ''}`}>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-2xl">✨</span>
              <h2 className="text-lg font-semibold">星座解析</h2>
            </div>

            {/* 星座详情内容 — 太阳/月亮/上升三栏全展示 */}
            <div className="space-y-4">
              {([
                { key: 'sun' as const, label: '太阳', symbol: zodiac.sun.symbol, accent: '#F59E0B', grad: 'from-[#F59E0B] to-[#FBBF24]', bgGrad: 'from-[#F59E0B]/15 to-[#FBBF24]/5' },
                { key: 'moon' as const, label: '月亮', symbol: '☽', accent: '#94A3B8', grad: 'from-[#94A3B8] to-[#CBD5E1]', bgGrad: 'from-[#94A3B8]/15 to-[#CBD5E1]/5' },
                { key: 'rising' as const, label: '上升', symbol: '↑', accent: '#818CF8', grad: 'from-[#818CF8] to-[#A78BFA]', bgGrad: 'from-[#818CF8]/15 to-[#A78BFA]/5' },
              ]).map(({ key, label, symbol, accent, grad, bgGrad }) => {
                const signData = zodiac[key];
                const detail = signData.detail;

                return (
                  <div key={key} className={`rounded-xl p-4 border border-[#2D2D44] bg-gradient-to-br ${bgGrad}`}>
                    {/* 头部 */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center text-xl shadow flex-shrink-0`}>
                        {symbol}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold" style={{ color: accent }}>{label} {signData.name}</span>
                          {signData.element && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#1A1A2E] border border-[#2D2D44] text-[#94A3B8]">
                              {signData.element}象 · {signData.modality}位
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#94A3B8] italic leading-relaxed line-clamp-1">
                          {detail?.element_trait ?? signData.trait}
                        </p>
                      </div>
                    </div>

                    {/* 性格画像 */}
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-3 rounded-full" style={{ background: accent }} />
                        性格画像
                      </div>
                      <div className="space-y-1.5">
                        {(detail?.personality ?? [signData.trait]).slice(0, 2).map((p, i) => (
                          <p key={i} className="text-xs text-[#CBD5E1] leading-relaxed">◆ {p.slice(0, 60)}{p.length > 60 ? '…' : ''}</p>
                        ))}
                      </div>
                    </div>

                    {/* 优势 & 挑战 */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <div className="text-xs text-[#4ADE80] font-semibold mb-1">✦ 优势</div>
                        <div className="flex flex-wrap gap-1">
                          {(detail?.strength ?? []).slice(0, 3).map(s => (
                            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-[#4ADE80]">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[#F87171] font-semibold mb-1">⚠ 挑战</div>
                        <div className="flex flex-wrap gap-1">
                          {(detail?.weakness ?? []).slice(0, 3).map(w => (
                            <span key={w} className="text-xs px-2 py-0.5 rounded-full bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] text-[#F87171]">{w}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 健康 & 亲密关系 */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-[#13131F] rounded-lg p-2.5">
                        <div className="text-xs text-[#94A3B8] font-semibold mb-1">❤️ 健康</div>
                        <p className="text-xs text-[#CBD5E1] leading-relaxed line-clamp-2">需注意{detail?.element_trait.includes('水') ? '肾泌尿' : detail?.element_trait.includes('火') ? '心脏' : detail?.element_trait.includes('木') ? '肝胆' : detail?.element_trait.includes('金') ? '肺' : '脾胃'}系统保养</p>
                      </div>
                      <div className="bg-[#13131F] rounded-lg p-2.5">
                        <div className="text-xs text-[#94A3B8] font-semibold mb-1">💕 亲密关系</div>
                        <p className="text-xs text-[#CBD5E1] leading-relaxed line-clamp-2">{detail?.relationship ?? '感情细腻'}</p>
                      </div>
                    </div>

                    {/* 隐藏面 & 压力 */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-[rgba(99,102,241,0.06)] rounded-lg p-2.5 border border-[rgba(99,102,241,0.1)]">
                        <div className="text-xs text-[#A78BFA] font-semibold mb-1">🔒 隐藏面</div>
                        <p className="text-xs text-[#A78BFA] leading-relaxed line-clamp-2">{detail?.hidden_self ?? '内心复杂'}</p>
                      </div>
                      <div className="bg-[rgba(248,113,113,0.06)] rounded-lg p-2.5 border border-[rgba(248,113,113,0.1)]">
                        <div className="text-xs text-[#F87171] font-semibold mb-1">⚡ 压力</div>
                        <p className="text-xs text-[#F87171] leading-relaxed line-clamp-2">{detail?.stress_signal ?? '情绪波动'}</p>
                      </div>
                    </div>

                    {/* 成长课题 & 速配 */}
                    <div className="flex flex-wrap gap-1.5">
                      {(detail?.growth ?? []).slice(0, 2).map((g, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] text-[#818CF8]">→ {g.slice(0, 15)}{g.length > 15 ? '…' : ''}</span>
                      ))}
                      {(detail?.compatible ?? []).slice(0, 2).map(c => (
                        <span key={c} className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-[#F59E0B]/10 to-[#FBBF24]/5 border border-[#F59E0B]/20 text-[#F59E0B]">💕 {c}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BaZi Card — 详细版 */}
          <div className={`content-card mobile-tab-content h-full overflow-y-auto ${activeTab === 'bazi' ? 'active' : ''}`}>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-2xl">🀄</span>
              <h2 className="text-lg font-semibold">八字解析</h2>
            </div>

            {/* 四柱概览 */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {(['year', 'month', 'day', 'hour'] as const).map(key => {
                const pillar = baziInterp.pillars[key];
                const pillarNames = { year: '年柱', month: '月柱', day: '日柱', hour: '时柱' };
                const pillarColors = { year: '#F59E0B', month: '#4ADE80', day: '#818CF8', hour: '#F87171' };
                return (
                  <div key={key} className="bg-[#13131F] rounded-xl p-3 border border-[#2D2D44] text-center">
                    <div className="text-xs text-[#475569] mb-1">{pillarNames[key]}</div>
                    <div className="text-xl font-bold mb-0.5">
                      <span style={{ color: pillarColors[key] }}>{bazi.pillars[key].gan}</span>
                      <span className="text-[#818CF8]">{bazi.pillars[key].zhi}</span>
                    </div>
                    <div className="text-xs text-[#94A3B8]">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        pillar.ganStrength === '旺' ? 'bg-[rgba(34,197,94,0.2)] text-[#4ADE80]' :
                        pillar.ganStrength === '相' ? 'bg-[rgba(59,130,246,0.2)] text-[#3B82F6]' :
                        pillar.ganStrength === '休' ? 'bg-[rgba(148,163,184,0.2)] text-[#94A3B8]' :
                        pillar.ganStrength === '囚' ? 'bg-[rgba(249,115,22,0.2)] text-[#F97316]' :
                        'bg-[rgba(248,113,113,0.2)] text-[#F87171]'
                      }`}>
                        {pillar.ganStrength}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 日主详解 */}
            <div className="bg-[#13131F] rounded-xl p-4 border border-[#2D2D44] mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#818CF8] to-[#A78BFA] flex items-center justify-center text-2xl shadow-lg">
                  🀄
                </div>
                <div>
                  <div className="font-bold text-base">
                    <span className="text-[#F59E0B]">{baziInterp.dayMaster.name}</span>
                    <span className="text-[#94A3B8] text-sm ml-2">{baziInterp.dayMaster.element}行</span>
                  </div>
                  <div className="text-xs text-[#475569] mt-0.5">
                    {bazi.dayStrength === 'strong' ? '日主偏旺' : bazi.dayStrength === 'weak' ? '日主偏弱' : '日主中和'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {baziInterp.dayMaster.personality.map((p, i) => (
                  <p key={i} className="text-xs text-[#CBD5E1] leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </div>

            {/* 五行分析 */}
            <div className="bg-[#13131F] rounded-xl p-4 border border-[#2D2D44] mb-4">
              <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-[#818CF8]" />
                五行分布
              </div>
              <div className="space-y-2 mb-3">
                {([
                  { key: 'metal', name: '金', color: '#D1D5DB' },
                  { key: 'wood', name: '木', color: '#4ADE80' },
                  { key: 'water', name: '水', color: '#22D3EE' },
                  { key: 'fire', name: '火', color: '#F87171' },
                  { key: 'earth', name: '土', color: '#A78BFA' },
                ] as const).map(({ key, name, color }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-5 text-center text-sm font-semibold" style={{ color }}>{name}</span>
                    <div className="flex-1 h-2 bg-[#1A1A2E] rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-700"
                        style={{
                          width: `${baziInterp.wuxing.percentages[key] ?? 0}%`,
                          background: `linear-gradient(90deg, ${color}80, ${color})`,
                        }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs text-[#475569]">
                      {bazi.wuxing[key as keyof typeof bazi.wuxing]}个
                    </span>
                    <span className="w-8 text-right text-xs text-[#475569]">
                      {baziInterp.wuxing.percentages[key] ?? 0}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-[#94A3B8]">
                <span className="text-[#4ADE80]">最旺：{baziInterp.wuxing.strongest}</span>
                {' · '}
                <span className="text-[#F87171]">最弱：{baziInterp.wuxing.weakest}</span>
                {' · '}
                <span>{baziInterp.wuxing.balance}</span>
              </div>
            </div>

            {/* 喜用神 */}
            <div className="bg-gradient-to-br from-[rgba(99,102,241,0.08)] to-[rgba(139,92,246,0.04)] rounded-xl p-4 border border-[rgba(99,102,241,0.2)] mb-4">
              <div className="text-xs font-semibold text-[#818CF8] uppercase tracking-wider mb-3">喜用神</div>
              <div className="flex gap-3 mb-2">
                <span className="px-4 py-1.5 rounded-full bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)] text-[#4ADE80] text-sm font-bold">
                  喜神 {baziInterp.xiYongShen.xi}
                </span>
                <span className="px-4 py-1.5 rounded-full bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)] text-[#3B82F6] text-sm font-bold">
                  用神 {baziInterp.xiYongShen.yong}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{baziInterp.xiYongShen.explanation}</p>
            </div>

            {/* 四柱详解 */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-[#F59E0B]" />
                四柱详解
              </div>
              <div className="space-y-3">
                {(['year', 'month', 'day', 'hour'] as const).map(key => {
                  const pillar = baziInterp.pillars[key];
                  const pillarTitles = { year: '年柱', month: '月柱', day: '日柱', hour: '时柱' };
                  const pillarSubtitles = {
                    year: '代表祖业、根基、父母',
                    month: '代表父母、事业环境、社会关系',
                    day: '代表本人、配偶、婚姻',
                    hour: '代表子女、晚年、财运',
                  };
                  return (
                    <div key={key} className="bg-[#13131F] rounded-xl p-4 border border-[#2D2D44]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-sm">{pillarTitles[key]}</span>
                        <span className="text-lg font-bold">
                          <span className="text-[#F59E0B]">{pillar.gan}</span>
                          <span className="text-[#818CF8]">{pillar.zhi}</span>
                        </span>
                        <span className="text-xs text-[#475569] ml-auto">{pillarSubtitles[key]}</span>
                      </div>
                      <p className="text-xs text-[#94A3B8] leading-relaxed mb-2 italic">{pillar.pillarMeaning}</p>
                      {/* 藏干 */}
                      {pillar.hiddenStems.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {pillar.hiddenStems.map((hs: HiddenStem, i: number) => (
                            <span key={i} className={`text-xs px-2 py-0.5 rounded ${
                              hs.power === '本气' ? 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)]' :
                              hs.power === '中气' ? 'bg-[rgba(34,197,94,0.1)] text-[#4ADE80] border border-[rgba(34,197,94,0.2)]' :
                              'bg-[rgba(148,163,184,0.1)] text-[#94A3B8] border border-[rgba(148,163,184,0.2)]'
                            }`}>
                              {hs.gan}气·{hs.power}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 天干关系 */}
            {baziInterp.tianGanRelations.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-[#6366F1]" />
                  天干关系
                </div>
                <div className="space-y-2">
                  {baziInterp.tianGanRelations.map((r, i) => (
                    <div key={i} className="bg-[#13131F] rounded-lg p-3 border border-[#2D2D44] flex items-start gap-3">
                      <div className="flex-shrink-0 text-center">
                        <span className="text-sm font-bold text-[#F59E0B]">{r.gan1}</span>
                        <span className="text-xs text-[#475569] mx-1">×</span>
                        <span className="text-sm font-bold text-[#F59E0B]">{r.gan2}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            r.type === '相生' ? 'bg-[rgba(34,197,94,0.1)] text-[#4ADE80]' :
                            r.type === '相克' ? 'bg-[rgba(248,113,113,0.1)] text-[#F87171]' :
                            'bg-[rgba(148,163,184,0.1)] text-[#94A3B8]'
                          }`}>{r.relation}</span>
                        </div>
                        <p className="text-xs text-[#94A3B8] leading-relaxed">{r.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 地支关系 */}
            {baziInterp.diZhiRelations.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-[#F87171]" />
                  地支关系
                </div>
                <div className="space-y-2">
                  {baziInterp.diZhiRelations.map((r, i) => (
                    <div key={i} className="bg-[#13131F] rounded-lg p-3 border border-[#2D2D44] flex items-start gap-3">
                      <div className="flex-shrink-0 text-center">
                        <span className="text-sm font-bold text-[#818CF8]">{r.dz1}</span>
                        <span className="text-xs text-[#475569] mx-1">×</span>
                        <span className="text-sm font-bold text-[#818CF8]">{r.dz2}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            r.type === '冲' ? 'bg-[rgba(248,113,113,0.1)] text-[#F87171]' :
                            r.type === '合' ? 'bg-[rgba(34,197,94,0.1)] text-[#4ADE80]' :
                            'bg-[rgba(148,163,184,0.1)] text-[#94A3B8]'
                          }`}>{r.relation}</span>
                        </div>
                        <p className="text-xs text-[#94A3B8] leading-relaxed">{r.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 日主优劣势 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[rgba(34,197,94,0.05)] rounded-xl p-4 border border-[rgba(34,197,94,0.15)]">
                <div className="text-xs font-semibold text-[#4ADE80] mb-2">✦ 性格优势</div>
                <div className="flex flex-wrap gap-1.5">
                  {baziInterp.dayMaster.strength.map(s => (
                    <span key={s} className="text-xs px-2 py-1 rounded-full bg-[rgba(34,197,94,0.1)] text-[#4ADE80]">{s}</span>
                  ))}
                </div>
              </div>
              <div className="bg-[rgba(248,113,113,0.05)] rounded-xl p-4 border border-[rgba(248,113,113,0.15)]">
                <div className="text-xs font-semibold text-[#F87171] mb-2">⚠ 成长挑战</div>
                <div className="flex flex-wrap gap-1.5">
                  {baziInterp.dayMaster.weakness.map(w => (
                    <span key={w} className="text-xs px-2 py-1 rounded-full bg-[rgba(248,113,113,0.1)] text-[#F87171]">{w}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* 健康与情感 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#13131F] rounded-xl p-4 border border-[#2D2D44]">
                <div className="text-xs font-semibold text-[#94A3B8] mb-2">❤️ 健康提示</div>
                <p className="text-xs text-[#CBD5E1] leading-relaxed">{baziInterp.dayMaster.health}</p>
              </div>
              <div className="bg-[#13131F] rounded-xl p-4 border border-[#2D2D44]">
                <div className="text-xs font-semibold text-[#94A3B8] mb-2">💕 亲密关系</div>
                <p className="text-xs text-[#CBD5E1] leading-relaxed line-clamp-3">{baziInterp.dayMaster.relationships}</p>
              </div>
            </div>

            {/* 事业方向 */}
            <div className="bg-[#13131F] rounded-xl p-4 border border-[#2D2D44] mb-4">
              <div className="text-xs font-semibold text-[#94A3B8] mb-2">💼 事业方向</div>
              <div className="flex flex-wrap gap-2">
                {baziInterp.dayMaster.career.map(c => (
                  <span key={c} className="text-xs px-3 py-1.5 rounded-full bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] text-[#818CF8]">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* 成长课题 */}
            <div className="bg-[#13131F] rounded-xl p-4 border border-[#2D2D44]">
              <div className="text-xs font-semibold text-[#94A3B8] mb-3">🌱 成长课题</div>
              <div className="flex flex-wrap gap-2">
                {baziInterp.dayMaster.growth.map((g, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] text-[#818CF8]">
                    → {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className={`chat-section-wrapper ${activeTab === 'chat' ? 'chat-section-show' : ''}`}>
          <ChatSection
            zodiacData={zodiac}
            baziData={bazi}
            currentMaster={currentMaster}
            onMasterChange={setCurrentMaster}
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-[rgba(45,45,68,0.3)] text-center">
          <p className="text-[#475569] text-xs">星合 © 2026 · 仅供娱乐参考，不构成人生决策建议</p>
          <p className="text-[#475569] text-xs mt-1">命理内容由 AI 生成，可能存在偏差，请理性看待</p>
        </footer>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* 分享海报弹窗 */}
      {showPoster && birthInfo && zodiac && bazi && (
        <SharePoster
          birthInfo={birthInfo}
          zodiacData={zodiac}
          baziData={bazi}
          onClose={() => setShowPoster(false)}
        />
      )}
    </div>
  );
}
<script src="/checkout-demo.js"></script>
