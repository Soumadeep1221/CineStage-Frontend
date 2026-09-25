'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft, CalendarDays, Check, ChevronDown, Clapperboard,
  Film, LayoutDashboard, MapPin, Pencil, Plus, RefreshCw,
  Search, Ticket, Trash2, Users, X
} from 'lucide-react'

// ─── Admin custom select dropdown ────────────────────────────────
function AdminSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  style,
}: {
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
  placeholder?: string
  style?: React.CSSProperties
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          width: '100%',
          height: 40,
          padding: '0 12px',
          borderRadius: 8,
          border: open
            ? '1px solid rgba(124,58,237,0.6)'
            : '1px solid rgba(255,255,255,0.1)',
          background: open
            ? 'rgba(124,58,237,0.08)'
            : 'rgba(255,255,255,0.05)',
          color: selected ? '#e8ecf4' : '#4a5568',
          fontSize: 14,
          fontWeight: selected ? 500 : 400,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'border-color 0.15s, background 0.15s',
          boxShadow: open ? '0 0 0 3px rgba(124,58,237,0.15)' : 'none',
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: '#4a5568',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 50,
            maxHeight: 240,
            overflowY: 'auto',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: '#1a1f2b',
            boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
            padding: '4px',
            animation: 'adropIn 0.14s ease',
          }}
        >
          {options.map(o => {
            const isActive = o.value === value
            return (
              <button
                key={o.value}
                role="option"
                aria-selected={isActive}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 7,
                  border: 'none',
                  background: isActive ? 'rgba(124,58,237,0.18)' : 'transparent',
                  color: isActive ? '#c4b5fd' : '#a0aec0',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 400,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.1s, color 0.1s',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#e8ecf4'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#a0aec0'
                  }
                }}
              >
                {isActive && <Check size={12} style={{ flexShrink: 0, color: '#7c3aed' }} />}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {o.label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────
type City     = { id: number; name: string; state?: string }
type Theatre  = { id: number; name: string; address?: string; city?: City }
type Screen   = { id: number; name?: string; totalSeats?: number; theatre?: Theatre }
type Movie    = { id: number; title?: string; description?: string; genre?: string; language?: string; durationMinutes?: number; rating?: number; releaseDate?: string; posterUrl?: string }
type TimeObj  = { hour: number; minute: number; second: number; nano: number } | string
type Show     = { id: number; movie?: Movie; screen?: Screen; showDate?: string; startTime?: TimeObj; endTime?: TimeObj; ticketPrice?: number }
type Seat     = { id: number; seatNumber?: string; row?: string; column?: number; seatType?: string; screen?: Screen }
type BookUser = { id: number; name?: string; email?: string; phoneNumber?: string; createdAt?: string }
type Booking  = { id: number; user?: BookUser; show?: Show; totalPrice?: number; status?: string; bookedAt?: string }

type Tab = 'Overview' | 'Movies' | 'Cities' | 'Theatres' | 'Screens' | 'Seats' | 'Shows' | 'Bookings' | 'Users'

// ─── API ──────────────────────────────────────────────────────────
function apiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '')
}
function apiUrl(path: string) {
  return `${apiBase()}${path.startsWith('/api') ? path : `/api${path}`}`
}
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const text = await res.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    const msg =
      data && typeof data === 'object' && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : `Request failed (${res.status})`
    throw new Error(msg)
  }
  return data as T
}

function fmtTime(t?: TimeObj | string | null) {
  if (!t) return '—'
  if (typeof t === 'string') {
    const parts = t.split(':')
    const h = parseInt(parts[0], 10)
    const m = parseInt(parts[1] ?? '0', 10)
    if (isNaN(h) || isNaN(m)) return '—'
    return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  const h = t.hour, m = t.minute
  if (h === undefined || h === null || m === undefined || m === null) return '—'
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatTime(time?: { hour: number; minute: number; second?: number } | null) {
  if (!time) return null
  return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}:${String(time.second ?? 0).padStart(2, '0')}`
}

// ─── Admin Panel Root ─────────────────────────────────────────────
export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const [tab,      setTab]      = useState<Tab>('Overview')
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2600)
  }

  const tabs: Tab[] = ['Overview', 'Movies', 'Cities', 'Theatres', 'Screens', 'Seats', 'Shows', 'Bookings', 'Users']

  const tabIcon: Record<Tab, ReactNode> = {
    Overview: <LayoutDashboard size={16} />,
    Movies:   <Film           size={16} />,
    Cities:   <MapPin         size={16} />,
    Theatres: <MapPin         size={16} />,
    Screens:  <CalendarDays   size={16} />,
    Seats:    <Ticket         size={16} />,
    Shows:    <CalendarDays   size={16} />,
    Bookings: <Ticket         size={16} />,
    Users:    <Users          size={16} />,
  }

  return (
    <div className="admin-shell">
      {/* Header */}
      <header className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            display: 'grid', placeItems: 'center',
            width: 36, height: 36, borderRadius: 10,
            background: '#7c3aed', color: '#fff',
          }}>
            <Clapperboard size={18} />
          </span>
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
              Cine<span style={{ color: '#7c3aed' }}>Stage</span>
            </p>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4a5568', margin: 0 }}>
              Admin Console
            </p>
          </div>
        </div>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#8494b0', fontSize: 14, fontWeight: 500,
            background: 'transparent',
          }}
        >
          <ArrowLeft size={15} /> Exit Console
        </button>
      </header>

      {/* Mobile tab strip */}
      {isMobile && (
        <div style={{
          display: 'flex', overflowX: 'auto', gap: 4,
          padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          scrollbarWidth: 'none',
        }}>
          {tabs.map(t => (
            <button
              key={t}
              className={`admin-nav-item${tab === t ? ' active' : ''}`}
              style={{ flexShrink: 0 }}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="admin-layout">
        {/* Sidebar */}
        {!isMobile && (
          <aside className="admin-sidebar">
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#2d3748', padding: '0 12px', marginBottom: 8 }}>
              Backstage
            </p>
            <nav style={{ display: 'grid', gap: 2 }}>
              {tabs.map(t => (
                <button
                  key={t}
                  className={`admin-nav-item${tab === t ? ' active' : ''}`}
                  onClick={() => setTab(t)}
                >
                  {tabIcon[t]} {t}
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Main content */}
        <main className="admin-main">
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: 6 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.05em' }}>{tab}</h1>
          </div>

          {tab === 'Overview' && <OverviewTab notify={notify} />}
          {tab === 'Movies'   && <MoviesTab   notify={notify} />}
          {tab === 'Cities'   && <CitiesTab   notify={notify} />}
          {tab === 'Theatres' && <TheatresTab notify={notify} />}
          {tab === 'Screens'  && <ScreensTab  notify={notify} />}
          {tab === 'Seats'    && <SeatsTab    notify={notify} />}
          {tab === 'Shows'    && <ShowsTab    notify={notify} />}
          {tab === 'Bookings' && <BookingsTab notify={notify} />}
          {tab === 'Users'    && <UsersTab    notify={notify} />}
        </main>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 100,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 18px', borderRadius: 99,
            background: '#13181f', border: '1px solid rgba(255,255,255,0.1)',
            color: '#e8ecf4', fontSize: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
          role="status"
        >
          {toast.ok
            ? <Check size={14} style={{ color: '#22c55e' }} />
            : <X    size={14} style={{ color: '#ef4444' }} />
          }
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ─── Overview ────────────────────────────────────────────────────
function OverviewTab({ notify }: { notify: (m: string, ok?: boolean) => void }) {
  const [counts, setCounts] = useState({ movies: 0, cities: 0, theatres: 0, bookings: 0 })

  useEffect(() => {
    void (async () => {
      try {
        const [movies, cities, theatres, bookings] = await Promise.allSettled([
          apiFetch<unknown[]>('/movies'),
          apiFetch<unknown[]>('/cities'),
          apiFetch<unknown[]>('/theatres'),
          apiFetch<unknown[]>('/shows'),
        ])
        setCounts({
          movies:   movies.status   === 'fulfilled' ? movies.value.length   : 0,
          cities:   cities.status   === 'fulfilled' ? cities.value.length   : 0,
          theatres: theatres.status === 'fulfilled' ? theatres.value.length : 0,
          bookings: bookings.status === 'fulfilled' ? bookings.value.length : 0,
        })
      } catch { /* silent */ }
    })()
  }, [])

  const metrics = [
    { label: 'Movies',    value: counts.movies   },
    { label: 'Cities',    value: counts.cities   },
    { label: 'Theatres',  value: counts.theatres },
    { label: 'Shows',     value: counts.bookings },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {metrics.map(m => (
          <div key={m.label} className="admin-metric">
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', marginBottom: 20 }} />
            <p style={{ fontSize: 13, color: '#4a5568', marginBottom: 6 }}>{m.label}</p>
            <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.05em' }}>{m.value}</p>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 28, fontSize: 14, color: '#4a5568', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
        Select a section from the sidebar to manage catalogue, screenings, and seat inventory.
      </p>
    </div>
  )
}

// ─── Shared table ────────────────────────────────────────────────
function DataTable<T extends Record<string, unknown>>({
  items, columns, actions,
}: {
  items: T[]
  columns: { key: string; label: string; render?: (item: T) => ReactNode }[]
  actions?: (item: T) => ReactNode
}) {
  if (!items.length) {
    return (
      <div className="admin-table-wrap" style={{ padding: 40, textAlign: 'center', color: '#4a5568', fontSize: 14 }}>
        No records found.
      </div>
    )
  }
  return (
    <div className="admin-table-wrap">
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map(c => <th key={c.key}>{c.label}</th>)}
              {actions && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={String(item.id ?? i)}>
                {columns.map(c => (
                  <td key={c.key}>
                    {c.render ? c.render(item) : String(item[c.key] ?? '—')}
                  </td>
                ))}
                {actions && <td style={{ textAlign: 'right' }}>{actions(item)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AdminLookup({
  placeholder, onFind, extra,
}: {
  placeholder: string
  onFind: (id: string) => void
  extra?: ReactNode
}) {
  const [id, setId] = useState('')
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
      {extra}
      <input
        value={id}
        onChange={e => setId(e.target.value)}
        placeholder={placeholder}
        className="admin-input"
        style={{ maxWidth: 180 }}
      />
      <button
        type="button"
        onClick={() => { if (id.trim()) onFind(id.trim()) }}
        style={{ height: 40, padding: '0 16px', borderRadius: 8, background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 700 }}
      >
        Find
      </button>
    </div>
  )
}

// ─── Shared form field ────────────────────────────────────────────
function Field({
  label, name, type = 'text', value, onChange, options,
}: {
  label: string; name: string; type?: string
  value: string; onChange: (v: string) => void
  options?: { label: string; value: string }[]
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span className="admin-field-label">{label}</span>
      {options ? (
        <AdminSelect
          value={value}
          onChange={onChange}
          options={options}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="admin-input"
        />
      )}
    </label>
  )
}

function useForm(initial: Record<string, string> = {}) {
  const [form, setForm] = useState(initial)
  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }))
  const reset = (vals?: Record<string, string>) => setForm(vals ?? initial)
  return { form, set, reset }
}

// ─── Section wrapper with Add form toggle ─────────────────────────
function SectionWrapper({
  label, addLabel, busy, onRefresh, onAdd, addForm, children,
}: {
  label: string; addLabel?: string; busy?: boolean
  onRefresh: () => void; onAdd?: () => void; addForm?: ReactNode; children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <p style={{ fontSize: 14, color: '#4a5568' }}>{label}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onRefresh}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#8494b0', fontSize: 13, background: 'transparent',
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          {addLabel && (
            <button
              onClick={() => setOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                background: '#7c3aed', color: '#fff',
                fontSize: 13, fontWeight: 700,
              }}
            >
              <Plus size={14} /> {addLabel}
            </button>
          )}
        </div>
      </div>

      {open && addForm && (
        <div className="admin-form-grid" style={{ marginBottom: 20 }}>
          {addForm}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <button
              disabled={busy}
              onClick={() => { onAdd?.(); setOpen(false) }}
              style={{
                padding: '9px 18px', borderRadius: 8,
                background: '#7c3aed', color: '#fff',
                fontSize: 13, fontWeight: 700,
                opacity: busy ? 0.5 : 1,
              }}
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                padding: '9px 14px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#8494b0', fontSize: 13, background: 'transparent',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}

// ─── Movies Tab ───────────────────────────────────────────────────
function MoviesTab({ notify }: { notify: (m: string, ok?: boolean) => void }) {
  const [items,   setItems]   = useState<Movie[]>([])
  const [query,   setQuery]   = useState('')
  const [busy,    setBusy]    = useState(false)
  const [editing, setEditing] = useState<Movie | null>(null)
  const { form, set, reset }  = useForm()

  async function load() {
    try { setItems(await apiFetch<Movie[]>('/movies')) }
    catch (e) { notify(e instanceof Error ? e.message : 'Load failed', false) }
  }
  useEffect(() => { void load() }, [])

  useEffect(() => {
    const q = query.trim()
    const t = setTimeout(async () => {
      try {
        if (!q) {
          setItems(await apiFetch<Movie[]>('/movies'))
          return
        }
        setItems(await apiFetch<Movie[]>(`/movies/search?name=${encodeURIComponent(q)}`))
      } catch (e) { notify(e instanceof Error ? e.message : 'Search failed', false) }
    }, q ? 300 : 0)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  async function add() {
    setBusy(true)
    try {
      await apiFetch('/movies/add', { method: 'POST', body: JSON.stringify(movieBody(form)) })
      reset(); await load(); notify('Movie added')
    } catch (e) { notify(e instanceof Error ? e.message : 'Failed', false) }
    finally { setBusy(false) }
  }

  async function update() {
    if (!editing) return
    setBusy(true)
    try {
      await apiFetch(`/movies/update/${editing.id}`, { method: 'PUT', body: JSON.stringify({ id: editing.id, ...movieBody(form) }) })
      setEditing(null); reset(); await load(); notify('Movie updated')
    } catch (e) { notify(e instanceof Error ? e.message : 'Failed', false) }
    finally { setBusy(false) }
  }

  async function del(id: number) {
    if (!confirm('Delete this movie?')) return
    try { await apiFetch(`/movies/delete/${id}`, { method: 'DELETE' }); await load(); notify('Movie deleted') }
    catch (e) { notify(e instanceof Error ? e.message : 'Failed', false) }
  }

  async function findMovie(id: string) {
    try {
      const movie = await apiFetch<Movie>(`/movies/${id}`)
      notify(`Found movie: ${movie.title}`)
    } catch (e) { notify(e instanceof Error ? e.message : 'Not found', false) }
  }

  const movieFields = (
    <>
      <Field label="Title"       name="title"           value={form.title           ?? ''} onChange={v => set('title', v)} />
      <Field label="Genre"       name="genre"           value={form.genre           ?? ''} onChange={v => set('genre', v)} />
      <Field label="Language"    name="language"        value={form.language        ?? ''} onChange={v => set('language', v)} />
      <Field label="Duration (min)" name="durationMinutes" value={form.durationMinutes ?? ''} onChange={v => set('durationMinutes', v)} type="number" />
      <Field label="Rating"      name="rating"          value={form.rating          ?? ''} onChange={v => set('rating', v)} type="number" />
      <Field label="Release date" name="releaseDate"    value={form.releaseDate     ?? ''} onChange={v => set('releaseDate', v)} type="date" />
      <Field label="Description" name="description"    value={form.description     ?? ''} onChange={v => set('description', v)} />
    </>
  )

  const filtered = items

  return (
    <SectionWrapper
      label="Manage the live movie catalogue."
      addLabel="Add Movie"
      busy={busy}
      onRefresh={load}
      onAdd={add}
      addForm={movieFields}
    >
      <AdminLookup placeholder="Movie ID" onFind={findMovie} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '0 4px' }}>
        <Search size={16} style={{ color: '#4a5568', flexShrink: 0 }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search movies…"
          className="admin-input"
          style={{ maxWidth: 320 }}
        />
      </div>

      <DataTable
        items={filtered as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'id',    label: 'ID',    render: (r) => <span style={{ color: '#4a5568' }}>#{(r as unknown as Movie).id}</span> },
          { key: 'title', label: 'Title', render: (r) => <span style={{ fontWeight: 600 }}>{(r as unknown as Movie).title}</span> },
          { key: 'genre', label: 'Genre' },
          { key: 'language', label: 'Language' },
          { key: 'rating', label: 'Rating', render: (r) => <span style={{ color: '#fbbf24' }}>★ {(r as unknown as Movie).rating ?? '—'}</span> },
          { key: 'durationMinutes', label: 'Duration', render: (r) => { const m = (r as unknown as Movie).durationMinutes; return m ? `${Math.floor(m/60)}h ${m%60}m` : '—' } },
        ]}
        actions={(r) => {
          const movie = r as unknown as Movie
          return (
            <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                title="Edit"
                onClick={() => { setEditing(movie); reset(movieToForm(movie)) }}
                style={{ color: '#fbbf24' }}
              >
                <Pencil size={15} />
              </button>
              <button title="Delete" onClick={() => del(movie.id)} style={{ color: '#ef4444' }}>
                <Trash2 size={15} />
              </button>
            </span>
          )
        }}
      />

      {editing && (
        <MovieEditModal
          form={form}
          set={set}
          busy={busy}
          onClose={() => { setEditing(null); reset() }}
          onSave={update}
        />
      )}
    </SectionWrapper>
  )
}

function movieBody(f: Record<string, string>) {
  return {
    title: f.title,
    description: f.description,
    genre: f.genre,
    language: f.language,
    durationMinutes: Number(f.durationMinutes) || undefined,
    rating: Number(f.rating) || undefined,
    releaseDate: f.releaseDate || undefined,
  }
}
function movieToForm(m: Movie): Record<string, string> {
  return {
    title: m.title ?? '',
    description: m.description ?? '',
    genre: m.genre ?? '',
    language: m.language ?? '',
    durationMinutes: String(m.durationMinutes ?? ''),
    rating: String(m.rating ?? ''),
    releaseDate: m.releaseDate ?? '',
  }
}

function MovieEditModal({ form, set, busy, onClose, onSave }: {
  form: Record<string, string>; set: (k: string, v: string) => void
  busy: boolean; onClose: () => void; onSave: () => void
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'grid', placeItems: 'center',
      background: 'rgba(0,0,0,0.7)', padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 640,
        background: '#13181f', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        padding: 28, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Edit Movie</h2>
          <button onClick={onClose} style={{ color: '#8494b0' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Title"          name="title"           value={form.title           ?? ''} onChange={v => set('title', v)} />
          <Field label="Genre"          name="genre"           value={form.genre           ?? ''} onChange={v => set('genre', v)} />
          <Field label="Language"       name="language"        value={form.language        ?? ''} onChange={v => set('language', v)} />
          <Field label="Duration (min)" name="durationMinutes" value={form.durationMinutes ?? ''} onChange={v => set('durationMinutes', v)} type="number" />
          <Field label="Rating"         name="rating"          value={form.rating          ?? ''} onChange={v => set('rating', v)} type="number" />
          <Field label="Release date"   name="releaseDate"     value={form.releaseDate     ?? ''} onChange={v => set('releaseDate', v)} type="date" />
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="admin-field-label">Description</span>
              <textarea
                value={form.description ?? ''}
                onChange={e => set('description', e.target.value)}
                className="admin-input"
                style={{ height: 90, resize: 'vertical' }}
              />
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', color: '#8494b0', fontSize: 13, background: 'transparent' }}>
            Cancel
          </button>
          <button disabled={busy} onClick={onSave} style={{ padding: '9px 20px', borderRadius: 8, background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 700, opacity: busy ? 0.5 : 1 }}>
            {busy ? 'Saving…' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Cities Tab ───────────────────────────────────────────────────
function CitiesTab({ notify }: { notify: (m: string, ok?: boolean) => void }) {
  const [items, setItems] = useState<City[]>([])
  const [busy,  setBusy]  = useState(false)
  const { form, set, reset } = useForm()

  async function load() {
    try { setItems(await apiFetch<City[]>('/cities')) }
    catch (e) { notify(e instanceof Error ? e.message : 'Load failed', false) }
  }
  useEffect(() => { void load() }, [])

  async function add() {
    setBusy(true)
    try {
      await apiFetch('/cities/add', { method: 'POST', body: JSON.stringify({ name: form.name, state: form.state }) })
      reset(); await load(); notify('City added')
    } catch (e) { notify(e instanceof Error ? e.message : 'Failed', false) }
    finally { setBusy(false) }
  }

  async function findCity(id: string) {
    try {
      const city = await apiFetch<City>(`/cities/${id}`)
      notify(`Found city: ${city.name}`)
    } catch (e) { notify(e instanceof Error ? e.message : 'Not found', false) }
  }

  return (
    <SectionWrapper
      label="Manage cities where theatres operate."
      addLabel="Add City"
      busy={busy}
      onRefresh={load}
      onAdd={add}
      addForm={<>
        <Field label="City name" name="name"  value={form.name  ?? ''} onChange={v => set('name', v)} />
        <Field label="State"     name="state" value={form.state ?? ''} onChange={v => set('state', v)} />
      </>}
    >
      <AdminLookup placeholder="City ID" onFind={findCity} />
      <DataTable
        items={items as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'id',    label: 'ID',    render: r => <span style={{ color: '#4a5568' }}>#{(r as unknown as City).id}</span> },
          { key: 'name',  label: 'Name',  render: r => <span style={{ fontWeight: 600 }}>{(r as unknown as City).name}</span> },
          { key: 'state', label: 'State' },
        ]}
      />
    </SectionWrapper>
  )
}

// ─── Theatres Tab ─────────────────────────────────────────────────
function TheatresTab({ notify }: { notify: (m: string, ok?: boolean) => void }) {
  const [items,  setItems]  = useState<Theatre[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [busy,   setBusy]   = useState(false)
  const { form, set, reset } = useForm()

  async function load() {
    try {
      const [t, c] = await Promise.all([apiFetch<Theatre[]>('/theatres'), apiFetch<City[]>('/cities')])
      setItems(t); setCities(c)
    } catch (e) { notify(e instanceof Error ? e.message : 'Load failed', false) }
  }
  useEffect(() => { void load() }, [])

  async function add() {
    setBusy(true)
    try {
      await apiFetch('/theatres/add', { method: 'POST', body: JSON.stringify({ name: form.name, address: form.address, cityId: Number(form.cityId) }) })
      reset(); await load(); notify('Theatre added')
    } catch (e) { notify(e instanceof Error ? e.message : 'Failed', false) }
    finally { setBusy(false) }
  }

  async function findTheatre(id: string) {
    try {
      const theatre = await apiFetch<Theatre>(`/theatres/${id}`)
      notify(`Found theatre: ${theatre.name}`)
    } catch (e) { notify(e instanceof Error ? e.message : 'Not found', false) }
  }

  return (
    <SectionWrapper
      label="Manage theatre locations."
      addLabel="Add Theatre"
      busy={busy}
      onRefresh={load}
      onAdd={add}
      addForm={<>
        <Field label="Name"    name="name"    value={form.name    ?? ''} onChange={v => set('name', v)} />
        <Field label="Address" name="address" value={form.address ?? ''} onChange={v => set('address', v)} />
        <Field label="City" name="cityId" value={form.cityId ?? ''} onChange={v => set('cityId', v)}
          options={cities.map(c => ({ label: c.name, value: String(c.id) }))} />
      </>}
    >
      <AdminLookup placeholder="Theatre ID" onFind={findTheatre} />
      <DataTable
        items={items as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'id',      label: 'ID',      render: r => <span style={{ color: '#4a5568' }}>#{(r as unknown as Theatre).id}</span> },
          { key: 'name',    label: 'Name',    render: r => <span style={{ fontWeight: 600 }}>{(r as unknown as Theatre).name}</span> },
          { key: 'address', label: 'Address' },
          { key: 'city',    label: 'City',    render: r => (r as unknown as Theatre).city?.name ?? '—' },
        ]}
      />
    </SectionWrapper>
  )
}

// ─── Screens Tab ──────────────────────────────────────────────────
function ScreensTab({ notify }: { notify: (m: string, ok?: boolean) => void }) {
  const [items,    setItems]    = useState<Screen[]>([])
  const [theatres, setTheatres] = useState<Theatre[]>([])
  const [busy,     setBusy]     = useState(false)
  const { form, set, reset } = useForm()

  async function load() {
    try {
      const [s, t] = await Promise.all([apiFetch<Screen[]>('/screens'), apiFetch<Theatre[]>('/theatres')])
      setItems(s); setTheatres(t)
    } catch (e) { notify(e instanceof Error ? e.message : 'Load failed', false) }
  }
  useEffect(() => { void load() }, [])

  async function add() {
    setBusy(true)
    try {
      await apiFetch('/screens/add', { method: 'POST', body: JSON.stringify({ name: form.name, theatreId: Number(form.theatreId), totalSeats: Number(form.totalSeats) }) })
      reset(); await load(); notify('Screen added')
    } catch (e) { notify(e instanceof Error ? e.message : 'Failed', false) }
    finally { setBusy(false) }
  }

  async function findScreen(id: string) {
    try {
      const screen = await apiFetch<Screen>(`/screens/${id}`)
      notify(`Found screen: ${screen.name}`)
    } catch (e) { notify(e instanceof Error ? e.message : 'Not found', false) }
  }

  async function loadByTheatre(theatreId: string) {
    try {
      const screens = await apiFetch<Screen[]>(`/screens/theatre/${theatreId}`)
      setItems(screens)
      notify(`Loaded ${screens.length} screens for theatre`)
    } catch (e) { notify(e instanceof Error ? e.message : 'Load failed', false) }
  }

  return (
    <SectionWrapper
      label="Manage screens within theatres."
      addLabel="Add Screen"
      busy={busy}
      onRefresh={load}
      onAdd={add}
      addForm={<>
        <Field label="Screen name" name="name"       value={form.name       ?? ''} onChange={v => set('name', v)} />
        <Field label="Total seats" name="totalSeats" value={form.totalSeats ?? ''} onChange={v => set('totalSeats', v)} type="number" />
        <Field label="Theatre" name="theatreId" value={form.theatreId ?? ''} onChange={v => set('theatreId', v)}
          options={theatres.map(t => ({ label: t.name, value: String(t.id) }))} />
      </>}
    >
      <AdminLookup 
        placeholder="Screen ID" 
        onFind={findScreen}
        extra={
          <div style={{ flex: 1, maxWidth: 280 }}>
            <span className="admin-field-label" style={{ display: 'block', marginBottom: 6 }}>Theatre</span>
            <AdminSelect
              value=""
              onChange={loadByTheatre}
              placeholder="Filter by theatre…"
              options={theatres.map(t => ({ label: t.name, value: String(t.id) }))}
            />
          </div>
        }
      />
      <DataTable
        items={items as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'id',         label: 'ID',          render: r => <span style={{ color: '#4a5568' }}>#{(r as unknown as Screen).id}</span> },
          { key: 'name',       label: 'Name',        render: r => <span style={{ fontWeight: 600 }}>{(r as unknown as Screen).name}</span> },
          { key: 'totalSeats', label: 'Total seats' },
          { key: 'theatre',    label: 'Theatre',     render: r => (r as unknown as Screen).theatre?.name ?? '—' },
        ]}
      />
    </SectionWrapper>
  )
}

// ─── Seats Tab ────────────────────────────────────────────────────
function SeatsTab({ notify }: { notify: (m: string, ok?: boolean) => void }) {
  const [items,   setItems]   = useState<Seat[]>([])
  const [screens, setScreens] = useState<Screen[]>([])
  const [screenId, setScreenId] = useState('')
  const [busy,    setBusy]    = useState(false)
  const { form, set, reset }  = useForm({ screenId: '' })

  async function loadScreens() {
    try { setScreens(await apiFetch<Screen[]>('/screens')) }
    catch { /* silent */ }
  }
  useEffect(() => { void loadScreens() }, [])

  async function load(selectedId = screenId) {
    if (!selectedId) { notify('Select a screen first', false); return }
    try { setItems(await apiFetch<Seat[]>(`/seats/screen/${selectedId}`)) }
    catch (e) { notify(e instanceof Error ? e.message : 'Load failed', false) }
  }

  async function add() {
    const selectedScreenId = Number(form.screenId)
    if (!form.screenId || !Number.isInteger(selectedScreenId) || selectedScreenId <= 0) {
      notify('Select a screen first', false)
      return
    }
    setBusy(true)
    try {
      await apiFetch('/seats/add', { method: 'POST', body: JSON.stringify({
        seatNumber: form.seatNumber, row: form.row,
        column: Number(form.column), screenId: selectedScreenId,
        seatType: form.seatType || 'REGULAR',
      }) })
      setScreenId(form.screenId); reset({ screenId: form.screenId }); await load(form.screenId); notify('Seat added')
    } catch (e) { notify(e instanceof Error ? e.message : 'Failed', false) }
    finally { setBusy(false) }
  }

  async function findSeat(id: string) {
    try {
      const seat = await apiFetch<Seat>(`/seats/${id}`)
      if (seat.screen?.id) {
        setScreenId(String(seat.screen.id))
        await load(String(seat.screen.id))
        notify(`Loaded seats for screen. Found seat: ${seat.seatNumber}`)
      } else {
        notify(`Found seat: ${seat.seatNumber} (no screen info)`)
      }
    } catch (e) { notify(e instanceof Error ? e.message : 'Not found', false) }
  }

  function handleRefresh() {
    setScreenId('')
    setItems([])
    reset({ screenId: '' })
  }

  return (
    <SectionWrapper
      label="Inspect and add seats for a specific screen."
      addLabel="Add Seat"
      busy={busy}
      onRefresh={handleRefresh}
      onAdd={add}
      addForm={<>
        <Field label="Seat number" name="seatNumber" value={form.seatNumber ?? ''} onChange={v => set('seatNumber', v)} />
        <Field label="Row"         name="row"        value={form.row        ?? ''} onChange={v => set('row', v)} />
        <Field label="Column"      name="column"     value={form.column     ?? ''} onChange={v => set('column', v)} type="number" />
        <Field label="Screen"      name="screenId"   value={form.screenId   ?? ''} onChange={v => set('screenId', v)}
          options={screens.map(s => ({ label: `${s.name} (${s.theatre?.name})`, value: String(s.id) }))} />
        <Field label="Seat type" name="seatType" value={form.seatType ?? 'REGULAR'} onChange={v => set('seatType', v)}
          options={[
            { label: 'Regular', value: 'REGULAR' },
            { label: 'Premium', value: 'PREMIUM' },
            { label: 'VIP',     value: 'VIP'     },
          ]}
        />
      </>}
    >
      <AdminLookup placeholder="Seat ID" onFind={findSeat} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16 }}>
        <div style={{ flex: 1, maxWidth: 280 }}>
          <span className="admin-field-label" style={{ display: 'block', marginBottom: 6 }}>Screen</span>
          <AdminSelect
            value={screenId}
            onChange={setScreenId}
            placeholder="Select a screen…"
            options={screens.map(s => ({ label: `${s.name} (${s.theatre?.name})`, value: String(s.id) }))}
          />
        </div>
        <button
          onClick={() => load()}
          style={{
            height: 40, padding: '0 16px', borderRadius: 8,
            background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 700,
          }}
        >
          Load
        </button>
      </div>
      <DataTable
        items={items as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'id',         label: 'ID',          render: r => <span style={{ color: '#4a5568' }}>#{(r as unknown as Seat).id}</span> },
          { key: 'seatNumber', label: 'Seat',        render: r => <span style={{ fontWeight: 600 }}>{(r as unknown as Seat).seatNumber}</span> },
          { key: 'row',        label: 'Row' },
          { key: 'column',     label: 'Col' },
          { key: 'seatType',   label: 'Type',
            render: r => {
              const t = (r as unknown as Seat).seatType
              const colors: Record<string, string> = { REGULAR: '#4a5568', PREMIUM: '#7c3aed', VIP: '#fbbf24' }
              return <span style={{ color: colors[t ?? ''] ?? '#4a5568', fontWeight: 600 }}>{t}</span>
            }
          },
        ]}
      />
    </SectionWrapper>
  )
}

// ─── Shows Tab ────────────────────────────────────────────────────
function ShowsTab({ notify }: { notify: (m: string, ok?: boolean) => void }) {
  const [items,   setItems]   = useState<Show[]>([])
  const [movies,  setMovies]  = useState<Movie[]>([])
  const [screens, setScreens] = useState<Screen[]>([])
  const [screenId, setScreenId] = useState('')
  const [showDate, setShowDate] = useState(() => {
    const today = new Date()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${today.getFullYear()}-${month}-${day}`
  })
  const [busy,    setBusy]    = useState(false)
  const { form, set, reset }  = useForm({ startHour: '0', startMinute: '0', endHour: '0', endMinute: '0' })

  async function load() {
    try {
      const [s, m, sc] = await Promise.all([
        apiFetch<Show[]>('/shows'),
        apiFetch<Movie[]>('/movies'),
        apiFetch<Screen[]>('/screens'),
      ])
      setItems(s); setMovies(m); setScreens(sc)
    } catch (e) { notify(e instanceof Error ? e.message : 'Load failed', false) }
  }
  useEffect(() => { void load() }, [])

  async function add() {
    setBusy(true)
    try {
      await apiFetch('/shows/add', { method: 'POST', body: JSON.stringify({
        movieId: Number(form.movieId), screenId: Number(form.screenId),
        showDate: form.showDate,
        startTime: formatTime({ hour: Number(form.startHour), minute: Number(form.startMinute), second: 0 }),
        endTime:   formatTime({ hour: Number(form.endHour),   minute: Number(form.endMinute),   second: 0 }),
        ticketPrice: Number(form.ticketPrice),
      }) })
      reset(); await load(); notify('Show added')
    } catch (e) { notify(e instanceof Error ? e.message : 'Failed', false) }
    finally { setBusy(false) }
  }

  async function loadByScreen(selectedScreenId = screenId, selectedDate = showDate) {
    if (!selectedScreenId || !selectedDate) {
      notify('Select a screen and date first', false)
      return
    }
    try {
      const shows = await apiFetch<Show[]>(`/shows/screen/${selectedScreenId}/date?localDate=${selectedDate}`)
      setScreenId(selectedScreenId)
      setItems(shows)
      notify(`Loaded ${shows.length} shows for screen on ${selectedDate}`)
    } catch (e) { notify(e instanceof Error ? e.message : 'Load failed', false) }
  }

  async function findShow(id: string) {
    try {
      const show = await apiFetch<Show>(`/shows/${id}`)
      notify(`Found show: ${show.movie?.title}`)
    } catch (e) { notify(e instanceof Error ? e.message : 'Not found', false) }
  }

  return (
    <SectionWrapper
      label="Schedule screenings for movies."
      addLabel="Add Show"
      busy={busy}
      onRefresh={load}
      onAdd={add}
      addForm={<>
        <Field label="Movie" name="movieId" value={form.movieId ?? ''} onChange={v => set('movieId', v)}
          options={movies.map(m => ({ label: m.title ?? `Movie ${m.id}`, value: String(m.id) }))} />
        <Field label="Screen" name="screenId" value={form.screenId ?? ''} onChange={v => set('screenId', v)}
          options={screens.map(s => ({ label: `${s.name} (${s.theatre?.name})`, value: String(s.id) }))} />
        <Field label="Date"          name="showDate"    value={form.showDate    ?? ''} onChange={v => set('showDate', v)} type="date" />
        <Field label="Start hour"    name="startHour"   value={form.startHour   ?? ''} onChange={v => set('startHour', v)} type="number" />
        <Field label="Start minute"  name="startMinute" value={form.startMinute ?? ''} onChange={v => set('startMinute', v)} type="number" />
        <Field label="End hour"      name="endHour"     value={form.endHour     ?? ''} onChange={v => set('endHour', v)} type="number" />
        <Field label="End minute"    name="endMinute"   value={form.endMinute   ?? ''} onChange={v => set('endMinute', v)} type="number" />
        <Field label="Ticket price"  name="ticketPrice" value={form.ticketPrice ?? ''} onChange={v => set('ticketPrice', v)} type="number" />
      </>}
    >
      <AdminLookup
        placeholder="Show ID"
        onFind={findShow}
        extra={<>
          <div style={{ flex: 1, maxWidth: 280 }}>
            <span className="admin-field-label" style={{ display: 'block', marginBottom: 6 }}>Screen</span>
            <AdminSelect
              value={screenId}
              onChange={value => { setScreenId(value); void loadByScreen(value) }}
              placeholder="Filter by screen…"
              options={screens.map(s => ({ label: `${s.name} (${s.theatre?.name})`, value: String(s.id) }))}
            />
          </div>
          <div style={{ width: 160 }}>
            <span className="admin-field-label" style={{ display: 'block', marginBottom: 6 }}>Date</span>
            <input
              type="date"
              value={showDate}
              onChange={e => setShowDate(e.target.value)}
              aria-label="Show date"
              style={{
                width: '100%', height: 40, padding: '0 10px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                color: '#e8ecf4', fontSize: 13,
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => void loadByScreen()}
            style={{
              height: 40, padding: '0 14px', borderRadius: 8,
              background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 700,
            }}
          >
            Load date
          </button>
        </>}
      />
      <DataTable
        items={items as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'id',          label: 'ID',      render: r => <span style={{ color: '#4a5568' }}>#{(r as unknown as Show).id}</span> },
          { key: 'movie',       label: 'Movie',   render: r => <span style={{ fontWeight: 600 }}>{(r as unknown as Show).movie?.title ?? '—'}</span> },
          { key: 'screen',      label: 'Screen',  render: r => { const s = (r as unknown as Show).screen; return `${s?.name ?? '—'} @ ${s?.theatre?.name ?? '—'}` } },
          { key: 'showDate',    label: 'Date' },
          { key: 'startTime',   label: 'Start',   render: r => fmtTime((r as unknown as Show).startTime) },
          { key: 'ticketPrice', label: 'Price',   render: r => `₹${(r as unknown as Show).ticketPrice ?? 0}` },
        ]}
      />
    </SectionWrapper>
  )
}

// ─── Bookings Tab (read-only) ─────────────────────────────────────
function BookingsTab({ notify }: { notify: (m: string, ok?: boolean) => void }) {
  const [items, setItems] = useState<Booking[]>([])

  async function load() {
    // No "all bookings" endpoint — load by iterating shows would be too costly.
    // We fetch the full shows list and note this is a read-only view.
    // In practice, admin would need GET /api/bookings if exposed; for now we fetch show-based.
    notify('Bookings view is read-only. Fetching recent data…')
    try {
      // Try loading all users then their bookings
      const users = await apiFetch<{ id: number }[]>('/users')
      const results = await Promise.allSettled(
        users.slice(0, 30).map(u => apiFetch<Booking[]>(`/bookings/user/${u.id}`))
      )
      const all: Booking[] = []
      for (const r of results) { if (r.status === 'fulfilled') all.push(...r.value) }
      // deduplicate
      const seen = new Set<number>()
      setItems(all.filter(b => { if (seen.has(b.id)) return false; seen.add(b.id); return true }))
    } catch (e) { notify(e instanceof Error ? e.message : 'Load failed', false) }
  }

  useEffect(() => { void load() }, [])

  async function findBooking(id: string) {
    try {
      const booking = await apiFetch<Booking>(`/bookings/${id}`)
      notify(`Found booking #${booking.id} for ${booking.show?.movie?.title}`)
    } catch (e) { notify(e instanceof Error ? e.message : 'Not found', false) }
  }

  return (
    <SectionWrapper label="Read-only view of all bookings." onRefresh={load}>
      <AdminLookup placeholder="Booking ID" onFind={findBooking} />
      <DataTable
        items={items as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'id',    label: 'ID',      render: r => <span style={{ color: '#4a5568' }}>#{(r as unknown as Booking).id}</span> },
          { key: 'user',  label: 'User',    render: r => (r as unknown as Booking).user?.name ?? '—' },
          { key: 'movie', label: 'Movie',   render: r => (r as unknown as Booking).show?.movie?.title ?? '—' },
          { key: 'seats', label: 'Seats',   render: r => String((r as unknown as Booking).show?.screen?.name ?? '—') },
          { key: 'total', label: 'Total',   render: r => `₹${(r as unknown as Booking).totalPrice ?? 0}` },
          { key: 'status', label: 'Status', render: r => {
            const s = (r as unknown as Booking).status
            return (
              <span style={{
                padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                background: s === 'CANCELLED' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                color: s === 'CANCELLED' ? '#ef4444' : '#22c55e',
              }}>{s}</span>
            )
          }},
        ]}
      />
    </SectionWrapper>
  )
}

// ─── Users Tab (read-only) ────────────────────────────────────────
function UsersTab({ notify }: { notify: (m: string, ok?: boolean) => void }) {
  const [items, setItems] = useState<BookUser[]>([])
  const [query, setQuery] = useState('')

  async function load() {
    try { setItems(await apiFetch<BookUser[]>('/users')) }
    catch (e) { notify(e instanceof Error ? e.message : 'Load failed', false) }
  }
  useEffect(() => { void load() }, [])

  const filtered = items.filter(u =>
    (u.name ?? '').toLowerCase().includes(query.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(query.toLowerCase())
  )

  return (
    <SectionWrapper label="Read-only view of all registered users." onRefresh={load}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Search size={16} style={{ color: '#4a5568', flexShrink: 0 }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search users…"
          className="admin-input"
          style={{ maxWidth: 320 }}
        />
      </div>
      <DataTable
        items={filtered as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'id',          label: 'ID',    render: r => <span style={{ color: '#4a5568' }}>#{(r as unknown as BookUser).id}</span> },
          { key: 'name',        label: 'Name',  render: r => <span style={{ fontWeight: 600 }}>{(r as unknown as BookUser).name}</span> },
          { key: 'email',       label: 'Email' },
          { key: 'phoneNumber', label: 'Phone' },
          { key: 'createdAt',   label: 'Joined', render: r => {
            const d = (r as unknown as BookUser).createdAt
            return d ? new Date(d).toLocaleDateString() : '—'
          }},
        ]}
      />
    </SectionWrapper>
  )
}
