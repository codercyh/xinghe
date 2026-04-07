'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore, type HistoryItem } from '@/store/userStore';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HistoryCard({ item, onDelete }: { item: HistoryItem; onDelete: () => void }) {
  const router = useRouter();

  const handleView = () => {
    // 通过 sessionStorage 临时传递（避免 store 跨页面传递的复杂性）
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('xinghe_birthInfo', JSON.stringify(item.birthInfo));
    }
    router.push('/result');
  };

  return (
    <div className="content-card flex items-start gap-4 hover:border-[rgba(99,102,241,0.3)] transition-all">
      {/* Left: zodiac symbol */}
      <div className="w-14 h-14 rounded-[var(--radius-md)] bg-[rgba(99,102,241,0.08)] flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-2xl">{item.zodiacData.sun.symbol}</span>
        <span className="text-[10px] text-[#94A3B8] mt-0.5">{item.zodiacData.sun.name}</span>
      </div>

      {/* Middle: info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-base mb-0.5">
          {item.birthInfo.year}年{item.birthInfo.month}月{item.birthInfo.day}日 {String(item.birthInfo.hour).padStart(2,'0')}:{String(item.birthInfo.minute).padStart(2,'0')}
        </div>
        <div className="text-sm text-[#94A3B8] mb-1">
          {item.birthInfo.gender === 'male' ? '♂ 男' : '♀ 女'} · {item.birthInfo.timezone.split('/').pop()}
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs text-[#475569]">
          <span className="inline-flex items-center gap-0.5">
            <span>{item.zodiacData.sun.symbol}</span> {item.zodiacData.sun.name}
          </span>
          <span>·</span>
          <span>月{item.zodiacData.moon.name}</span>
          <span>·</span>
          <span>升{item.zodiacData.rising.name}</span>
          <span>·</span>
          <span className="text-[#F59E0B]">
            {item.baziData.pillars.day.gan}{item.baziData.pillars.day.zhi}
          </span>
        </div>
        <div className="text-xs text-[#475569] mt-1.5">
          查看于 {formatDate(item.createdAt)}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        <button
          onClick={handleView}
          className="btn-primary px-4 py-2 text-sm whitespace-nowrap"
        >
          查看
        </button>
        <button
          onClick={onDelete}
          className="btn-secondary px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#EF4444] hover:border-[#EF4444] whitespace-nowrap"
        >
          删除
        </button>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const { history, removeHistory, clearHistory } = useUserStore();

  return (
    <div className="page-bg relative z-[1] min-h-screen pb-8">
      {/* Nav */}
      <nav className="nav-bar">
        <button onClick={() => router.back()} className="btn-secondary px-4 py-2 text-sm">← 返回</button>
        <div className="nav-logo">✦ 星合</div>
        <Link href="/" className="btn-secondary px-4 py-2 text-sm">首页</Link>
      </nav>

      <div className="max-w-[680px] mx-auto px-4 pt-28">
        {/* Header */}
        <div className="mb-8 animate-[fadeUp_0.6s_ease-out]">
          <h1 className="text-2xl font-bold mb-2">📜 历史记录</h1>
          <p className="text-[#94A3B8] text-sm">
            共保存 {history.length} 条记录，最多保留 20 条
          </p>
        </div>

        {history.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20 animate-[fadeUp_0.6s_ease-out]">
            <div className="text-5xl mb-4">🔮</div>
            <div className="text-[#94A3B8] mb-2">还没有任何记录</div>
            <div className="text-sm text-[#475569] mb-6">快去测算你的星图吧</div>
            <Link href="/" className="btn-primary px-6 py-3 inline-flex">
              开启星合
            </Link>
          </div>
        ) : (
          <>
            {/* Clear all */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  if (confirm('确定要清空所有历史记录吗？')) clearHistory();
                }}
                className="text-sm text-[#94A3B8] hover:text-[#EF4444] transition-colors"
              >
                清空全部
              </button>
            </div>

            {/* History list */}
            <div className="space-y-4">
              {history.map((item) => (
                <HistoryCard
                  key={item.id}
                  item={item}
                  onDelete={() => removeHistory(item.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-[rgba(45,45,68,0.3)] text-center">
        <p className="text-[#475569] text-xs">星合 © 2026 · 仅供娱乐参考</p>
      </footer>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );
}
