export async function sendWelcomeEmail(email: string, name?: string) {
  // Placeholder send function. If SENDGRID_API_KEY is provided in env, this will attempt to send.
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SENDGRID_API_KEY not set — skipping sendWelcomeEmail for', email);
    return;
  }

  try {
    // Lazy-require to avoid hard dependency at development time
    // Install with: npm install @sendgrid/mail
    const sg = require('@sendgrid/mail');
    sg.setApiKey(process.env.SENDGRID_API_KEY);
    const from = process.env.SENDGRID_FROM || 'noreply@yourdomain.com';
    await sg.send({
      to: email,
      from,
      subject: '感谢订阅 — 你的星合报告即将到达',
      text: `感谢订阅，${name || ''}。我们已收到你的申请，稍后会把免费报告发到你的邮箱（示例）。`,
      html: `<p>感谢订阅，${name || ''}。</p><p>我们已收到你的申请，稍后会把免费报告发到你的邮箱（示例）。</p>`,
    });
    console.log('sendWelcomeEmail sent to', email);
  } catch (err) {
    console.error('sendWelcomeEmail error', err);
  }
}
