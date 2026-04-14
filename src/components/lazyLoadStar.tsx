'use client';

import { useEffect } from 'react';

export default function LazyLoadStar(){
  useEffect(()=>{
    let cancelled=false;
    (async ()=>{
      const Star = (await import('./StarCanvas')).default;
      if(cancelled) return;
      const root = document.getElementById('star-canvas-root');
      if(root){
        const el = document.createElement('div');
        root.appendChild(el);
        const { createRoot } = await import('react-dom/client');
        const r = createRoot(el);
        r.render((<Star/>));
      }
    })();
    return ()=>{ cancelled=true; };
  },[]);
  return null;
}
