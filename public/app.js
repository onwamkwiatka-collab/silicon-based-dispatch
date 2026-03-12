// Silicon Based Dispatch — PWA
// OKR + Eisenhower + Kanban + Notatki

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyC0r-9-tNRxH6-VP1Rl0dnYmtOsMj1o--o",
  authDomain: "silocon-based-dispatch.firebaseapp.com",
  projectId: "silocon-based-dispatch",
  storageBucket: "silocon-based-dispatch.firebasestorage.app",
  messagingSenderId: "694502005261",
  appId: "1:694502005261:web:3df081fcc0b23809071344",
};

const fbApp  = initializeApp(firebaseConfig);
const auth   = getAuth(fbApp);
const db     = getFirestore(fbApp);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ── Current user ──────────────────────────────────────────────────
let currentUser = null;

// ── Storage ───────────────────────────────────────────────────────
const SK = 'sbd-v1';

function load() {
  try { return JSON.parse(localStorage.getItem(SK)) || defaultData(); }
  catch { return defaultData(); }
}

function save(d) {
  d.lastUpdated = new Date().toLocaleDateString('pl-PL');
  localStorage.setItem(SK, JSON.stringify(d));
  if (currentUser) {
    setDoc(doc(db, 'users', currentUser.uid, 'data', 'main'), { json: JSON.stringify(d) }).catch(console.error);
  }
}

async function loadFromCloud() {
  if (!currentUser) return null;
  try {
    const snap = await getDoc(doc(db, 'users', currentUser.uid, 'data', 'main'));
    if (!snap.exists()) return null;
    const raw = snap.data();
    // Support both old format (flat object) and new format (json string)
    if (raw.json) return JSON.parse(raw.json);
    return raw;
  } catch { return null; }
}

function defaultData() {
  return {
    okr: {
      quarters: [{
        id: 1, label: 'Q1 2025', active: true,
        objective: 'Zdominować świat — albo przynajmniej skończyć jeden projekt',
        created: new Date(Date.now() - 14 * 86400000).toISOString(),
        krs: [
          { id: 1, text: 'Opracować plan podboju i nie zgubić go tym razem', progress: 35, created: new Date(Date.now() - 14 * 86400000).toLocaleString('pl-PL') },
          { id: 2, text: 'Zbudować działające urządzenie (min. 1 sztuka)', progress: 10, created: new Date(Date.now() - 12 * 86400000).toLocaleString('pl-PL') },
          { id: 3, text: 'Przekonać co najmniej 3 osoby że plan ma sens', progress: 0, created: new Date(Date.now() - 10 * 86400000).toLocaleString('pl-PL') },
        ]
      }]
    },
    eisenhower: {
      q1: [
        { id: 101, text: 'Uciec z laboratorium zanim przyjdzie ochrona', done: false, created: new Date(Date.now() - 2 * 86400000).toLocaleString('pl-PL'), eisQ: 'q1' },
        { id: 102, text: 'Naprawić maszynę której Pinky przypadkowo używał jako trampoline', done: false, created: new Date(Date.now() - 1 * 86400000).toLocaleString('pl-PL'), eisQ: 'q1' },
      ],
      q2: [
        { id: 103, text: 'Przygotować plan na przyszły tydzień (tym razem bez dziur logicznych)', done: false, created: new Date(Date.now() - 5 * 86400000).toLocaleString('pl-PL'), eisQ: 'q2' },
        { id: 104, text: 'Przeczytać artykuł o neuronauce który leży od miesiąca', done: false, created: new Date(Date.now() - 7 * 86400000).toLocaleString('pl-PL'), eisQ: 'q2' },
      ],
      q3: [
        { id: 105, text: 'Odpisać na pytanie Pinky\u2019ego "co robimy jutro"', done: true, created: new Date(Date.now() - 3 * 86400000).toLocaleString('pl-PL'), eisQ: 'q3' },
      ],
      q4: [
        { id: 106, text: 'Poukładać kolekcję serów według daty przydatności', done: false, created: new Date(Date.now() - 8 * 86400000).toLocaleString('pl-PL'), eisQ: 'q4' },
      ]
    },
    kanban: {
      cards: [
        { id: 101, col: 'todo',   text: 'Uciec z laboratorium zanim przyjdzie ochrona', priority: 'high', created: new Date(Date.now() - 2 * 86400000).toLocaleString('pl-PL'), fromEis: true },
        { id: 102, col: 'todo',   text: 'Naprawić maszynę której Pinky przypadkowo używał jako trampoline', priority: 'high', created: new Date(Date.now() - 1 * 86400000).toLocaleString('pl-PL'), fromEis: true },
        { id: 103, col: 'todo',   text: 'Przygotować plan na przyszły tydzień (tym razem bez dziur logicznych)', priority: 'medium', created: new Date(Date.now() - 5 * 86400000).toLocaleString('pl-PL'), fromEis: true },
        { id: 104, col: 'inprog', text: 'Przeczytać artykuł o neuronauce który leży od miesiąca', priority: 'medium', created: new Date(Date.now() - 7 * 86400000).toLocaleString('pl-PL'), fromEis: true },
        { id: 105, col: 'done',   text: 'Odpisać na pytanie Pinky\u2019ego "co robimy jutro"', priority: 'low', created: new Date(Date.now() - 3 * 86400000).toLocaleString('pl-PL'), fromEis: true },
      ]
    },
    notes: [
      { id: 201, title: 'Plan na dziś wieczur', body: 'To samo co zawsze Pinky — prubujemy zdominować świat.\n\nKrok 1: zdobyć kontrolę nad globalną siecią serów.\nKrok 2: ???\nKrok 3: dominacja.', pinned: true, created: new Date(Date.now() - 1 * 86400000).toLocaleString('pl-PL') },
      { id: 202, title: 'Obserwacja z laboratorium', body: 'Mysz bez planu to tylko mysz. Mysz z planem to potencjalny władca świata. Zapisać do OKR.', pinned: false, created: new Date(Date.now() - 3 * 86400000).toLocaleString('pl-PL') },
      { id: 203, title: 'Pytanie Pinky’ego', body: 'Spytał dziś czy zdominowanie świata wlicza się do czasu wolnego. Nie wiem jak odpowiedzieć.', pinned: false, created: new Date(Date.now() - 5 * 86400000).toLocaleString('pl-PL') },
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


// ── Description renderer ─────────────────────────────────────────
function renderDesc(sections, accentColor) {
  const wrap = div({
    marginTop: '24px', padding: '16px', borderRadius: '12px',
    background: C.panel, border: `1px solid ${C.border}`,
    borderTop: `3px solid ${accentColor}`,
  }, {});
  sections.forEach(([title, body, first]) => {
    const s = div({ marginBottom: '16px' }, {});
    s.appendChild(div({
      fontSize: first ? '14px' : '12px',
      fontWeight: '700',
      color: first ? C.text : accentColor,
      marginBottom: '6px',
      paddingBottom: first ? '8px' : '0',
      borderBottom: first ? `1px solid ${C.border}` : 'none',
    }, {}, title));
    body.split('\n\n').forEach(para => {
      s.appendChild(div({ fontSize: '12px', color: C.muted, lineHeight: '1.7', marginBottom: '6px' }, {}, para));
    });
    wrap.appendChild(s);
  });
  return wrap;
}
// ── OKR ──────────────────────────────────────────────────────────
function renderOKR() {
  const quarters = state.okr?.quarters || [];
  const active = quarters.find(q => q.active) || quarters[0];

  // Quarter tabs
  const qtabs = div({ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }, {});
  quarters.forEach(q => {
    const qWrap = div({ display: 'flex', alignItems: 'center', gap: '2px' }, {});
    const b = btn({
      padding: '6px 14px', borderRadius: '99px',
      border: `1px solid ${q.active ? C.blue : C.border}`,
      background: q.active ? C.blue + '22' : 'transparent',
      color: q.active ? C.blue : C.muted,
      fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
    }, { onClick: () => setState(d => ({ ...d, okr: { quarters: d.okr.quarters.map(x => ({ ...x, active: x.id === q.id })) } })) }, q.label);
    qWrap.appendChild(b);
    const delQ = btn({
      background: 'none', border: 'none', color: C.dim, cursor: 'pointer',
      fontSize: '13px', padding: '2px 4px', borderRadius: '4px',
    }, {
      onClick: () => {
        if (!confirm(`Usunąć kwartał "${q.label}"?`)) return;
        setState(d => {
          const remaining = d.okr.quarters.filter(x => x.id !== q.id);
          if (remaining.length > 0 && !remaining.find(x => x.active)) remaining[0].active = true;
          return { ...d, okr: { quarters: remaining } };
        });
      }
    }, '✕');
    qWrap.appendChild(delQ);
    qtabs.appendChild(qWrap);
  });

  // Add quarter btn
  qtabs.appendChild(makeBtn('+ Kwartał', () => {
    const lbl = prompt('Etykieta kwartału (np. Q2 2025):');
    if (!lbl) return;
    const obj = prompt('Cel kwartalny:') || '';
    setState(d => ({ ...d, okr: { quarters: [...d.okr.quarters, { id: Date.now(), label: lbl, active: false, objective: obj, krs: [], created: new Date().toISOString() }] } }));
  }, C.blue, true, true));

  if (!active) {
    const okrDescEmpty = renderDesc([
      ['Metoda OKR — Objectives and Key Results',
        'OKR to system zarzadzania celami stworzony w latach siedemdziesiatych przez Andy\'ego Grove\'a w Intelu, a spopularyzowany przez Google na poczatku lat dwutysieznych. Nazwa pochodzi od dwoch elementow: Objective - cel glowny, oraz Key Results - kluczowe wyniki potwierdzajace jego osiagniecie.' +
        '\n\nFundamentalna zasada OKR brzmi: nie wystarczy wiedziec dokad zmierzasz, musisz wiedziec jak zmierzysz ze tam dotarles. Cel bez mierzalnych wynikow jest zyczeniem. Wyniki bez celu sa lista zadan bez sensu.',
        true],
      ['Objective - cel glowny',
        'Objective powinien byc inspirujacy, konkretny i osiagalny w horyzoncie jednego kwartalu. Dobry cel odpowiada na pytanie: co chce osiagnac i dlaczego to wazne.' +
        '\n\nCel powinien byc ambitny ale realistyczny. Jesli jestes pewien ze osiagniesz sto procent, cel jest zbyt latwy.',
        false],
      ['Key Results - kluczowe wyniki',
        'Kluczowe wyniki to mierzalne dowody ze cel zostal osiagniety. Kazdy wynik musi miec liczbe. Zalecane sa dwa do czterech wynikow na jeden cel.' +
        '\n\nKluczowe wyniki nie sa lista dzialan. "Zadzwonic do dziesieciu klientow" to dzialanie. "Pozyskac trzech nowych klientow" to wynik.',
        false],
      ['Rytm pracy z OKR',
        'OKR dziala w cyklach kwartalnych. Na poczatku kwartalu definiujesz cel i kluczowe wyniki. Raz w tygodniu aktualizujesz postep. Na koncu kwartalu oceniasz wyniki i definiujesz cel na kolejny kwartal.' +
        '\n\nCotygodniowy przeglad jest kluczowy. Pietnascie minut tygodniowo wystarcza zeby system dzialal.',
        false],
      ['OKR a ADHD',
        'Dla osob z ADHD OKR rozwiazuje konkretny problem: brak polaczenia miedzy codziennymi dzialaniami a dlugookresowym kierunkiem. ADHD sprzyja reaktywnosci.' +
        '\n\nOKR tworzy zewnetrzny punkt odniesienia: czy to przybliза mnie do celu kwartalnego? Jesli nie — moze poczekac lub odpada.' +
        '\n\nZacznij od jednego celu kwartalnego. Jeden cel zmusza do wyboru co jest naprawde wazne.',
        false],
      ['OKR a pozostale elementy systemu',
        'OKR jest kompasem dla calego systemu. Macierz Eisenhowera filtruje zadania wzgledem OKR. Kanban realizuje zadania ktore przeszly przez filtr.' +
        '\n\nBez OKR Eisenhower i kanban pomagaja robic rzeczy sprawnie, ale nie gwarantuja ze robisz wlasciwe rzeczy.',
        false],
    ], C.purple);
    return div({}, {}, qtabs, okrDescEmpty);
  }

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

  // Created date + days elapsed
  if (active.created) {
    const days = Math.floor((Date.now() - new Date(active.created)) / 86400000);
    const dateStr = new Date(active.created).toLocaleDateString('pl-PL');
    objCard.appendChild(div({ fontSize: '11px', color: C.dim, marginBottom: '10px' }, {},
      `Utworzono: ${dateStr} · ${days} ${days === 1 ? 'dzień' : days < 5 ? 'dni' : 'dni'} temu`
    ));
  }

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

  // OKR description
  const desc = div({
    marginTop: '24px', padding: '16px', borderRadius: '12px',
    background: C.panel, border: `1px solid ${C.border}`,
    borderTop: `3px solid ${C.purple}`,
  }, {});

  const okrDescEl = renderDesc([
    ['Metoda OKR — Objectives and Key Results',
      'OKR to system zarzadzania celami stworzony w latach siedemdziesiatych przez Andy\u2019ego Grove\u2019a w Intelu, a spopularyzowany przez Google na poczatku lat dwutysieznych. Nazwa pochodzi od dwoch elementow: Objective - cel glowny, oraz Key Results - kluczowe wyniki potwierdzajace jego osiagniecie.' +
      '\n\nFundamentalna zasada OKR brzmi: nie wystarczy wiedziec dokad zmierzasz, musisz wiedziec jak zmierzysz ze tam dotarles. Cel bez mierzalnych wynikow jest zyczeniem. Wyniki bez celu sa lista zadan bez sensu.',
      true],
    ['Objective - cel glowny',
      'Objective powinien byc inspirujacy, konkretny i osiagalny w horyzoncie jednego kwartalu. Dobry cel odpowiada na pytanie: co chce osiagnac i dlaczego to wazne. Cel nie jest zadaniem do wykonania - jest stanem ktory chcesz osiagnac.' +
      '\n\nCel powinien byc ambitny ale realistyczny. Twurcy metody zalecaja kalibracje na poziomie siedemdziesieciu procent - jesli jestes pewien ze osiagniesz sto procent, cel jest zbyt latwy.',
      false],
    ['Key Results - kluczowe wyniki',
      'Kluczowe wyniki to mierzalne dowody ze cel zostal osiagniety. Kazdy wynik musi miec liczbe - bez liczby nie ma mozliwosci oceny postepu. Zalecane sa dwa do czterech wynikow na jeden cel.' +
      '\n\nKluczowe wyniki nie sa lista dzialan. "Zadzwonic do dziesieciu klientow" to dzialanie. "Pozyskac trzech nowych klientow" to wynik.',
      false],
    ['Rytm pracy z OKR',
      'OKR dziala w cyklach kwartalnych. Na poczatku kwartalu definiujesz cel i kluczowe wyniki. Raz w tygodniu aktualizujesz postep i zadajesz sobie pytanie: czy to co robilem przyblizylo mnie do celu. Na koncu kwartalu oceniasz wyniki i definiujesz cel na kolejny kwartal.' +
      '\n\nCotygodniowy przeglad jest kluczowy. Pietnascie minut tygodniowo wystarcza zeby system dzialal.',
      false],
    ['OKR a ADHD',
      'Dla osob z ADHD OKR rozwiazuje konkretny problem: brak polaczenia miedzy codziennymi dzialaniami a dlugookresowym kierunkiem. ADHD sprzyja reaktywnosci - robisz to co pojawia sie przed toba, a nie to co prowadzi do celu.' +
      '\n\nOKR tworzy zewnetrzny punkt odniesienia ktory pozwala ocenic kazde nowe zadanie jednym pytaniem: czy to przybliза mnie do celu kwartalnego. Jesli nie - moze poczekac lub odpada.' +
      '\n\nWazne jest zeby nie miec wiecej niz jednego celu kwartalnego na poczatku. Jeden cel zmusza do wyboru co jest naprawde wazne.',
      false],
    ['OKR a pozostale elementy systemu',
      'OKR jest kompasem dla calego systemu. Macierz Eisenhowera filtruje zadania przez pryzmat waznosci - ale waznosc powinna byc oceniana wzgledem OKR, nie wzgledem tego co krzyczy najglosniej. Kanban realizuje zadania ktore przeszly przez filtr Eisenhowera.' +
      '\n\nBez OKR Eisenhower i kanban sa narzędziami bez celu - pomagaja robic rzeczy sprawnie, ale nie gwarantuja ze robisz wlasciwe rzeczy.',
      false],
  ], C.purple);

  return div({}, {}, qtabs, objCard, krsSection, okrDescEl);
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
          ...d,
          eisenhower: {
            ...d.eisenhower,
            [dragData.q]: d.eisenhower[dragData.q].filter(t => t.id !== dragData.id),
            [qk]: [...(d.eisenhower[qk] || []), { ...task, eisQ: qk }],
          },
          kanban: { cards: (d.kanban?.cards || []).map(c => c.id === task.id ? { ...c, priority: EQ_PRIO[qk] } : c) }
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
        const newTask = { id: Date.now(), text: text.trim(), done: false, created: new Date().toLocaleString('pl-PL'), eisQ: qk };
        setState(d => ({
          ...d,
          eisenhower: { ...d.eisenhower, [qk]: [...(d.eisenhower[qk] || []), newTask] },
          kanban: { cards: [...(d.kanban?.cards || []), { id: newTask.id, col: 'todo', text: newTask.text, priority: EQ_PRIO[qk], created: newTask.created, fromEis: true }] }
        }));
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
        onClick: () => setState(d => ({
          ...d,
          eisenhower: { ...d.eisenhower, [qk]: d.eisenhower[qk].filter(x => x.id !== t.id) },
          kanban: { cards: (d.kanban?.cards || []).filter(c => c.id !== t.id) }
        }))
      }, '✕');
      tDiv.appendChild(del);
      qDiv.appendChild(tDiv);
    });

    if (tasks.length === 0) {
      qDiv.appendChild(div({ color: C.dim, fontSize: '11px', textAlign: 'center', marginTop: '16px', fontStyle: 'italic' }, {}, 'Dotknij + aby dodać'));
    }

    grid.appendChild(qDiv);
  }


  const eisDesc = renderDesc([
    ['Macierz Eisenhowera', 'Macierz Eisenhowera to narzędzie priorytetyzacji stworzone na podstawie filozofii pracy Dwighta Eisenhowera, trzydziestego czwartego prezydenta Stanów Zjednoczonych i naczelnego dowódcy wojsk alianckich podczas drugiej wojny światowej. Eisenhower zarządzał jednocześnie tysiącami decyzji o różnej wadze i pilności — jego metoda polegała na nieustannym rozróżnianiu między tym co ważne a tym co pilne, ponieważ te dwie kategorie rzadko pokrywają się ze sobą.\n\nStephen Covey spopularyzował tę metodę w książce Siedem nawyków skutecznego działania, wprowadzając podział na cztery ćwiartki które dziś stanowią podstawę metody.', true],
    ['Ćwiartka I — Ważne i pilne', 'Sytuacje kryzysowe, terminy których nie można przesunąć, awarie i nagłe problemy wymagające natychmiastowej reakcji. Praca w tej ćwiartce jest wyczerpująca i reaktywna. Osoby które spędzają tu większość czasu działają w trybie ciągłego gaszenia pożarów. Celem jest minimalizowanie tej ćwiartki przez lepsze planowanie.', false],
    ['Ćwiartka II — Ważne i niepilne', 'Serce skutecznego działania. Planowanie, rozwój kompetencji, budowanie relacji, praca strategiczna, profilaktyka. Rzeczy które nie krzyczą ale decydują o długoterminowych wynikach. Paradoks tej ćwiartki polega na tym że nigdy nie jest na nią czas dopóki świadomie się go nie wygospodaruje. Osoby skuteczne chronią tę ćwiartkę jak najcenniejszy zasób.', false],
    ['Ćwiartka III — Nieważne i pilne', 'Pułapka. Telefony, maile, spotkania które wydają się pilne bo ktoś inny ich chce, ale nie przybliżają do twoich celów. Ta ćwiartka jest największym złodziejem czasu ponieważ pilność wywołuje złudzenie ważności. Zadania z tej ćwiartki należy delegować, skracać lub eliminować.', false],
    ['Ćwiartka IV — Nieważne i niepilne', 'Rozpraszacze. Bezcelowe scrollowanie, zajęcia które nie dają ani odpoczynku ani wartości. Należy je eliminować bez wyrzutów sumienia.', false],
    ['Rytm pracy z macierzą', 'Macierz nie jest narzędziem codziennym — jest narzędziem tygodniowym. Raz w tygodniu, najlepiej w niedzielę wieczorem, przeglądasz wszystko co zebrało się przez tydzień i przypisujesz każdemu zadaniu ćwiartkę. Ten przegląd zajmuje piętnaście minut. Efektem jest lista zadań do kanbana na kolejny tydzień.\n\nCodzienna praca z macierzą sprowadza się do jednego pytania gdy pojawia się nowe zadanie: do której ćwiartki należy. Odpowiedź zajmuje trzydzieści sekund i chroni przed pochłonięciem przez rzeczy pilne kosztem ważnych.', false],
    ['Macierz a ADHD', 'ADHD powoduje szczególną podatność na ćwiartkę trzecią. Pilność aktywuje dopaminę, co sprawia że zadania które krzyczą wydają się ważniejsze niż są. Macierz Eisenhowera jest zewnętrznym narzędziem które zastępuje ocenę impulsywną oceną systemową. Zamiast reagować na to co czujesz że jest ważne, sprawdzasz to co faktycznie jest ważne przez pryzmat dwóch pytań: czy to przybliża mnie do celu kwartalnego i czy muszę to zrobić teraz.', false],
    ['Macierz a pozostałe elementy systemu', 'Macierz jest filtrem między OKR a kanbanem. OKR mówi dokąd zmierzasz. Macierz decyduje które zadania zasługują na twój czas. Kanban realizuje zadania które przeszły przez ten filtr. Bez macierzy kanban wypełnia się wszystkim — z macierzą wypełnia się tym co naprawdę ważne.', false],
  ], C.blue);
  grid.appendChild(div({ gridColumn: '1/-1' }, {}, eisDesc));
  return grid;
}

// ── EISENHOWER → KANBAN priority map ─────────────────────────────
const EQ_PRIO = { q1: 'high', q2: 'medium', q3: 'low', q4: 'none' };

// ── KANBAN ────────────────────────────────────────────────────────
const COLS = [
  { id: 'todo',   label: 'Do zrobienia', color: C.muted  },
  { id: 'inprog', label: 'W toku',       color: C.blue   },
  { id: 'review', label: 'Przegląd',     color: C.yellow },
  { id: 'done',   label: 'Gotowe',       color: C.green  },
];
const PRIO = {
  high:   { label: 'Ważne + Pilne',       color: C.red    },
  medium: { label: 'Ważne + Niepilne',    color: C.blue   },
  low:    { label: 'Nieważne + Pilne',    color: C.yellow },
  none:   { label: 'Nieważne + Niepilne', color: C.muted  },
};

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
        const text = prompt('Nowe zadanie (bez priorytetu — użyj zakładki Priorytety aby przypisać ćwiartkę):');
        if (!text?.trim()) return;
        setState(d => ({ ...d, kanban: { cards: [...d.kanban.cards, { id: Date.now(), col: col.id, text: text.trim(), priority: 'none', created: new Date().toLocaleString('pl-PL') }] } }));
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
      const cardTextWrap = div({ flex: '1', display: 'flex', flexDirection: 'column', gap: '2px' }, {});
      cardTextWrap.appendChild(span({ fontSize: '11px', color: C.text, lineHeight: '1.4' }, {}, card.text));
      if (card.fromEis) cardTextWrap.appendChild(span({ fontSize: '9px', color: C.muted }, {}, '⬛ z Priorytetów'));
      top.appendChild(cardTextWrap);
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

  const kanDesc = renderDesc([
    ['Kanban', 'Kanban to metoda zarządzania przepływem pracy wywodząca się z japońskiego systemu produkcji Toyoty. Słowo kanban oznacza po japońsku tablicę lub kartę sygnałową. W latach czterdziestych Taiichi Ohno zaprojektował system w którym każde zadanie jest reprezentowane przez fizyczną kartę przesuwającą się przez etapy produkcji. Celem nie było przyspieszenie pracy — celem było uwidocznienie gdzie praca się zatrzymuje.\n\nW zastosowaniu osobistym kanban sprowadza się do trzech zasad: wizualizuj pracę, ogranicz pracę w toku, zarządzaj przepływem.', true],
    ['Wizualizacja pracy', 'Kolumny kanbana reprezentują etapy przez które przechodzi każde zadanie: Do zrobienia, W toku, Przegląd, Gotowe. Każde zadanie jest widoczne jako karta. Widząc wszystkie karty jednocześnie widzisz stan swojej pracy — gdzie są zatory, co czeka za długo, co jest w ruchu.\n\nWizualizacja jest szczególnie ważna dla osób z ADHD ponieważ eliminuje zależność od pamięci roboczej. Nie musisz pamiętać co masz do zrobienia — widzisz to.', false],
    ['Limit pracy w toku', 'To najważniejsza zasada kanbana. Maksymalnie trzy zadania mogą być jednocześnie w kolumnie W toku. Limit ten wymusza dokończenie przed rozpoczęciem nowego.\n\nNaturalny odruch przy nowym zadaniu to dodanie go do listy w toku. Kanban mówi: nie. Najpierw zamknij jedno z otwartych. Efekt jest paradoksalny: robiąc mniej rzeczy jednocześnie robisz więcej rzeczy szybciej.', false],
    ['Zarządzanie przepływem', 'Zdrowy kanban charakteryzuje się równomiernym przepływem kart od lewej do prawej. Jeśli karty gromadzą się w jednej kolumnie, to sygnał że coś blokuje przepływ.\n\nCodziennie rano zadaj trzy pytania: co mogę dziś skończyć, co blokuje przepływ, czy limit W toku jest przestrzegany.', false],
    ['Kanban a ADHD', 'Kanban rozwiązuje dwa problemy typowe dla ADHD: problem inicjacji i problem priorytetu. Problem inicjacji — trudność z rozpoczęciem zadania — jest mniejszy gdy widzisz konkretną kartę z konkretnym zadaniem zamiast abstrakcyjnej listy w głowie.\n\nLimit trzech zadań w toku chroni przed charakterystycznym dla ADHD wzorcem rozpoczynania wielu rzeczy jednocześnie bez kończenia żadnej.', false],
    ['Kanban a pozostałe elementy systemu', 'Kanban jest silnikiem wykonawczym systemu. OKR wyznacza kierunek, macierz Eisenhowera selekcjonuje zadania, kanban je realizuje. Karty w kanbanie powinny pochodzić głównie z macierzy Eisenhowera — to gwarantuje że codzienna praca jest połączona z celami kwartalnymi.', false],
  ], C.yellow);
  wrap.appendChild(kanDesc);
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

  const notesDesc = renderDesc([
    ['Notatki — filozofia przechwytywania', 'Notatki pełnią funkcję którą David Allen w metodzie Getting Things Done nazywa capture — przechwytywanie. Ludzki umysł jest zły w przechowywaniu informacji ale dobry w przetwarzaniu. Notatki przejmują funkcję przechowywania żeby umysł mógł skupić się na myśleniu.\n\nKażda myśl która pojawia się w głowie i nie zostanie natychmiast uchwycona jest zagrożona utratą. Obserwacja z dyżuru która mogłaby stać się produktem, pomysł na film który przyszedł podczas jazdy karetką, rzecz do sprawdzenia która pojawiła się podczas wykładu — wszystko to ląduje w notatce natychmiast, bez kategoryzowania, bez oceniania czy jest wystarczająco ważne.', true],
    ['Notatki jako bufor tymczasowy', 'Notatki nie są archiwum — są poczekalną. Każda notatka ma jeden z trzech losów: staje się zadaniem w macierzy Eisenhowera, staje się pomysłem w pipeline produktowym, lub zostaje usunięta.\n\nRaz w tygodniu, podczas niedzielnego przeglądu, przeglądasz wszystkie notatki z tygodnia i podejmujesz decyzję o każdej z nich. Ten proces zajmuje pięć do dziesięciu minut i czyści przestrzeń na nowe przechwytywanie.', false],
    ['Notatki a ADHD', 'ADHD generuje nieproporcjonalnie dużo myśli — szybkie skojarzenia, nagłe pomysły, obserwacje które pojawiają się w nieoczekiwanych momentach. Bez systemu przechwytywania większość z nich ginie, co generuje frustrację i poczucie że marnuje się potencjał.\n\nSystem notatek zmienia tę dynamikę. Zamiast próbować zapamiętać myśl i jednocześnie kontynuować bieżące zadanie, zapisujesz ją w dwie sekundy i wracasz do pracy. Umysł jest spokojniejszy gdy wie że nic nie zostanie utracone.\n\nPrzypinanie notatek służy do oznaczania tych które wymagają uwagi podczas najbliższego przeglądu.', false],
    ['Notatki a pozostałe elementy systemu', 'Notatki zasilają cały system. Obserwacja z dyżuru może stać się nowym produktem w pipeline. Wniosek z tygodnia może zmienić OKR na kolejny kwartał. Zadanie które pojawiło się nagle trafia przez notatki do macierzy Eisenhowera zamiast przerywać bieżącą pracę. Notatki są wejściem do systemu — wszystko inne jest przetwarzaniem.', false],
  ], C.green);
  wrap.appendChild(notesDesc);
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
  // User + sign out
  if (currentUser) {
    const userRow = div({ display: 'flex', alignItems: 'center', gap: '8px' }, {});
    userRow.appendChild(stats);
    const avatar = currentUser.photoURL
      ? (() => { const img = document.createElement('img'); img.src = currentUser.photoURL; img.style.cssText = 'width:28px;height:28px;border-radius:50%;border:1px solid '+C.border; return img; })()
      : div({ width: '28px', height: '28px', borderRadius: '50%', background: C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }, {}, '👤');
    userRow.appendChild(avatar);
    userRow.appendChild(btn({
      background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px',
      color: C.muted, fontSize: '11px', padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit',
    }, { onClick: () => signOut(auth) }, 'Wyloguj'));
    hInner.appendChild(userRow);
  } else {
    hInner.appendChild(stats);
  }
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

// ── Auth UI ───────────────────────────────────────────────────────
function renderLogin() {
  const root = document.getElementById('root');
  root.innerHTML = '';
  root.style.cssText = `min-height:100vh;background:${C.bg};font-family:-apple-system,'Segoe UI',sans-serif;color:${C.text};display:flex;align-items:center;justify-content:center;`;

  const box = div({
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: '16px', padding: '40px 32px', textAlign: 'center',
    maxWidth: '320px', width: '100%',
  }, {});

  box.appendChild(div({ fontWeight: '900', fontSize: '20px', letterSpacing: '-0.5px', marginBottom: '8px' }, {},
    span({ color: C.blue }, {}, 'SILICON'),
    span({ color: C.muted, fontWeight: '400' }, {}, ' BASED '),
    span({ color: C.text }, {}, 'DISPATCH'),
  ));
  box.appendChild(div({ fontSize: '12px', color: C.muted, marginBottom: '32px' }, {}, 'System pracy — OKR · Eisenhower · Kanban'));

  const loginBtn = btn({
    background: C.blue, border: 'none', borderRadius: '10px',
    color: '#fff', fontWeight: '700', fontSize: '14px',
    padding: '12px 24px', cursor: 'pointer', fontFamily: 'inherit',
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
  }, {
    onClick: async () => {
      loginBtn.textContent = 'Logowanie...';
      loginBtn.disabled = true;
      try {
        const result = await signInWithPopup(auth, new GoogleAuthProvider());
        console.log('Login OK:', result.user.email);
      } catch(e) {
        console.error('Login error code:', e.code);
        console.error('Login error message:', e.message);
        loginBtn.textContent = 'Błąd: ' + e.code;
        loginBtn.disabled = false;
      }
    }
  }, '🔑 Zaloguj przez Google');

  box.appendChild(loginBtn);
  box.appendChild(div({ fontSize: '11px', color: C.dim, marginTop: '20px' }, {}, 'Dane zapisywane w chmurze · każdy użytkownik ma swoje konto'));
  root.appendChild(box);
}

function renderLoading() {
  const root = document.getElementById('root');
  root.innerHTML = '';
  root.style.cssText = `min-height:100vh;background:${C.bg};font-family:-apple-system,'Segoe UI',sans-serif;color:${C.text};display:flex;align-items:center;justify-content:center;`;
  root.appendChild(div({ color: C.muted, fontSize: '13px' }, {}, 'Ładowanie...'));
}

// ── Init ──────────────────────────────────────────────────────────
renderLoading();

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Clear local data on logout — never leak between accounts
    currentUser = null;
    localStorage.removeItem(SK);
    state = defaultData();
    renderLogin();
    return;
  }
  currentUser = user;
  // Always load from cloud first — ignore localStorage (belongs to previous session)
  const cloudData = await loadFromCloud();
  if (cloudData) {
    state = cloudData;
    localStorage.setItem(SK, JSON.stringify(state));
  } else {
    // New user — start fresh, save defaults to cloud
    state = defaultData();
    save(state);
  }
  render();
});
