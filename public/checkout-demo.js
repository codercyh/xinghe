(async function(){
  document.addEventListener('click', async (e)=>{
    const btn = (e.target && e.target.closest && e.target.closest('[data-checkout-btn]'));
    if(!btn) return;
    e.preventDefault();
    btn.disabled = true;
    btn.textContent = '跳转中...';
    try{
      const res = await fetch('/api/checkout', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ priceId: null, quantity:1 }) });
      const j = await res.json();
      if(j.url){ window.location.href = j.url; }
      else { alert('无法创建结账会话'); }
    }catch(err){ alert('网络错误'); console.error(err); }
    finally{ btn.disabled = false; btn.textContent = '购买完整版'; }
  });
})();
