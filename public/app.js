// Silicon Based Dispatch — PWA
// OKR + Eisenhower + Kanban + Notatki

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ── Storage ───────────────────────────────────────────────────────
const SK = 'sbd-v1';
function load() {
  try { return JSON.parse(localStorage.getItem(SK)) || defaultData(); }
  catch { return defaultData(); }
}
function save(d) {
  d.lastUpdated = new Date().toLocaleDateString('pl-PL');
  localStorage.setItem(SK, JSON.stringify(d));
}

function defaultData() {
  return {
    okr: {
      quarters: [{
        id: 1, label: 'Q1 2025', active: true,
        objective: 'Uruchomić sprzedaż pierwszego produktu na Allegro',
        krs: [
          { id: 1, text: 'Wydrukować i przetestować 50 sztuk uchwytu Air Rail', progress: 20 },
          { id: 2, text: 'Uzyskać 10 opinii 5★ na Allegro', progress: 0 },
          { id: 3, text: 'Osiągnąć 500 PLN tygodniowego przychodu', progress: 0 },
        ]
      }]
    },
    eisenhower: { q1: [], q2: [], q3: [], q4: [] },
    kanban: {
      cards: [
        { id: 1, col: 'todo',   text: 'Test wydruku PETG — uchwyt Air Rail',  priority: 'high'   },
        { id: 2, col: 'todo',   text: 'Zmierzyć średnicę rury w ambulansie',  priority: 'medium' },
        { id: 3, col: 'inprog', text: 'Założyć konto @drat3d na TikToku',     priority: 'high'   },
      ]
    },
    notes: [
      { id: 1, title: 'Start', body: 'Silicon Based Dispatch — notatki robocze.', pinned: true, created: '2025-03-01' }
    ],
    lastUpdated: new Date().toLocaleDateString('pl-PL')
  };
}

// ── State ─────────────────────────────────────────────────────────
let state = load();
let activeTab = 'okr';
let dragData = null;

function setState(fn) {
  if (typeof fn === 'function') state = fn(state);
  else state = fn;
  save(state);
  render();
}

// ── Helpers ───────────────────────────────────────────────────────
const C = {
  bg: '#07080f', surface: '#0d1117', panel: '#111827',
  border: '#1f2937', border2: '#374151',
  text: '#f1f5f9', muted: '#6b7280', dim: '#374151',
  blue: '#3b82f6', green: '#10b981', yellow: '#f59e0b',
  red: '#ef4444', purple: '#8b5cf6',
};

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'className') e.className = v;
    else e.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}

function styledEl(tag, style, attrs = {}, ...children) {
  return el(tag, { style, ...attrs }, ...children);
}

const div = (style, attrs, ...c) => styledEl('div', style, attrs, ...c);
const span = (style, attrs, ...c) => styledEl('span', style, attrs, ...c);
const btn = (style, attrs, ...c) => styledEl('button', style, attrs, ...c);

function makeBtn(text, onClick, color = C.blue, small = false, ghost = false) {
  return btn({
    padding: small ? '4px 10px' : '7px 16px',
    borderRadius: '7px', border: ghost ? `1px solid ${C.border2}` : 'none',
    background: ghost ? 'transparent' : color,
    color: ghost ? C.muted : '#fff',
    fontWeight: '600', fontSize: small ? '11px' : '13px',
    cursor: 'pointer', fontFamily: 'inherit',
  }, { onClick }, text);
}

function makeInput(value, onChange, placeholder = '', multiline = false, rows = 3) {
  const base = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: `1px solid ${C.border}`, background: C.surface,
    color: C.text, fontSize: '13px', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  };
  if (multiline) {
    const t = el('textarea', { style: { ...base, resize: 'vertical' }, rows, placeholder });
    t.value = value;
    t.addEventListener('input', e => onChange(e.target.value));
    return t;
  }
  const i = el('input', { style: base, placeholder });
  i.value = value;
  i.addEventListener('input', e => onChange(e.target.value));
  return i;
}

function label(text) {
  return span({ fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700', display: 'block', marginBottom: '5px' }, {}, text);
}

function progressBar(pct, color = C.blue) {
  return div({ height: '5px', background: C.border, borderRadius: '99px' }, {},
    div({ width: `${pct}%`, height: '100%', background: color, borderRadius: '99px', transition: 'width .3s' }, {})
  );
}

// ── OKR ──────────────────────────────────────────────────────────
function renderOKR() {
  const quarters = state.okr?.quarters || [];
  const active = quarters.find(q => q.active) || quarters[0];

  // Quarter tabs
  const qtabs = div({ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }, {});
  quarters.forEach(q => {
    const b = btn({
      padding: '6px 14px', borderRadius: '99px',
      border: `1px solid ${q.active ? C.blue : C.border}`,
      background: q.active ? C.blue + '22' : 'transparent',
      color: q.active ? C.blue : C.muted,
      fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
    }, { onClick: () => setState(d => ({ ...d, okr: { quarters: d.okr.quarters.map(x => ({ ...x, active: x.id === q.id })) } })) }, q.label);
    qtabs.appendChild(b);
  });

  // Add quarter btn
  qtabs.appendChild(makeBtn('+ Kwartał', () => {
    const lbl = prompt('Etykieta kwartału (np. Q2 2025):');
    if (!lbl) return;
    const obj = prompt('Cel kwartalny:') || '';
    setState(d => ({ ...d, okr: { quarters: [...d.okr.quarters, { id: Date.now(), label: lbl, active: false, objective: obj, krs: [] }] } }));
  }, C.blue, true, true));

  if (!active) return div({}, {}, qtabs);

  const progress = active.krs.length > 0
    ? Math.round(active.krs.reduce((a, k) => a + k.progress, 0) / active.krs.length) : 0;
  const pColor = progress >= 70 ? C.green : progress >= 40 ? C.yellow : C.red;

  // Objective card
  const objCard = div({
    background: C.panel, border: `1px solid ${C.purple}44`,
    borderLeft: `3px solid ${C.purple}`,
    borderRadius: '12px', padding: '16px', marginBottom: '16px'
  }, {});

  objCard.appendChild(label('Cel kwartalny (Objective)'));
  const objText = div({ color: C.text, fontSize: '15px', fontWeight: '700', lineHeight: '1.4', marginBottom: '12px', cursor: 'pointer' }, {
    onClick: () => {
      const val = prompt('Cel kwartalny:', active.objective);
      if (val !== null) setState(d => ({ ...d, okr: { quarters: d.okr.quarters.map(q => q.id !== active.id ? q : { ...q, objective: val }) } }));
    }
  }, active.objective || '(kliknij aby ustawić cel)');
  objCard.appendChild(objText);

  const progRow = div({ display: 'flex', alignItems: 'center', gap: '10px' }, {});
  progRow.appendChild(div({ flex: '1' }, {}, progressBar(progress, pColor)));
  progRow.appendChild(span({ fontSize: '13px', fontWeight: '800', color: pColor, minWidth: '36px', textAlign: 'right' }, {}, `${progress}%`));
  objCard.appendChild(progRow);

  // KRs
  const krsSection = div({ marginBottom: '12px' }, {});
  krsSection.appendChild(label('Kluczowe wyniki (Key Results)'));

  active.krs.forEach((kr, i) => {
    const krCard = div({
      background: C.panel, border: `1px solid ${C.border}`,
      borderRadius: '10px', padding: '12px', marginBottom: '10px',
      display: 'flex', alignItems: 'flex-start', gap: '12px'
    }, {});

    krCard.appendChild(div({
      width: '22px', height: '22px', borderRadius: '50%', background: C.border,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '11px', fontWeight: '800', color: C.muted, flexShrink: '0', marginTop: '1px'
    }, {}, String(i + 1)));

    const krBody = div({ flex: '1' }, {});
    krBody.appendChild(div({ color: C.text, fontSize: '13px', marginBottom: '6px', lineHeight: '1.4' }, {}, kr.text));
    if (kr.created) krBody.appendChild(div({ fontSize: '10px', color: C.dim, marginBottom: '6px' }, {}, `Dodano: ${kr.created}`));

    const sliderRow = div({ display: 'flex', alignItems: 'center', gap: '10px' }, {});
    const slider = el('input', { type: 'range', min: '0', max: '100', value: String(kr.progress), style: { flex: '1', accentColor: kr.progress >= 70 ? C.green : kr.progress >= 40 ? C.yellow : C.blue } });
    slider.addEventListener('input', e => {
      setState(d => ({ ...d, okr: { quarters: d.okr.quarters.map(q => q.id !== active.id ? q : { ...q, krs: q.krs.map(k => k.id !== kr.id ? k : { ...k, progress: Number(e.target.value) }) }) } }));
    });
    sliderRow.appendChild(slider);
    sliderRow.appendChild(span({ fontSize: '12px', fontWeight: '700', color: kr.progress >= 70 ? C.green : C.muted, minWidth: '32px' }, {}, `${kr.progress}%`));
    krBody.appendChild(sliderRow);
    krCard.appendChild(krBody);

    const delBtn = btn({ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: '16px', padding: '0 4px' }, {
      onClick: () => setState(d => ({ ...d, okr: { quarters: d.okr.quarters.map(q => q.id !== active.id ? q : { ...q, krs: q.krs.filter(k => k.id !== kr.id) }) } }))
    }, '✕');
    krCard.appendChild(delBtn);
    krsSection.appendChild(krCard);
  });

  // Add KR
  const addRow = div({ display: 'flex', gap: '8px', marginTop: '8px' }, {});
  let newKRText = '';
  const krInput = makeInput('', v => { newKRText = v; }, 'Dodaj kluczowy wynik...');
  krInput.style.flex = '1';
  addRow.appendChild(krInput);
  addRow.appendChild(makeBtn('+', () => {
    if (!newKRText.trim()) return;
    setState(d => ({ ...d, okr: { quarters: d.okr.quarters.map(q => q.id !== active.id ? q : { ...q, krs: [...q.krs, { id: Date.now(), text: newKRText.trim(), progress: 0, created: new Date().toLocaleString('pl-PL') }] }) } }));
    krInput.value = ''; newKRText = '';
  }));
  krsSection.appendChild(addRow);

  return div({}, {}, qtabs, objCard, krsSection);
}

// ── EISENHOWER ────────────────────────────────────────────────────
const EQ = {
  q1: { label: 'Ważne + Pilne',       sub: 'Zrób teraz',         color: C.red,    borderColor: '#7f1d1d' },
  q2: { label: 'Ważne + Niepilne',    sub: 'Zaplanuj',           color: C.blue,   borderColor: '#1e3a5f' },
  q3: { label: 'Nieważne + Pilne',    sub: 'Deleguj lub skróć',  color: C.yellow, borderColor: '#713f12' },
  q4: { label: 'Nieważne + Niepilne', sub: 'Eliminuj',           color: C.muted,  borderColor: C.border  },
};

function renderEisenhower() {
  const grid = div({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }, {});

  for (const [qk, qd] of Object.entries(EQ)) {
    const tasks = state.eisenhower?.[qk] || [];
    const qDiv = div({
      background: C.panel, border: `1px solid ${qd.borderColor}`,
      borderRadius: '12px', padding: '14px', minHeight: '180px',
    }, {
      ondragover: e => e.preventDefault(),
      ondrop: () => {
        if (!dragData || dragData.q === qk) return;
        const task = (state.eisenhower[dragData.q] || []).find(t => t.id === dragData.id);
        if (!task) return;
        setState(d => ({
          ...d, eisenhower: {
            ...d.eisenhower,
            [dragData.q]: d.eisenhower[dragData.q].filter(t => t.id !== dragData.id),
            [qk]: [...(d.eisenhower[qk] || []), task],
          }
        }));
        dragData = null;
      }
    });

    // Header
    const hdr = div({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }, {});
    hdr.appendChild(div({}, {},
      span({ fontSize: '12px', fontWeight: '800', color: qd.color, display: 'block' }, {}, qd.label),
      span({ fontSize: '10px', color: C.muted }, {}, qd.sub)
    ));
    const addBtn = btn({
      background: qd.color + '22', border: 'none', borderRadius: '6px', color: qd.color,
      width: '22px', height: '22px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }, {
      onClick: () => {
        const text = prompt(`Nowe zadanie (${qd.label}):`);
        if (!text?.trim()) return;
        setState(d => ({ ...d, eisenhower: { ...d.eisenhower, [qk]: [...(d.eisenhower[qk] || []), { id: Date.now(), text: text.trim(), done: false, created: new Date().toLocaleString('pl-PL') }] } }));
      }
    }, '+');
    hdr.appendChild(addBtn);
    qDiv.appendChild(hdr);

    // Tasks
    tasks.forEach(t => {
      const tDiv = div({
        display: 'flex', alignItems: 'flex-start', gap: '7px',
        marginBottom: '6px', padding: '6px 8px', borderRadius: '7px',
        background: C.surface, border: `1px solid ${C.border}`,
        cursor: 'grab', opacity: t.done ? '0.4' : '1',
      }, {
        draggable: true,
        ondragstart: () => { dragData = { q: qk, id: t.id }; },
      });

      const cb = el('input', { type: 'checkbox', style: { accentColor: qd.color, marginTop: '2px', flexShrink: '0' } });
      cb.checked = t.done;
      cb.addEventListener('change', () => {
        setState(d => ({ ...d, eisenhower: { ...d.eisenhower, [qk]: d.eisenhower[qk].map(x => x.id === t.id ? { ...x, done: !x.done } : x) } }));
      });
      tDiv.appendChild(cb);
      tDiv.appendChild(span({ flex: '1', fontSize: '12px', color: C.text, lineHeight: '1.4', textDecoration: t.done ? 'line-through' : 'none' }, {}, t.text));
      if (t.created) tDiv.appendChild(span({ fontSize: '10px', color: C.dim, flexShrink: '0' }, {}, t.created));
      const del = btn({ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: '13px', padding: '0', flexShrink: '0' }, {
        onClick: () => setState(d => ({ ...d, eisenhower: { ...d.eisenhower, [qk]: d.eisenhower[qk].filter(x => x.id !== t.id) } }))
      }, '✕');
      tDiv.appendChild(del);
      qDiv.appendChild(tDiv);
    });

    if (tasks.length === 0) {
      qDiv.appendChild(div({ color: C.dim, fontSize: '11px', textAlign: 'center', marginTop: '16px', fontStyle: 'italic' }, {}, 'Dotknij + aby dodać'));
    }

    grid.appendChild(qDiv);
  }

  grid.appendChild(div({ fontSize: '11px', color: C.dim, textAlign: 'center', gridColumn: '1/-1', marginTop: '4px' }, {}, 'Przeciągnij zadanie między ćwiartkami'));
  return grid;
}

// ── KANBAN ────────────────────────────────────────────────────────
const COLS = [
  { id: 'todo',   label: 'Do zrobienia', color: C.muted  },
  { id: 'inprog', label: 'W toku',       color: C.blue   },
  { id: 'review', label: 'Przegląd',     color: C.yellow },
  { id: 'done',   label: 'Gotowe',       color: C.green  },
];
const PRIO = { high: { label: 'Wysoki', color: C.red }, medium: { label: 'Średni', color: C.yellow }, low: { label: 'Niski', color: C.green } };

function renderKanban() {
  const cards = state.kanban?.cards || [];
  const wip = cards.filter(c => c.col === 'inprog').length;

  const wrap = div({}, {});

  if (wip > 3) {
    wrap.appendChild(div({
      background: C.yellow + '15', border: `1px solid ${C.yellow}44`,
      borderRadius: '8px', padding: '8px 14px', marginBottom: '16px',
      fontSize: '12px', color: C.yellow,
    }, {}, `⚠️ ${wip} zadania w toku — limit to 3`));
  }

  const grid = div({ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }, {});

  COLS.forEach(col => {
    const colCards = cards.filter(c => c.col === col.id);
    const colDiv = div({
      background: C.panel, border: `1px solid ${C.border}`,
      borderRadius: '12px', padding: '10px', minHeight: '150px',
    }, {
      ondragover: e => e.preventDefault(),
      ondrop: () => {
        if (!dragData?.cardId) return;
        setState(d => ({ ...d, kanban: { cards: d.kanban.cards.map(c => c.id === dragData.cardId ? { ...c, col: col.id } : c) } }));
        dragData = null;
      }
    });

    // Col header
    const hdr = div({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }, {});
    hdr.appendChild(div({ display: 'flex', alignItems: 'center', gap: '6px' }, {},
      div({ width: '8px', height: '8px', borderRadius: '50%', background: col.color }, {}),
      span({ fontSize: '11px', fontWeight: '700', color: C.text }, {}, col.label),
      span({ fontSize: '11px', color: C.muted, fontFamily: 'monospace' }, {}, String(colCards.length)),
    ));
    hdr.appendChild(btn({ background: 'none', border: `1px solid ${C.border2}`, borderRadius: '6px', color: C.muted, padding: '2px 8px', cursor: 'pointer', fontSize: '13px' }, {
      onClick: () => {
        const text = prompt('Nowe zadanie:');
        if (!text?.trim()) return;
        const prios = ['high', 'medium', 'low'];
        const prio = prompt('Priorytet (high/medium/low):', 'medium') || 'medium';
        setState(d => ({ ...d, kanban: { cards: [...d.kanban.cards, { id: Date.now(), col: col.id, text: text.trim(), priority: prios.includes(prio) ? prio : 'medium', created: new Date().toLocaleString('pl-PL') }] } }));
      }
    }, '+'));
    colDiv.appendChild(hdr);

    colCards.forEach(card => {
      const p = PRIO[card.priority] || PRIO.medium;
      const cardDiv = div({
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: '8px', padding: '8px 10px', marginBottom: '6px', cursor: 'grab',
      }, {
        draggable: true,
        ondragstart: () => { dragData = { cardId: card.id }; },
      });
      const top = div({ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px', marginBottom: '6px' }, {});
      top.appendChild(span({ fontSize: '11px', color: C.text, lineHeight: '1.4', flex: '1' }, {}, card.text));
      top.appendChild(btn({ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: '12px', padding: '0', flexShrink: '0' }, {
        onClick: () => setState(d => ({ ...d, kanban: { cards: d.kanban.cards.filter(c => c.id !== card.id) } }))
      }, '✕'));
      cardDiv.appendChild(top);
      const cardBottom = div({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, {});
      cardBottom.appendChild(span({ fontSize: '9px', fontWeight: '700', color: p.color, background: p.color + '22', borderRadius: '4px', padding: '2px 6px' }, {}, p.label));
      if (card.created) cardBottom.appendChild(span({ fontSize: '9px', color: C.dim }, {}, card.created));
      cardDiv.appendChild(cardBottom);
      colDiv.appendChild(cardDiv);
    });

    grid.appendChild(colDiv);
  });

  wrap.appendChild(grid);
  return wrap;
}

// ── NOTES ─────────────────────────────────────────────────────────
function renderNotes() {
  const notes = state.notes || [];
  const wrap = div({}, {});

  const topBar = div({ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }, {});
  topBar.appendChild(makeBtn('+ Nowa notatka', () => {
    const title = prompt('Tytuł:');
    if (!title?.trim()) return;
    const body = prompt('Treść (opcjonalnie):') || '';
    setState(d => ({ ...d, notes: [...(d.notes || []), { id: Date.now(), title: title.trim(), body, pinned: false, created: new Date().toLocaleString('pl-PL') }] }));
  }));
  wrap.appendChild(topBar);

  const pinned = notes.filter(n => n.pinned);
  const rest = notes.filter(n => !n.pinned);

  function noteCard(n) {
    const card = div({
      background: C.panel,
      border: `1px solid ${n.pinned ? C.yellow + '44' : C.border}`,
      borderRadius: '12px', padding: '14px', marginBottom: '10px',
    }, {});

    const hdr = div({ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }, {});
    hdr.appendChild(span({ fontWeight: '700', color: C.text, fontSize: '13px', flex: '1', lineHeight: '1.3' }, {}, n.title));
    const acts = div({ display: 'flex', gap: '4px', marginLeft: '8px', flexShrink: '0' }, {});
    acts.appendChild(btn({ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', opacity: n.pinned ? '1' : '0.3' }, {
      onClick: () => setState(d => ({ ...d, notes: d.notes.map(x => x.id === n.id ? { ...x, pinned: !x.pinned } : x) }))
    }, '📌'));
    acts.appendChild(btn({ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: C.muted }, {
      onClick: () => {
        const title = prompt('Tytuł:', n.title);
        if (title === null) return;
        const body = prompt('Treść:', n.body);
        if (body === null) return;
        setState(d => ({ ...d, notes: d.notes.map(x => x.id === n.id ? { ...x, title, body } : x) }));
      }
    }, '✏️'));
    acts.appendChild(btn({ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: C.dim }, {
      onClick: () => setState(d => ({ ...d, notes: d.notes.filter(x => x.id !== n.id) }))
    }, '🗑️'));
    hdr.appendChild(acts);
    card.appendChild(hdr);

    if (n.body) card.appendChild(div({ fontSize: '12px', color: C.muted, lineHeight: '1.6', whiteSpace: 'pre-wrap', maxHeight: '100px', overflow: 'hidden' }, {}, n.body));
    card.appendChild(div({ fontSize: '10px', color: C.dim, marginTop: '8px' }, {}, n.created));
    return card;
  }

  if (pinned.length > 0) {
    wrap.appendChild(label('📌 Przypięte'));
    pinned.forEach(n => wrap.appendChild(noteCard(n)));
  }
  if (rest.length > 0) {
    if (pinned.length > 0) wrap.appendChild(label('Pozostałe'));
    rest.forEach(n => wrap.appendChild(noteCard(n)));
  }
  if (notes.length === 0) {
    wrap.appendChild(div({ color: C.muted, textAlign: 'center', padding: '60px 0', fontSize: '14px' }, {}, 'Brak notatek.'));
  }

  return wrap;
}

// ── TABS ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'okr',        label: '🎯 OKR'      },
  { id: 'eisenhower', label: '⬛ Priorytety' },
  { id: 'kanban',     label: '📋 Kanban'   },
  { id: 'notes',      label: '📝 Notatki'  },
];

const TAB_DESCRIPTIONS = {
  okr:        'OKR działa na poziomie strategicznym. Raz na kwartał definiujesz jeden cel główny — konkretny, mierzalny, osiągalny w 90 dni. Cel rozkładasz na 2-4 kluczowe wyniki. Raz w tygodniu aktualizujesz suwaki postępu. Jeśli zadanie w kanbanie nie przybliża do żadnego OKR — zapytaj czy warto je robić.',
  eisenhower: 'Używasz raz w tygodniu — najlepiej w niedzielę wieczorem przez 15 minut. Ważne i niepilne to tu buduje się długoterminowa wartość — chroń ten czas. Do kanbana trafia tylko to co przeszło przez ten filtr.',
  kanban:     'Poziom operacyjny — co robisz dziś i jutro. Twardy limit: 3 zadania w toku jednocześnie. Zanim zaczniesz nowe, zamknij jedno otwarte. Zadanie wchodzi z lewej, wychodzi prawą stroną.',
  notes:      'Bufor między rzeczywistością a systemem. Wszystko co pojawia się w głowie ląduje tu natychmiast. Raz w tygodniu podczas przeglądu niedzielnego decydujesz: zadanie do Eisenhowera, pomysł do pipeline, czy można usunąć.',
};

// ── RENDER ────────────────────────────────────────────────────────
function render() {
  const root = document.getElementById('root');
  root.innerHTML = '';
  root.style.cssText = `min-height:100vh;background:${C.bg};font-family:-apple-system,'Segoe UI',sans-serif;color:${C.text};`;

  // Header
  const cards = state.kanban?.cards || [];
  const wip = cards.filter(c => c.col === 'inprog').length;
  const okrQ = state.okr?.quarters?.find(q => q.active);
  const okrPct = okrQ?.krs?.length
    ? Math.round(okrQ.krs.reduce((a, k) => a + k.progress, 0) / okrQ.krs.length) : null;

  const header = div({
    background: C.surface, borderBottom: `1px solid ${C.border}`,
    padding: '12px 16px',
    position: 'sticky', top: '0', zIndex: '100',
  }, {});

  const hInner = div({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, {});
  hInner.appendChild(div({}, {},
    div({ fontWeight: '900', fontSize: '14px', letterSpacing: '-0.3px' }, {},
      span({ color: C.blue }, {}, 'SILICON'),
      span({ color: C.muted, fontWeight: '400' }, {}, ' BASED '),
      span({ color: C.text }, {}, 'DISPATCH'),
    ),
    div({ fontSize: '10px', color: C.dim, marginTop: '2px' }, {}, `Aktualizacja: ${state.lastUpdated}`)
  ));

  const stats = div({ display: 'flex', gap: '6px' }, {});
  if (okrPct !== null) {
    const pColor = okrPct >= 70 ? C.green : okrPct >= 40 ? C.yellow : C.red;
    stats.appendChild(div({ background: C.panel, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '4px 10px', textAlign: 'center' }, {},
      div({ fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }, {}, 'OKR'),
      div({ fontSize: '13px', fontWeight: '800', color: pColor }, {}, `${okrPct}%`)
    ));
  }
  stats.appendChild(div({ background: C.panel, border: `1px solid ${wip > 3 ? C.yellow : C.border}`, borderRadius: '8px', padding: '4px 10px', textAlign: 'center' }, {},
    div({ fontSize: '8px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }, {}, 'W toku'),
    div({ fontSize: '13px', fontWeight: '800', color: wip > 3 ? C.yellow : C.text }, {}, `${wip}/3`)
  ));
  hInner.appendChild(stats);
  header.appendChild(hInner);
  root.appendChild(header);

  // Tab bar
  const tabBar = div({
    background: C.surface, borderBottom: `1px solid ${C.border}`,
    display: 'flex', overflowX: 'auto',
    position: 'sticky', top: '57px', zIndex: '99',
  }, {});

  TABS.forEach(t => {
    const tb = btn({
      padding: '11px 14px', border: 'none', background: 'none',
      borderBottom: `2px solid ${activeTab === t.id ? C.blue : 'transparent'}`,
      color: activeTab === t.id ? C.text : C.muted,
      fontWeight: activeTab === t.id ? '700' : '400',
      fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
      whiteSpace: 'nowrap', transition: 'all .15s',
    }, { onClick: () => { activeTab = t.id; render(); } }, t.label);
    tabBar.appendChild(tb);
  });
  root.appendChild(tabBar);

  // Content
  const content = div({ padding: '16px' }, {});

  // Description banner
  if (TAB_DESCRIPTIONS[activeTab]) {
    content.appendChild(div({
      fontSize: '12px', color: C.muted, lineHeight: '1.6',
      marginBottom: '16px', padding: '10px 14px',
      background: C.panel, borderRadius: '8px',
      borderLeft: `3px solid ${C.blue}`,
    }, {}, TAB_DESCRIPTIONS[activeTab]));
  }

  if (activeTab === 'okr')        content.appendChild(renderOKR());
  if (activeTab === 'eisenhower') content.appendChild(renderEisenhower());
  if (activeTab === 'kanban')     content.appendChild(renderKanban());
  if (activeTab === 'notes')      content.appendChild(renderNotes());
  root.appendChild(content);

  // Install prompt
  if (window._deferredPrompt) {
    const banner = div({
      position: 'fixed', bottom: '16px', left: '16px', right: '16px',
      background: C.blue, borderRadius: '12px', padding: '12px 16px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      zIndex: '200', boxShadow: '0 4px 20px rgba(0,0,0,.5)',
    }, {});
    banner.appendChild(span({ fontSize: '13px', color: '#fff', fontWeight: '600' }, {}, '📲 Zainstaluj aplikację'));
    const installBtn = makeBtn('Zainstaluj', async () => {
      window._deferredPrompt.prompt();
      await window._deferredPrompt.userChoice;
      window._deferredPrompt = null;
      banner.remove();
    }, '#fff', true);
    installBtn.style.color = C.blue;
    banner.appendChild(installBtn);
    root.appendChild(banner);
  }
}

// ── Install prompt ────────────────────────────────────────────────
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  window._deferredPrompt = e;
  render();
});

// ── Init ──────────────────────────────────────────────────────────
render();
