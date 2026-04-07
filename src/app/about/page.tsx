'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export default function AboutPage() {
  const [activeSection, setActiveSection] = useState<'about' | 'disclaimer'>('about');

  return (
    <div className="page-bg relative z-[1] min-h-screen pb-12">
      {/* Nav */}
      <nav className="nav-bar">
        <Link href="/" className="btn-secondary px-4 py-2 text-sm">← 返回</Link>
        <div className="nav-logo">✦ 星合</div>
        <div className="w-16" />
      </nav>

      <div className="max-w-[720px] mx-auto px-4 pt-28">

        {/* Hero */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="text-center mb-10"
        >
          <motion.h1
            custom={0}
            variants={fadeUp}
            className="text-4xl font-bold mb-3"
          >
            <span className="gradient-text">✦ 星合 ✦</span>
          </motion.h1>
          <motion.p
            custom={1}
            variants={fadeUp}
            className="text-[#94A3B8] text-lg"
          >
            星座 × 八字 × AI · 探索你的星图密码
          </motion.p>
          <motion.div
            custom={2}
            variants={fadeUp}
            className="flex items-center justify-center gap-6 mt-4 text-sm text-[#475569]"
          >
            <span>版本 1.0.0</span>
            <span>·</span>
            <span>2026</span>
          </motion.div>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-8 bg-[#13131F] border border-[#2D2D44] rounded-[var(--radius-md)] p-1">
          {(['about', 'disclaimer'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSection(tab)}
              className={`flex-1 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all ${
                activeSection === tab
                  ? 'bg-[rgba(99,102,241,0.15)] text-[#F1F5F9]'
                  : 'text-[#475569] hover:text-[#94A3B8]'
              }`}
            >
              {tab === 'about' ? '关于星合' : '免责声明'}
            </button>
          ))}
        </div>

        {/* About section */}
        {activeSection === 'about' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="content-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">🌟</span> 什么是星合？
              </h2>
              <div className="h-px bg-[#2D2D44] mb-4" />
              <div className="space-y-4 text-[#94A3B8] text-sm leading-relaxed">
                <p>
                  <strong className="text-[#F1F5F9]">星合</strong>是一款融合东方命理与西方星座的 AI 解读工具。
                  只需输入你的出生信息，即可获得太阳星座、月亮星座、上升星座的详细分析，
                  以及基于传统八字体系的命盘解读。
                </p>
                <p>
                  同时，你还可以与三位虚拟大师对话——
                  <strong className="text-[#818CF8]">命理大师</strong>解读八字格局、
                  <strong className="text-[#818CF8]">星座导师</strong>分析星盘能量、
                  <strong className="text-[#818CF8]">塔罗师</strong>指引人生方向。
                </p>
              </div>
            </div>

            <div className="content-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">⚙️</span> 功能特色
              </h2>
              <div className="h-px bg-[#2D2D44] mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: '✨', title: '星座分析', desc: '太阳/月亮/上升三宫详解' },
                  { icon: '🀄', title: '八字排盘', desc: '年柱月柱日柱时柱五行分析' },
                  { icon: '🧙', title: 'AI 对话', desc: '三位大师实时解读命运' },
                  { icon: '🌐', title: '多时区支持', desc: '全球时区自动换算' },
                  { icon: '📱', title: '响应式设计', desc: '手机平板电脑全适配' },
                  { icon: '🔒', title: '隐私优先', desc: '数据仅本地处理，不上传' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-[#1A1A2E] rounded-[var(--radius-md)] border border-[#2D2D44]">
                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <div className="font-medium text-sm text-[#F1F5F9] mb-0.5">{item.title}</div>
                      <div className="text-xs text-[#475569]">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="content-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">💡</span> 技术栈
              </h2>
              <div className="h-px bg-[#2D2D44] mb-4" />
              <div className="flex flex-wrap gap-2">
                {['Next.js 16', 'React 19', 'TypeScript', 'Framer Motion', 'Tailwind CSS', 'Zustand', 'Zod', 'React Hook Form', 'MiniMax AI'].map(tech => (
                  <span key={tech} className="px-3 py-1.5 bg-[#1A1A2E] border border-[#2D2D44] rounded-full text-xs text-[#818CF8]">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Disclaimer section */}
        {activeSection === 'disclaimer' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div className="content-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">⚠️</span> 免责声明
              </h2>
              <div className="h-px bg-[#2D2D44] mb-4" />
              <div className="space-y-4 text-[#94A3B8] text-sm leading-relaxed">
                <div className="p-4 bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-[var(--radius-md)]">
                  <p className="text-[#F59E0B] font-semibold mb-1">⚠️ 重要提醒</p>
                  <p className="text-[#94A3B8]">星合所有命理内容仅供娱乐参考，不构成任何形式的人生决策建议。请勿基于本工具的分析结果做出重大人生选择。</p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-[#F1F5F9]">1. 娱乐性质</h3>
                  <p>星合是一款以娱乐为主要目的的星座与命理解读工具。星座分析、八字排盘、AI 对话等所有功能均属于娱乐范畴，不具备科学依据或专业咨询资质。</p>

                  <h3 className="font-semibold text-[#F1F5F9]">2. 非专业咨询</h3>
                  <p>星合不提供任何形式的专业命理咨询、医疗建议、法律建议、财务建议或心理咨询。如需此类帮助，请咨询相应领域的持牌专业人士。</p>

                  <h3 className="font-semibold text-[#F1F5F9]">3. AI 内容说明</h3>
                  <p>AI 大师对话内容由大语言模型（MiniMax M2.7）生成，可能包含不准确、虚构或带有偏见的信息。AI 生成的内容不代表真实命理判断，请保持理性批判的态度。</p>

                  <h3 className="font-semibold text-[#F1F5F9]">4. 八字精度说明</h3>
                  <p>八字排盘基于简化算法计算，精确排盘需考虑真太阳时、夏令时、闰月等因素。如需精确命盘，请咨询专业命理师使用专业软件。</p>

                  <h3 className="font-semibold text-[#F1F5F9]">5. 隐私保护</h3>
                  <p>星合不会将您的出生信息用于任何商业目的。所有数据仅在本地（浏览器端）处理，不会上传至任何第三方服务器。</p>

                  <h3 className="font-semibold text-[#F1F5F9]">6. 服务变更</h3>
                  <p>星合保留随时修改、暂停或终止服务的权利，恕不另行通知。对于因服务变更导致的任何损失，星合不承担责任。</p>
                </div>

                <div className="pt-4 border-t border-[#2D2D44] text-xs text-[#475569] text-center">
                  使用星合即表示您同意上述免责声明。如不同意，请立即停止使用本服务。
                </div>
              </div>
            </div>

            <div className="content-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">🔒</span> 隐私声明
              </h2>
              <div className="h-px bg-[#2D2D44] mb-4" />
              <div className="space-y-3 text-[#94A3B8] text-sm leading-relaxed">
                <p><strong className="text-[#F1F5F9]">我们不收集：</strong>出生日期、出生时间、性别、时区等个人信息不会被上传至任何服务器。</p>
                <p><strong className="text-[#F1F5F9]">本地存储：</strong>您输入的信息仅存储在浏览器本地（sessionStorage），关闭标签页后自动清除。</p>
                <p><strong className="text-[#F1F5F9]">AI 对话：</strong>发送给 AI 的内容仅用于当前会话的对话生成，不会被保存或用于模型训练。</p>
                <p><strong className="text-[#F1F5F9]">Cookies：</strong>本工具不使用任何追踪 Cookie 或第三方分析脚本。</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-[rgba(45,45,68,0.3)] text-center">
          <p className="text-[#475569] text-xs">星合 © 2026 · 仅供娱乐参考，不构成人生决策建议</p>
          <p className="text-[#475569] text-xs mt-1">命理内容由 AI 生成，可能存在偏差，请理性看待</p>
        </footer>
      </div>
    </div>
  );
}
