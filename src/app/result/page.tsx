'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { buildZodiacData } from '@/lib/zodiac';
import { calculateBazi, calculateBaziAsync } from '@/lib/bazi';
import { buildSystemPrompt } from '@/lib/prompts';
import type { MasterType, ChatMessage } from '@/types/user';
import type { ZodiacData, BaziData } from '@/types/user';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#2D2D44]">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🧙</span>
          <span className="font-semibold">AI 大师对话</span>
        </div>
        <select
          value={currentMaster}
          onChange={e => onMasterChange(e.target.value as MasterType)}
          className="input-field py-1.5 px-3 text-sm bg-[#1A1A2E] border-[#2D2D44] bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2010%2010%22%3E%3Cpath%20fill%3D%22%2394A3B8%22%20d%3D%22M5%207L1%203h8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_8px_center] bg-[length:10px]"
        >
          <option value="mínglǐ">命理大师</option>
          <option value="xīngzuò">星座导师</option>
          <option value="tǎluò">塔罗师</option>
        </select>
      </div>

      {/* Messages */}
      <div className="h-[340px] overflow-y-auto mb-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-[msgIn_0.4s_ease-out]`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
              msg.role === 'assistant'
                ? 'bg-gradient-to-br from-[#6366F1] to-[#EC4899]'
                : 'bg-gradient-to-br from-[#F59E0B] to-[#FCD34D]'
            }`}>
              {msg.role === 'assistant' ? masterAvatars[currentMaster] : '😊'}
            </div>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'assistant' ? 'chat-bubble-ai' : 'chat-bubble-user'
              }`}>
                {msg.content}
              </div>
              <div className={`text-xs text-[#475569] mt-1 ${msg.role === 'user' ? 'text-right' : ''} px-1`}>
                {nowStr()}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming indicator — shows typewriter preview */}
        {isTyping && (
          <div className="flex gap-3 animate-[msgIn_0.4s_ease-out]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#EC4899] flex items-center justify-center text-lg flex-shrink-0">
              {masterAvatars[currentMaster]}
            </div>
            <div className="max-w-[85%]">
              <div className="chat-bubble-ai px-4 py-3">
                <span className="text-[#94A3B8]">{streamingContent}</span>
                <span className="inline-block w-1.5 h-3.5 bg-[#818CF8] ml-0.5 animate-[cursorBlink_0.8s_infinite] align-middle" />
              </div>
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
  const { birthInfo, zodiacData, baziData, setZodiacData, setBaziData, currentMaster, setCurrentMaster, addHistory } = useUserStore();
  const [zodiac, setZodiac] = useState<ZodiacData | null>(null);
  const [bazi, setBazi] = useState<BaziData | null>(null);
  const [activeTab, setActiveTab] = useState<'constellation' | 'bazi' | 'chat'>('constellation');

  useEffect(() => {
    // Try to get data from store first
    let info = birthInfo;
    let zData = zodiacData;
    let bData = baziData;

    // Fallback to sessionStorage
    if (!info && typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('xinghe_birthInfo');
      if (stored) {
        info = JSON.parse(stored);
      }
    }

    if (!info) {
      router.push('/');
      return;
    }

    if (zData && bData) {
      setZodiac(zData);
      setBazi(bData);
      addHistory({
        id: `h-${info.year}-${info.month}-${info.day}-${info.hour}`,
        birthInfo: info,
        zodiacData: zData,
        baziData: bData,
        createdAt: Date.now(),
      });
    } else {
      // Calculate locally
      const z = buildZodiacData(info.year, info.month, info.day, info.hour);
      const b = calculateBazi(info.year, info.month, info.day, info.hour, info.gender);
      setZodiac(z);
      setBazi(b);
      setZodiacData(z);
      setBaziData(b);
      addHistory({
        id: `h-${info.year}-${info.month}-${info.day}-${info.hour}`,
        birthInfo: info,
        zodiacData: z,
        baziData: b,
        createdAt: Date.now(),
      });
    }
  }, []);

  const handleBack = () => {
    sessionStorage.removeItem('xinghe_birthInfo');
    router.push('/');
  };

  const handleRestart = () => {
    sessionStorage.removeItem('xinghe_birthInfo');
    router.push('/');
  };

  if (!zodiac || !bazi) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center">
        <div className="text-[#94A3B8]">加载中...</div>
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

        {/* Cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

          {/* Constellation Card */}
          <div className={`content-card mobile-tab-content ${activeTab === 'constellation' ? 'active' : ''}`}>
            <div className="flex items-center gap-2.5 mb-5">
              <span className="text-2xl">✨</span>
              <h2 className="text-lg font-semibold">星座分析</h2>
            </div>
            <div className="h-px bg-[#2D2D44] mb-5" />
            <div className="space-y-4">
              {[
                { type: '太阳', symbol: zodiac.sun.symbol, sign: zodiac.sun, trait: zodiac.sun.trait, date: `${zodiac.sun.start} - ${zodiac.sun.end}` },
                { type: '月亮', symbol: '☽', sign: zodiac.moon, trait: zodiac.moon.trait, date: '每日流转' },
                { type: '上升', symbol: '↑', sign: zodiac.rising, trait: zodiac.rising.trait, date: '由时辰决定' },
              ].map(item => (
                <div key={item.type} className="flex gap-3 p-4 bg-[#1A1A2E] rounded-[var(--radius-md)] border border-transparent hover:border-[rgba(99,102,241,0.25)] transition-all">
                  <div className="w-11 h-11 rounded-[var(--radius-sm)] bg-[rgba(99,102,241,0.08)] flex items-center justify-center text-3xl flex-shrink-0">
                    {item.symbol}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base mb-0.5">{item.type} {item.sign.name}</div>
                    <div className="text-xs text-[#475569] mb-1.5">{item.date}</div>
                    <div className="text-sm text-[#94A3B8] leading-relaxed">{item.trait}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bazi Card */}
          <div className={`content-card mobile-tab-content ${activeTab === 'bazi' ? 'active' : ''}`}>
            <div className="flex items-center gap-2.5 mb-5">
              <span className="text-2xl">🀄</span>
              <h2 className="text-lg font-semibold">八字排盘</h2>
            </div>
            <div className="h-px bg-[#2D2D44] mb-5" />

            {/* Pillars */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {(['year', 'month', 'day', 'hour'] as const).map(key => (
                <div key={key} className="bg-[#1A1A2E] rounded-[var(--radius-sm)] p-3">
                  <div className="text-xs text-[#475569] uppercase tracking-wider mb-1">
                    {key === 'year' ? '年柱' : key === 'month' ? '月柱' : key === 'day' ? '日柱' : '时柱'}
                  </div>
                  <div className="text-lg font-semibold">
                    <span className="text-[#F59E0B]">{bazi.pillars[key].gan}</span>
                    <span className="text-[#818CF8]"> {bazi.pillars[key].zhi}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Wuxing bars */}
            <div className="mb-5">
              <div className="text-sm text-[#94A3B8] mb-3 font-medium">五行分布</div>
              <div className="space-y-2.5">
                {wuxingLabels.map(w => (
                  <WuxingBar
                    key={w.key}
                    name={w.name}
                    count={bazi.wuxing[w.key]}
                    maxCount={maxWuxing}
                    colorClass={w.color}
                  />
                ))}
              </div>
            </div>

            {/* Lunar info badge */}
            {bazi.lunarInfo && (
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.2)] rounded-full text-xs text-[#818CF8]">
                  <span>🌙</span>
                  农历 {bazi.lunarInfo.lunarYear}年
                  {bazi.lunarInfo.isLeapMonth && <span className="text-[#F59E0B]">闰</span>}
                  {bazi.lunarInfo.lunarMonth}月{bazi.lunarInfo.lunarDay}日
                </div>
              </div>
            )}

            {/* Dayun summary */}
            <div className="bg-[rgba(99,102,241,0.06)] border border-[rgba(99,102,241,0.15)] rounded-[var(--radius-md)] p-3 text-sm text-[#94A3B8] leading-relaxed">
              <strong className="text-[#818CF8]">{bazi.dayMaster}</strong> 坐
              <span className="text-[#818CF8]">{wuxingLabels.find(w => bazi.wuxing[w.key] === maxWuxing)?.name ?? ''}</span>，
              五行{ bazi.dayStrength === 'strong' ? '偏旺' : bazi.dayStrength === 'weak' ? '偏弱' : '中和' }。
              {bazi.dayun.summary.replace(/日主.*?。/, '')}
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className={`mobile-tab-content ${activeTab === 'chat' ? 'active' : ''}`}>
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
    </div>
  );
}
