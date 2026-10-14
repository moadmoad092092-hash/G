(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const toast = (message) => {
    const el = $('#toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2400);
  };

  // Navigation
  function showTab(id) {
    $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
    $$('.panel').forEach(p => p.classList.toggle('active', p.id === id));
    const panel = $('#' + id);
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $$('.tab').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  $$('[data-go]').forEach(b => b.addEventListener('click', () => showTab(b.dataset.go)));

  // Local text/code scanner: heuristic checks only, no network requests.
  const scanInput = $('#scanInput');
  scanInput.addEventListener('input', () => $('#charCount').textContent = `${scanInput.value.length} حرف`);
  $('#clearScan').addEventListener('click', () => {
    scanInput.value = ''; $('#charCount').textContent = '0 حرف';
    $('#scanResults').className = 'results empty';
    $('#scanResults').innerHTML = '<span class="result-symbol">⌁</span><b>بانتظار الإدخال</b><p>الفحص لا يرسل بياناتك إلى أي خادم.</p>';
  });
  $('#scanBtn').addEventListener('click', () => {
    const code = scanInput.value;
    const out = $('#scanResults');
    if (!code.trim()) {
      out.className = 'results empty';
      out.innerHTML = '<span class="result-symbol">!</span><b>أدخل نصًا أولًا</b><p>الصق نصًا أو كودًا ثم أعد الفحص.</p>';
      return;
    }
    const findings = [];
    const lines = code.split(/\r?\n/);
    const opens = (code.match(/\{/g)||[]).length, closes = (code.match(/\}/g)||[]).length;
    if (opens !== closes) findings.push(['warn','الأقواس المعقوفة','عدد { و } غير متساوٍ؛ راجع توازن الأقواس.']);
    const parenOpen = (code.match(/\(/g)||[]).length, parenClose = (code.match(/\)/g)||[]).length;
    if (parenOpen !== parenClose) findings.push(['warn','الأقواس الدائرية','قد يوجد قوس دائري مفقود أو زائد.']);
    if (/while\s+true\s+do/i.test(code) || /while\s*\(\s*true\s*\)/i.test(code)) findings.push(['warn','حلقة مستمرة','تم العثور على حلقة مستمرة؛ تأكد من وجود انتظار أو شرط خروج مناسب.']);
    if (/WaitForChild\s*\(/.test(code)) findings.push(['ok','انتظار عنصر','استخدام WaitForChild شائع في Roblox، لكن تحقق من وجود العنصر فعلًا.']);
    if (/https?:\/\/|loadstring\s*\(/i.test(code)) findings.push(['bad','مراجعة مصدر خارجي','الكود يحتوي على رابط أو loadstring؛ لا تشغّل شيئًا لا تثق بمصدره.']);
    if (/TODO|FIXME|YOUR_CODE_HERE/i.test(code)) findings.push(['warn','علامة إكمال','وجدت علامة تشير إلى كود قد يكون غير مكتمل.']);
    if (/console\.log|print\s*\(/i.test(code)) findings.push(['ok','رسائل تشخيص','وجدت طباعة/تسجيلًا قد يساعد على تتبع التنفيذ.']);
    if (!findings.length) findings.push(['ok','لم تُكتشف مؤشرات واضحة','لم تعثر الفحوصات البسيطة على الأنماط التي تبحث عنها؛ هذا لا يثبت أن الكود صحيح أو آمن.']);
    const summary = `<div class="result-item"><strong>اكتمل الفحص</strong><br>عدد الأسطر: ${lines.length} · عدد الأحرف: ${code.length}</div>`;
    out.className = 'results';
    out.innerHTML = summary + findings.map(([type,title,desc]) => `<div class="result-item ${type==='warn'?'warn':type==='bad'?'bad':''}"><strong>${type==='ok'?'✓':type==='warn'?'⚠':'!'} ${escapeHtml(title)}</strong><br>${escapeHtml(desc)}</div>`).join('');
  });
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // Simulated terminal. All output is fictional and local.
  const terminal = $('#terminalOutput');
  const commands = {
    scan: ['بدء الفحص التشخيصي الوهمي...', 'الواجهة: ONLINE', 'وحدة الشفرات: READY', 'الاتصال الخارجي: غير مستخدم', 'النتيجة: اكتمل الفحص التجريبي بنجاح.'],
    files: ['/simulated-root', '├── welcome.txt', '├── cipher_lab/', '├── identity_card.demo', '└── system_status.log', 'تنبيه: هذه أسماء ملفات وهمية داخل المحاكاة فقط.'],
    access: ['إرسال طلب وصول تجريبي...', 'فحص الصلاحيات: DEMO MODE', 'النتيجة: ACCESS GRANTED (SIMULATION)', 'لم يتم الاتصال بأي جهاز أو نظام خارجي.'],
    help: ['الأوامر المتاحة:', 'scan  — فحص وهمي', 'files — عرض ملفات تجريبية', 'access — اختبار وصول محاكى', 'help  — عرض هذه القائمة']
  };
  function runCommand(key) {
    const lines = commands[key] || commands.help;
    const block = document.createElement('div');
    block.innerHTML = `<p class="term-prompt">guest@lab:~$ ${key}</p>` + lines.map((line,i) => `<p style="color:${i===lines.length-1?'#5cff8d':'#b7d7bf'}">${escapeHtml(line)}</p>`).join('');
    terminal.appendChild(block);
    const prompt = document.createElement('p'); prompt.className='term-prompt'; prompt.innerHTML='guest@lab:~$ <span class="cursor"></span>';
    terminal.appendChild(prompt); terminal.scrollTop = terminal.scrollHeight;
  }
  $$('.command').forEach(b => b.addEventListener('click', () => runCommand(b.dataset.command)));
  $('#clearTerminal').addEventListener('click', () => {
    terminal.innerHTML = '<p class="term-muted">SECRET LAB SIMULATOR [v1.0]</p><p>تم مسح سجل المحاكاة.</p><p class="term-prompt">guest@lab:~$ <span class="cursor"></span></p>';
  });

  // Caesar cipher for A-Z only
  const shift = $('#shift');
  shift.addEventListener('input', () => $('#shiftValue').textContent = shift.value);
  function caesar(text, amount) {
    return [...text].map(ch => {
      const c = ch.charCodeAt(0);
      if (c >= 65 && c <= 90) return String.fromCharCode((c-65+amount+26)%26+65);
      if (c >= 97 && c <= 122) return String.fromCharCode((c-97+amount+26)%26+97);
      return ch;
    }).join('');
  }
  $('#encodeBtn').addEventListener('click', () => $('#cipherOutput').value = caesar($('#cipherInput').value, Number(shift.value)));
  $('#decodeBtn').addEventListener('click', () => $('#cipherOutput').value = caesar($('#cipherInput').value, -Number(shift.value)));
  $('#copyCipher').addEventListener('click', async () => {
    const value = $('#cipherOutput').value;
    if (!value) { $('#copyStatus').textContent = 'لا توجد نتيجة لنسخها.'; return; }
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
      else {
        const temp = $('#cipherOutput'); temp.focus(); temp.select();
        if (!document.execCommand('copy')) throw new Error('copy failed');
      }
      $('#copyStatus').textContent = 'تم نسخ النتيجة.'; toast('تم نسخ النتيجة');
    } catch { $('#copyStatus').textContent = 'تعذّر النسخ تلقائيًا؛ حدّد النتيجة وانسخها يدويًا.'; }
  });

  // Live identity card
  const alias = $('#alias'), rank = $('#rank'), bio = $('#bioText');
  function updateCard() {
    $('#cardAlias').textContent = alias.value.trim() || 'UNKNOWN_AGENT';
    $('#cardRank').textContent = rank.value;
    $('#cardBio').textContent = bio.value.trim() || 'لا توجد نبذة.';
  }
  [alias,rank,bio].forEach(el => el.addEventListener('input', updateCard));
  $('#saveCard').addEventListener('click', () => {
    updateCard();
    const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 650;
    const ctx = canvas.getContext('2d');
    const bg = ctx.createLinearGradient(0,0,1000,650); bg.addColorStop(0,'#102b18'); bg.addColorStop(1,'#030704');
    ctx.fillStyle=bg; ctx.fillRect(0,0,1000,650);
    ctx.strokeStyle='#3c9254'; ctx.lineWidth=3; roundRect(ctx,24,24,952,602,24); ctx.stroke();
    ctx.strokeStyle='#234d2e'; ctx.lineWidth=2; roundRect(ctx,42,42,916,566,18); ctx.stroke();
    ctx.fillStyle='#a7c7b0'; ctx.font='600 22px monospace'; ctx.textAlign='left'; ctx.fillText('SECRET LAB',65,88);
    ctx.fillStyle='#5cff8d'; ctx.font='18px monospace'; ctx.textAlign='right'; ctx.fillText('● VERIFIED SIM',935,88);
    ctx.fillStyle='#102b18'; ctx.strokeStyle='#5cff8d'; ctx.lineWidth=3; roundRect(ctx,425,130,150,150,35); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#5cff8d'; ctx.font='80px sans-serif'; ctx.textAlign='center'; ctx.fillText('◈',500,230);
    ctx.fillStyle='#7eaa8b'; ctx.font='18px monospace'; ctx.fillText('D I G I T A L   I D E N T I T Y',500,330);
    ctx.fillStyle='#eaffee'; ctx.font='bold 43px monospace'; wrapText(ctx, (alias.value.trim()||'UNKNOWN_AGENT').toUpperCase(), 500, 390, 850, 52);
    ctx.fillStyle='#5cff8d'; ctx.font='23px Cairo, sans-serif'; ctx.fillText(rank.value,500,455);
    ctx.fillStyle='#a6c5ae'; ctx.font='20px Cairo, sans-serif'; wrapText(ctx,bio.value.trim()||'لا توجد نبذة.',500,500,820,32);
    ctx.strokeStyle='#25452e'; ctx.beginPath(); ctx.moveTo(65,555); ctx.lineTo(935,555); ctx.stroke();
    ctx.fillStyle='#a7c7b0'; ctx.font='17px monospace'; ctx.textAlign='left'; ctx.fillText('ID / SL-2048',65,590);
    ctx.fillStyle='#5cff8d'; ctx.textAlign='right'; ctx.fillText('◢◤◢◤◢',935,590);
    const a=document.createElement('a'); a.download='secret-lab-identity.png'; a.href=canvas.toDataURL('image/png'); a.click();
    toast('تم تجهيز بطاقة هويتك للحفظ');
  });
  function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function wrapText(ctx,text,x,y,maxWidth,lineHeight){
    const words=String(text).split(/\s+/); let line='', yy=y;
    for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,yy);line=word;yy+=lineHeight;}else line=test;}
    ctx.fillText(line,x,yy);
  }
})();