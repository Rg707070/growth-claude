(() => {
  const S = window.GrowthSupabase
  const today = (() => {
    const d = new Date()
    const p = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  })()

  const DOMAIN_COLORS = {
    family: '#4F46E5', friends: '#0EA5E9', torah: '#0F766E', secular: '#059669',
    sports: '#65A30D', finance: '#0891B2', music: '#7C3AED',
  }
  const DOMAIN_ICONS = {
    family: '🏠', friends: '👥', torah: '📖', secular: '🎓',
    sports: '⚡', finance: '💰', music: '🎵',
  }

  // ── Build DOM shell ─────────────────────────────────────────────
  const toggle = document.createElement('button')
  toggle.id = 'growth-toggle'
  toggle.textContent = 'G'
  toggle.title = 'GROWTH'

  const sidebar = document.createElement('div')
  sidebar.id = 'growth-sidebar'
  document.body.appendChild(toggle)
  document.body.appendChild(sidebar)

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open')
    if (sidebar.classList.contains('open')) renderSidebar()
  })

  function el(tag, cls, html) {
    const e = document.createElement(tag)
    if (cls) e.className = cls
    if (html != null) e.innerHTML = html
    return e
  }

  async function renderSidebar() {
    sidebar.innerHTML = ''
    const header = el('div', 'growth-header')
    header.appendChild(el('h2', null, 'GROWTH'))
    const close = el('button', 'growth-close', '✕')
    close.addEventListener('click', () => sidebar.classList.remove('open'))
    header.appendChild(close)
    sidebar.appendChild(header)

    const session = await S.getSession()
    if (!session) {
      sidebar.appendChild(el('p', 'growth-need-login',
        'Not signed in. Click the GROWTH extension icon in the toolbar and sign in with your app email & password.'))
      return
    }
    const uid = session.user.id

    const [habits, doneLogs, famTasks, domTasks, night] = await Promise.all([
      S.query(session, `habits?user_id=eq.${uid}&is_active=eq.true&select=id,name,domain_slug&order=domain_slug`),
      S.query(session, `habit_logs?user_id=eq.${uid}&completed_at=eq.${today}&select=habit_id`),
      S.query(session, `family_tasks?user_id=eq.${uid}&status=eq.pending&urgency=in.(high,critical)&select=id,title`),
      S.query(session, `domain_tasks?user_id=eq.${uid}&status=eq.pending&urgency=in.(high,critical)&select=id,title,domain_slug`),
      S.query(session, `night_checkins?user_id=eq.${uid}&date=eq.${today}&select=id`),
    ])

    const doneSet = new Set((doneLogs || []).map((l) => l.habit_id))

    // ── Today's habits ──
    sidebar.appendChild(el('div', 'growth-section-title',
      `Today's habits — ${doneSet.size}/${(habits || []).length}`))
    if (!habits || habits.length === 0) {
      sidebar.appendChild(el('div', 'growth-empty', 'No active habits.'))
    } else {
      habits.forEach((h) => {
        const done = doneSet.has(h.id)
        const row = el('div', `growth-row${done ? ' done' : ''}`)
        const color = DOMAIN_COLORS[h.domain_slug] || '#22c3d6'
        const dot = el('span', 'dot', DOMAIN_ICONS[h.domain_slug] || '•')
        dot.style.background = color + '33'
        row.appendChild(dot)
        row.appendChild(el('span', 'label', h.name))
        const btn = el('button', null, done ? '✓' : 'Done')
        btn.addEventListener('click', async () => {
          if (done) return
          btn.textContent = '…'
          await completeHabit(session, uid, h.id)
          renderSidebar()
        })
        row.appendChild(btn)
        sidebar.appendChild(row)
      })
    }

    // ── Urgent tasks ──
    const urgent = [
      ...(famTasks || []).map((t) => ({ ...t, domain_slug: 'family' })),
      ...(domTasks || []),
    ]
    sidebar.appendChild(el('div', 'growth-section-title', 'Urgent tasks'))
    if (urgent.length === 0) {
      sidebar.appendChild(el('div', 'growth-empty', 'Nothing urgent. 🎉'))
    } else {
      urgent.forEach((t) => {
        const row = el('div', 'growth-row')
        const dot = el('span', 'dot', DOMAIN_ICONS[t.domain_slug] || '📋')
        dot.style.background = (DOMAIN_COLORS[t.domain_slug] || '#888') + '33'
        row.appendChild(dot)
        row.appendChild(el('span', 'label', t.title))
        sidebar.appendChild(row)
      })
    }

    // ── Night check-in ──
    sidebar.appendChild(el('div', 'growth-section-title', 'Night check-in'))
    const niRow = el('div', `growth-row${(night && night.length) ? ' done' : ''}`)
    niRow.appendChild(el('span', 'dot', '🌙'))
    niRow.appendChild(el('span', 'label',
      (night && night.length) ? 'Completed tonight' : 'Not done yet'))
    sidebar.appendChild(niRow)

    // ── Open app ──
    const link = el('a', 'growth-link', 'Open GROWTH →')
    link.href = S.cfg.APP_URL
    link.target = '_blank'
    sidebar.appendChild(link)
  }

  async function completeHabit(session, uid, habitId) {
    await fetch(`${S.cfg.SUPABASE_URL}/rest/v1/habit_logs`, {
      method: 'POST',
      headers: {
        apikey: S.cfg.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates',
      },
      body: JSON.stringify({ user_id: uid, habit_id: habitId, completed_at: today }),
    })
  }
})()
