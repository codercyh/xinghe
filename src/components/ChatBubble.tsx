'use client';

interface ChatBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
}

// 一整段回复，内嵌格式渲染
function RichText({ text }: { text: string }) {
  const lines = text.split('\n').filter(l => l.trim());

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // 标题行：# 开头
        if (/^#{1,3}\s/.test(trimmed)) {
          const level = trimmed.match(/^(#+)/)?.[1].length ?? 1;
          const content = trimmed.replace(/^#+\s*/, '');
          const sizes = ['text-base', 'text-sm', 'text-xs'];
          return (
            <div key={i} className={`font-bold text-[#F59E0B] ${sizes[level - 1] ?? 'text-sm'} mt-3 first:mt-0 flex items-center gap-2`}>
              <span>{level === 1 ? '◆' : level === 2 ? '▶' : '•'}</span>
              {content}
            </div>
          );
        }

        // 列表项：1. 或 • 开头
        if (/^\d+[.、：:]\s/.test(trimmed)) {
          const num = trimmed.match(/^\d+/)?.[0] ?? '';
          const content = trimmed.replace(/^\d+[.、：:]\s*/, '');
          return (
            <div key={i} className="flex gap-2.5 items-start pl-2">
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {num}
              </span>
              <span className="text-sm text-[#CBD5E1] leading-relaxed flex-1">{renderInline(content)}</span>
            </div>
          );
        }

        if (/^[•\-\*]\s/.test(trimmed)) {
          const content = trimmed.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={i} className="flex gap-2.5 items-start pl-2">
              <span className="text-[#818CF8] mt-0.5 flex-shrink-0">◆</span>
              <span className="text-sm text-[#CBD5E1] leading-relaxed flex-1">{renderInline(content)}</span>
            </div>
          );
        }

        // 普通段落
        return (
          <p key={i} className="text-sm text-[#CBD5E1] leading-relaxed pl-2">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// 内联高亮：*文字* 或 **文字**
function renderInline(text: string) {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining) {
    // **bold**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      }
      parts.push(<strong key={key++} className="font-bold text-white">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // *italic*
    const italicMatch = remaining.match(/\*(.+?)\*/);
    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, italicMatch.index)}</span>);
      }
      parts.push(<em key={key++} className="italic text-[#F59E0B]">{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      continue;
    }

    // 关键词高亮：带「」的词
    const quoteMatch = remaining.match(/『(.+?)』/);
    if (quoteMatch && quoteMatch.index !== undefined) {
      if (quoteMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, quoteMatch.index)}</span>);
      }
      parts.push(
        <span key={key++} className="text-[#818CF8] font-medium border-b border-[#818CF8]/30">
          『{quoteMatch[1]}』
        </span>
      );
      remaining = remaining.slice(quoteMatch.index + quoteMatch[0].length);
      continue;
    }

    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return parts;
}

export default function ChatBubble({ content, role, timestamp }: ChatBubbleProps) {
  if (role === 'user') {
    return (
      <div className="flex gap-3 flex-row-reverse animate-[msgIn_0.4s_ease-out]">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FCD34D] flex items-center justify-center text-lg flex-shrink-0 shadow-lg shadow-orange-500/20">
          😊
        </div>
        <div className="max-w-[78%]">
          <div className="bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white rounded-l-2xl rounded-tr-2xl rounded-br-sm px-5 py-3.5 text-sm leading-relaxed shadow-lg shadow-indigo-500/20">
            {content}
          </div>
          {timestamp && <div className="text-xs text-[#475569] mt-1.5 text-right pr-1">{timestamp}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-[msgIn_0.4s_ease-out]">
      {/* AI 头像 */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366F1] to-[#EC4899] flex items-center justify-center text-lg flex-shrink-0 shadow-lg shadow-indigo-500/20">
        ✨
      </div>

      {/* 单卡片，内容分区块渲染 */}
      <div className="max-w-[82%] flex-1">
        <div className="bg-[#16162A] border border-[#2D2D44] rounded-2xl px-6 py-5 shadow-xl shadow-indigo-500/5">
          {/* 顶部装饰线 */}
          <div className="flex items-center gap-1.5 mb-4 pb-3 border-b border-[#2D2D44]">
            <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <div className="w-2 h-2 rounded-full bg-[#4ADE80]" />
            <div className="w-2 h-2 rounded-full bg-[#818CF8]" />
            <span className="ml-2 text-xs text-[#475569]">星合解读</span>
          </div>

          {/* 内容 */}
          <RichText text={content} />
        </div>

        {timestamp && <div className="text-xs text-[#475569] pl-1 mt-1.5">{timestamp}</div>}
      </div>
    </div>
  );
}
