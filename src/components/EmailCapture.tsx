'use client';

import { useState } from 'react';

export default function EmailCapture({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('请输入有效邮箱');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const j = await res.json();
      if (res.ok) {
        setSuccess(true);
        onSuccess?.();
      } else {
        setError(j.error || '提交失败');
      }
    } catch (err) {
      setError('网络异常');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-4 rounded-lg bg-[#13131F] border border-[#2D2D44] text-center">
        <div className="text-[#F59E0B] font-semibold">已订阅</div>
        <div className="text-sm text-[#94A3B8] mt-2">已发送免费星盘到你的邮箱（示例：无真实发送，需配置邮件服务）</div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="p-4 rounded-lg bg-[#13131F] border border-[#2D2D44]">
      <div className="mb-2 text-sm text-[#94A3B8]">获取免费的精简星盘报告 (PDF)，输入邮箱：</div>
      <input className="w-full mb-2 p-3 rounded bg-[#0F0F1A] border border-[#2D2D44] text-sm" placeholder="你的邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full mb-2 p-3 rounded bg-[#0F0F1A] border border-[#2D2D44] text-sm" placeholder="姓名(可选)" value={name} onChange={(e) => setName(e.target.value)} />
      {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
      <button disabled={loading} className="w-full py-3 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded text-white text-sm">{loading ? '提交中...' : '获取免费报告'}</button>
      <div className="text-xs text-[#475569] mt-2">我们会将报告以邮件形式发送（需配置邮件服务）</div>
    </form>
  );
}
