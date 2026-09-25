'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, Check, ChevronDown, Clapperboard, Clock3,
  Film, LogOut, MapPin, Moon, Search, Star, Sun, Ticket,
  UserRound, X
} from 'lucide-react'

// ─── Custom City Picker ───────────────────────────────────────────
function CityPicker({
  cities,
  cityId,
  onChange,
  label = 'Watching in',
  inline = false,
}: {
  cities: City[]
  cityId: number | null
  onChange: (id: number) => void
  label?: string
  inline?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = cities.find(c => c.id === cityId)

  // close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div
      ref={ref}
      className={`cpicker${inline ? ' cpicker--inline' : ''}`}
      style={{ position: 'relative' }}
    >
      {/* Trigger button */}
      <button
        className="cpicker__trigger"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        type="button"
      >
        <MapPin size={16} className="cpicker__icon" />
        <div className="cpicker__text">
          <span className="cpicker__label">{label}</span>
          <span className="cpicker__value">{current?.name ?? 'Choose a city'}</span>
        </div>
        <ChevronDown
          size={14}
          className="cpicker__chevron"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="cpicker__menu" role="listbox" aria-label="Select city">
          {cities.map(c => (
            <button
              key={c.id}
              role="option"
              aria-selected={c.id === cityId}
              className={`cpicker__option${c.id === cityId ? ' cpicker__option--active' : ''}`}
              onClick={() => { onChange(c.id); setOpen(false) }}
              type="button"
            >
              {c.id === cityId && <Check size={13} style={{ flexShrink: 0 }} />}
              <span>{c.name}</span>
              {c.state && <span className="cpicker__state">{c.state}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Types ───────────────────────────────────────────────────────
type Theme = 'dark' | 'light'
type View = 'home' | 'detail' | 'seats' | 'confirm' | 'bookings'

type AppUser   = { id: number; name: string; email: string }
type City      = { id: number; name: string; state?: string }
type Movie     = { id: number; title: string; genre?: string; language?: string; durationMinutes?: number; rating?: number; posterUrl?: string; description?: string; releaseDate?: string }
type Screen    = { id: number; name?: string; theatre?: Theatre }
type Theatre   = { id: number; name: string; address?: string; city?: City }
type Show      = { id: number; movie?: Movie; screen?: Screen; showDate?: string; startTime?: TimeObj; endTime?: TimeObj; ticketPrice?: number }
type TimeObj   = { hour: number; minute: number } | string
type Seat      = { id: number; seatNumber: string; row?: string; column?: number; seatType?: 'REGULAR' | 'PREMIUM' | 'VIP' }
type Booking   = { id: number; show?: Show; bookedSeats?: Seat[]; totalPrice?: number; status?: 'CONFIRMED' | 'CANCELLED'; bookedAt?: string }

// ─── API helpers ─────────────────────────────────────────────────
function apiUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')
  return `${base}${path.startsWith('/api') ? path : `/api${path}`}`
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
    const msg = (data && typeof data === 'object' && 'message' in data)
      ? String((data as Record<string, unknown>).message)
      : `Request failed (${res.status})`
    throw new Error(msg)
  }
  return data as T
}

// ─── Utils ───────────────────────────────────────────────────────
function fmtTime(t?: TimeObj | string | null) {
  if (!t) return 'TBA'
  // Backend may return "HH:MM:SS" string or {hour, minute} object
  if (typeof t === 'string') {
    const parts = t.split(':')
    const h = parseInt(parts[0], 10)
    const m = parseInt(parts[1] ?? '0', 10)
    if (isNaN(h) || isNaN(m)) return 'TBA'
    return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  const h = t.hour, m = t.minute
  if (h === undefined || h === null || m === undefined || m === null) return 'TBA'
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
function fmtDuration(min?: number) {
  if (!min) return ''
  return `${Math.floor(min / 60)}h ${min % 60}m`
}
function fmtPrice(n?: number) {
  return `₹${(n ?? 0).toLocaleString('en-IN')}`
}
const FALLBACK = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80'

// ─── Show-schedule anchor ─────────────────────────────────────────
// Returns the ISO date string (YYYY-MM-DD) that the date-strip should
// treat as "Today". Reads NEXT_PUBLIC_SHOW_START_DATE from the
// environment; falls back to the real current date if not set.
// All date arithmetic is done in LOCAL time to avoid UTC-offset issues
// that would shift the date by one day in IST (+05:30).
function getScheduleAnchor(): string {
  const env = process.env.NEXT_PUBLIC_SHOW_START_DATE?.trim()
  if (env && /^\d{4}-\d{2}-\d{2}$/.test(env)) return env
  // fallback: real today in local time
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Adds `days` calendar days to a YYYY-MM-DD string and returns
// the result as YYYY-MM-DD, using local-time arithmetic.
function addDays(isoDate: string, days: number): string {
  const [y, mo, d] = isoDate.split('-').map(Number)
  const dt = new Date(y, mo - 1, d)   // local midnight — no UTC shift
  dt.setDate(dt.getDate() + days)
  const ny  = dt.getFullYear()
  const nmo = String(dt.getMonth() + 1).padStart(2, '0')
  const nd  = String(dt.getDate()).padStart(2, '0')
  return `${ny}-${nmo}-${nd}`
}

// Returns the full weekday name for a YYYY-MM-DD string in local time.
function weekdayName(isoDate: string): string {
  const [y, mo, d] = isoDate.split('-').map(Number)
  return new Date(y, mo - 1, d).toLocaleDateString('en-IN', { weekday: 'long' })
}

// ─── Root Component ───────────────────────────────────────────────
export default function CinemaApp() {
  // theme
  const [theme, setTheme] = useState<Theme>('dark')

  // auth
  const [user, setUser] = useState<AppUser | null>(null)

  // navigation — SPA views
  const [view, setView] = useState<View>('home')

  // pending nav target saved before login redirect
  const pendingShow = useRef<Show | null>(null)

  // data
  const [cities,   setCities]   = useState<City[]>([])
  const [movies,   setMovies]   = useState<Movie[]>([])
  const [theatres, setTheatres] = useState<Theatre[]>([])
  const [shows,    setShows]    = useState<Show[]>([])

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [selectedShow,  setSelectedShow]  = useState<Show  | null>(null)
  const [cityId,        setCityId]        = useState<number | null>(null)

  // ── Separate date state per context ──────────────────────────
  // dashboardDate  — the date the HOME page uses (never mutated by detail page)
  // detailDate     — the date the DETAIL page uses (local to that flow)
  // This prevents the detail page's date picker from corrupting the
  // dashboard's selected date when the user navigates back.
  const anchor = getScheduleAnchor()
  const [dashboardDate, setDashboardDate] = useState<string>(() => anchor)
  const [detailDate,    setDetailDate]    = useState<string>(() => anchor)

  // selectedDate is the currently active date for whichever view is open.
  // It is derived — not stored — to keep the effect dependency clean.
  const selectedDate = view === 'detail' ? detailDate : dashboardDate

  const [availableSeats, setAvailableSeats] = useState<Seat[]>([])
  const [selectedSeats,  setSelectedSeats]  = useState<number[]>([])  // seat IDs
  const [bookings,       setBookings]       = useState<Booking[]>([])
  const [lastBooking,    setLastBooking]    = useState<Booking | null>(null)

  // UI state
  const [search,        setSearch]        = useState('')
  const [genreFilter,   setGenreFilter]   = useState('All')
  const [languageFilter, setLanguageFilter] = useState('All')
  const [catalogMovies, setCatalogMovies] = useState<Movie[]>([])
  const [loadingBase,   setLoadingBase]   = useState(true)
  const [loadingCity,   setLoadingCity]   = useState(false)
  const [loadingSeats,  setLoadingSeats]  = useState(false)
  const [bookingBusy,   setBookingBusy]   = useState(false)
  const [toast,         setToast]         = useState<{ msg: string; ok: boolean } | null>(null)

  // Cancellation token — incremented every time a new loadCityData call starts.
  // Each call captures the token value at the time it was launched; before
  // writing any state it checks whether the token is still current. If a newer
  // call has started, the old one silently discards its results instead of
  // overwriting the fresh data.
  const loadToken = useRef(0)
  const catalogToken = useRef(0)

  // Keep movies in a ref so loadCityData always reads the latest list,
  // even when called from a stale closure (effect or navigation handler).
  const moviesRef = useRef<Movie[]>([])
  useEffect(() => { moviesRef.current = movies }, [movies])
  useEffect(() => {
    const saved = (typeof window !== 'undefined'
      ? localStorage.getItem('cinestage-theme')
      : null) as Theme | null
    if (saved === 'light' || saved === 'dark') setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('cinestage-theme', theme)
  }, [theme])

  // ── load public data on mount ────────────────────────────────
  useEffect(() => { void bootstrap() }, [])

  // ── re-fetch city theatres + shows when city, date, or selected movie changes ─
  // selectedDate is derived from dashboardDate or detailDate depending on view,
  // so this effect correctly fires on any of those changing.
  useEffect(() => {
    if (cityId !== null) void loadCityData(cityId, selectedDate, selectedMovie?.id ?? null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId, selectedDate, selectedMovie?.id])

  // ── catalogue via search / genre / language endpoints ────────
  useEffect(() => {
    const delay = search.trim() ? 300 : 0
    const handle = setTimeout(() => { void loadCatalog() }, delay)
    return () => clearTimeout(handle)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, genreFilter, languageFilter])

  // ── load seats when entering seat view ───────────────────────
  useEffect(() => {
    if (view === 'seats' && selectedShow) void loadSeats(selectedShow.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedShow?.id])

  // ── helpers ──────────────────────────────────────────────────
  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2800)
  }

  async function loadCatalog() {
    const q = search.trim()
    if (!q && genreFilter === 'All' && languageFilter === 'All') {
      if (moviesRef.current.length) setCatalogMovies(moviesRef.current)
      return
    }
    const myToken = ++catalogToken.current
    try {
      let list: Movie[]
      if (q) {
        list = await apiFetch<Movie[]>(`/movies/search?name=${encodeURIComponent(q)}`)
      } else if (genreFilter !== 'All') {
        list = await apiFetch<Movie[]>(`/movies/genre/${encodeURIComponent(genreFilter)}`)
      } else {
        list = await apiFetch<Movie[]>(`/movies/language/${encodeURIComponent(languageFilter)}`)
      }
      if (myToken !== catalogToken.current) return
      if (q && genreFilter !== 'All') list = list.filter(m => m.genre === genreFilter)
      if (languageFilter !== 'All') list = list.filter(m => m.language === languageFilter)
      setCatalogMovies(list)
    } catch {
      if (myToken !== catalogToken.current) return
      const qlow = q.toLowerCase()
      setCatalogMovies(moviesRef.current.filter(m =>
        (!q || (m.title ?? '').toLowerCase().includes(qlow)) &&
        (genreFilter === 'All' || m.genre === genreFilter) &&
        (languageFilter === 'All' || m.language === languageFilter)
      ))
    }
  }

  async function bootstrap() {
    setLoadingBase(true)
    // Always start from the schedule anchor.
    const anchorDate = getScheduleAnchor()
    setDashboardDate(anchorDate)
    setDetailDate(anchorDate)

    try {
      const [cityData, movieData] = await Promise.all([
        apiFetch<City[]>('/cities'),
        apiFetch<Movie[]>('/movies'),
      ])
      setCities(cityData)
      setMovies(movieData)
      setCatalogMovies(movieData)
      moviesRef.current = movieData

      if (cityData.length) {
        setCityId(prev => {
          const id = prev ?? cityData[0].id
          void loadCityData(id, anchorDate, null)
          return id
        })
      }
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to load data', false)
    } finally {
      setLoadingBase(false)
    }
  }

  async function loadCityData(cid: number, date: string, movieId?: number | null) {
    // Claim this call's token. Any previously in-flight call with a lower
    // token value will see the mismatch and discard its results.
    const myToken = ++loadToken.current

    setLoadingCity(true)
    setTheatres([])
    setShows([])
    try {
      const cityTheatres = await apiFetch<Theatre[]>(`/theatres/city/${cid}`)

      // Another call started while we were waiting — discard our results.
      if (myToken !== loadToken.current) return

      setTheatres(cityTheatres)

      const theatreIds = new Set(cityTheatres.map(t => t.id))

      let flat: Show[] = []
      if (movieId) {
        // Detail page: all shows for this movie, then keep the selected date.
        const allForMovie = await apiFetch<Show[]>(`/shows/movie/${movieId}`)
        flat = allForMovie.filter(s => (s.showDate ?? '').startsWith(date))
      } else {
        const currentMovies = moviesRef.current
        const ids = currentMovies.map(m => m.id)
        if (!ids.length) {
          setLoadingCity(false)
          return
        }
        const chunks = await Promise.allSettled(
          ids.map(id => apiFetch<Show[]>(`/shows/movie/${id}/date?localDate=${date}`))
        )
        for (const r of chunks) {
          if (r.status === 'fulfilled') flat.push(...r.value)
        }
      }

      // Check again — another call may have started during the show fetches.
      if (myToken !== loadToken.current) return

      // Filter to theatres in this city only.
      setShows(flat.filter(s => theatreIds.has(s.screen?.theatre?.id ?? -1)))
    } catch (e) {
      if (myToken !== loadToken.current) return   // stale — ignore the error too
      notify(e instanceof Error ? e.message : 'Failed to load city data', false)
    } finally {
      // Only clear the loading spinner if we're still the active call.
      if (myToken === loadToken.current) setLoadingCity(false)
    }
  }

  async function loadSeats(showId: number) {
    setLoadingSeats(true)
    setAvailableSeats([])
    setSelectedSeats([])
    try {
      const [seats, show] = await Promise.all([
        apiFetch<Seat[]>(`/bookings/show/${showId}/available-seats`),
        apiFetch<Show>(`/shows/${showId}`),
      ])
      setAvailableSeats(seats)
      setSelectedShow(show)
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to load seats', false)
    } finally {
      setLoadingSeats(false)
    }
  }

  async function loadBookings() {
    if (!user) return
    try {
      const data = await apiFetch<Booking[]>(`/bookings/user/${user.id}`)
      setBookings(data)
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to load bookings', false)
    }
  }

  async function confirmBooking() {
    if (!user || !selectedShow || !selectedSeats.length) return
    setBookingBusy(true)
    try {
      const booking = await apiFetch<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, showId: selectedShow.id, seatIds: selectedSeats }),
      })
      let confirmed = booking
      if (booking?.id) {
        try { confirmed = await apiFetch<Booking>(`/bookings/${booking.id}`) }
        catch { /* POST body is enough if the by-id fetch fails */ }
      }
      setLastBooking(confirmed)
      setSelectedSeats([])
      setView('confirm')
      notify('Booking confirmed!')
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Booking failed', false)
    } finally {
      setBookingBusy(false)
    }
  }

  async function cancelBooking(id: number) {
    try {
      await apiFetch(`/bookings/${id}/cancel`, { method: 'PUT' })
      await loadBookings()
      notify('Booking cancelled')
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Cancel failed', false)
    }
  }

  // ── navigation helpers ────────────────────────────────────────
  function goHome() {
    setView('home')
    setSelectedMovie(null)
    setSelectedShow(null)
    setSearch('')
    // Reset BOTH dates to anchor so neither context carries stale state.
    const anchorDate = getScheduleAnchor()
    setDashboardDate(anchorDate)
    setDetailDate(anchorDate)
  }

  function openMovie(movie: Movie) {
    // Seed the detail page with the dashboard's current date so the user
    // sees a consistent starting point, but mutations on the detail page
    // will only affect detailDate — never dashboardDate.
    setDetailDate(dashboardDate)
    setSelectedMovie(movie)
    setSelectedShow(null)
    void apiFetch<Movie>(`/movies/${movie.id}`)
      .then(fresh => setSelectedMovie(fresh))
      .catch(() => { /* keep the list copy */ })
    setView('detail')
  }

  /** Called when user clicks "Book now" on a show. */
  function requestBooking(show: Show) {
    setSelectedShow(show)
    if (show.movie) setSelectedMovie(show.movie)
    if (user) {
      setView('seats')
    } else {
      // save the show and redirect to login inline
      pendingShow.current = show
      setView('home') // will be overridden by auth overlay
      setShowAuth('login')
    }
  }

  function handleLoginSuccess(loggedInUser: AppUser) {
    setUser(loggedInUser)
    setShowAuth(null)
    void apiFetch<AppUser>(`/users/${loggedInUser.id}`)
      .then(profile => setUser({
        id: Number(profile.id),
        name: profile.name,
        email: profile.email,
      }))
      .catch(() => { /* login payload is enough */ })
    // resume pending navigation
    if (pendingShow.current) {
      setSelectedShow(pendingShow.current)
      if (pendingShow.current.movie) setSelectedMovie(pendingShow.current.movie)
      pendingShow.current = null
      setView('seats')
    }
  }

  function handleLogout() {
    setUser(null)
    goHome()
  }

  function handleCityChange(newCityId: number) {
    // Do NOT clear selectedMovie here — if the user is on the detail page,
    // clearing it causes view='detail' + selectedMovie=null → blank screen.
    // The effect [cityId, selectedDate, selectedMovie?.id] will fire and
    // re-fetch shows for the new city, scoped to the current movie if on
    // detail, or all movies if on home (selectedMovie is null there).
    setCityId(newCityId)
    void apiFetch<City>(`/cities/${newCityId}`)
      .then(city => setCities(prev => prev.map(c => c.id === city.id ? city : c)))
      .catch(() => { /* list copy is enough */ })
  }

  // ── auth overlay state ────────────────────────────────────────
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null)

  // ── derived lists ─────────────────────────────────────────────
  const genres = useMemo(
    () => ['All', ...Array.from(new Set(movies.map(m => m.genre).filter(Boolean) as string[]))],
    [movies]
  )

  const languages = useMemo(
    () => ['All', ...Array.from(new Set(movies.map(m => m.language).filter(Boolean) as string[]))],
    [movies]
  )

  const cityShows = useMemo(
    () => shows.filter(s =>
      (genreFilter === 'All' || s.movie?.genre === genreFilter) &&
      (languageFilter === 'All' || s.movie?.language === languageFilter) &&
      (s.movie?.title?.toLowerCase().includes(search.toLowerCase()) ?? true)
    ),
    [shows, search, genreFilter, languageFilter]
  )

  const currentCity = cities.find(c => c.id === cityId)

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <AppHeader
        theme={theme}
        user={user}
        search={search}
        onSearch={setSearch}
        onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        onHome={goHome}
        onBookings={async () => { await loadBookings(); setView('bookings') }}
        onLogin={() => setShowAuth('login')}
        onLogout={handleLogout}
      />

      <main className="page-container">
        {view === 'home' && (
          <HomePage
            cities={cities}
            cityId={cityId}
            currentCity={currentCity}
            movies={catalogMovies}
            genres={genres}
            genreFilter={genreFilter}
            languages={languages}
            languageFilter={languageFilter}
            theatres={theatres}
            shows={cityShows}
            loading={loadingBase || loadingCity}
            selectedDate={dashboardDate}
            onCityChange={handleCityChange}
            onDateChange={setDashboardDate}
            onGenreFilter={setGenreFilter}
            onLanguageFilter={setLanguageFilter}
            onMovieClick={openMovie}
            onBookNow={requestBooking}
          />
        )}

        {view === 'detail' && selectedMovie && (
          <MovieDetailPage
            movie={selectedMovie}
            cities={cities}
            cityId={cityId}
            currentCity={currentCity}
            shows={shows}
            loading={loadingCity}
            selectedDate={detailDate}
            onCityChange={handleCityChange}
            onDateChange={setDetailDate}
            onBack={() => setView('home')}
            onBookNow={requestBooking}
          />
        )}

        {view === 'seats' && selectedShow && (
          <SeatSelectionPage
            show={selectedShow}
            seats={availableSeats}
            selectedSeats={selectedSeats}
            loading={loadingSeats}
            bookingBusy={bookingBusy}
            onToggleSeat={id => setSelectedSeats(prev =>
              prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            )}
            onBack={() => setView('detail')}
            onConfirm={confirmBooking}
          />
        )}

        {view === 'confirm' && lastBooking && (
          <ConfirmationPage
            booking={lastBooking}
            onViewBookings={async () => { await loadBookings(); setView('bookings') }}
            onHome={goHome}
          />
        )}

        {view === 'bookings' && (
          <BookingsPage
            bookings={bookings}
            onBack={goHome}
            onCancel={cancelBooking}
          />
        )}
      </main>

      {/* ── Auth Overlay ── */}
      {showAuth && (
        <AuthOverlay
          mode={showAuth}
          onModeChange={setShowAuth}
          onLoginSuccess={handleLoginSuccess}
          onClose={() => { setShowAuth(null); pendingShow.current = null }}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="toast" role="status">
          {toast.ok
            ? <Check size={15} style={{ color: 'var(--success)' }} />
            : <X    size={15} style={{ color: 'var(--danger)'  }} />
          }
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Header
// ═══════════════════════════════════════════════════════════════════
function AppHeader({
  theme, user, search, onSearch, onThemeToggle,
  onHome, onBookings, onLogin, onLogout,
}: {
  theme: Theme; user: AppUser | null; search: string
  onSearch: (v: string) => void; onThemeToggle: () => void
  onHome: () => void; onBookings: () => void
  onLogin: () => void; onLogout: () => void
}) {
  return (
    <header className="app-header">
      <button className="brand-btn" onClick={onHome} aria-label="Go home">
        <span className="brand-icon"><Clapperboard size={18} /></span>
        <span className="brand-name">Cine<em>Stage</em></span>
      </button>

      <div className="header-search" role="search">
        <Search size={15} />
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search movies…"
          aria-label="Search movies"
        />
        {search && (
          <button onClick={() => onSearch('')} aria-label="Clear search">
            <X size={14} />
          </button>
        )}
      </div>

      <nav className="header-nav">
        <a href="/admin" className="nav-link">Admin</a>

        {user && (
          <button className="nav-link" onClick={onBookings}>My Bookings</button>
        )}

        <button
          className="icon-btn"
          onClick={onThemeToggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="profile-chip">
              <UserRound size={15} />
              {user.name.split(' ')[0]}
            </span>
            <button className="icon-btn" onClick={onLogout} title="Sign out" aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button className="btn-primary sm" onClick={onLogin}>Sign in</button>
        )}
      </nav>
    </header>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Home Page
// ═══════════════════════════════════════════════════════════════════
function HomePage({
  cities, cityId, currentCity, movies, genres, genreFilter,
  languages, languageFilter,
  theatres, shows, loading, selectedDate,
  onCityChange, onDateChange, onGenreFilter, onLanguageFilter, onMovieClick, onBookNow,
}: {
  cities: City[]; cityId: number | null; currentCity?: City
  movies: Movie[]; genres: string[]; genreFilter: string
  languages: string[]; languageFilter: string
  theatres: Theatre[]; shows: Show[]; loading: boolean; selectedDate: string
  onCityChange: (id: number) => void; onDateChange: (d: string) => void
  onGenreFilter: (g: string) => void; onLanguageFilter: (l: string) => void
  onMovieClick: (m: Movie) => void
  onBookNow: (s: Show) => void
}) {
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div>
          <span className="eyebrow">Your city. Your cinema.</span>
          <h1>
            Find the seat<br />
            <em>worth leaving home for.</em>
          </h1>
          <p className="hero-subtitle">
            Browse what's playing near you, compare theatres, and make the night yours.
          </p>
        </div>
        <CityPicker
          cities={cities}
          cityId={cityId}
          onChange={onCityChange}
          label="Watching in"
        />
      </section>

      {/* Date strip */}
      <DateStrip selectedDate={selectedDate} onChange={onDateChange} />

      {/* Now Showing */}
      <section className="section">
        <div className="section-header">
          <div>
            <span className="eyebrow">
              {currentCity ? `Playing in ${currentCity.name}` : 'Choose a city above'}
            </span>
            <h2>Now Showing</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <div className="filter-bar" role="group" aria-label="Genre filters">
              {genres.map(g => (
                <button
                  key={g}
                  className={`filter-pill${genreFilter === g ? ' active' : ''}`}
                  onClick={() => onGenreFilter(g)}
                  aria-pressed={genreFilter === g}
                >
                  {g}
                </button>
              ))}
            </div>
            {languages.length > 1 && (
              <div className="filter-bar" role="group" aria-label="Language filters">
                {languages.map(l => (
                  <button
                    key={l}
                    className={`filter-pill${languageFilter === l ? ' active' : ''}`}
                    onClick={() => onLanguageFilter(l)}
                    aria-pressed={languageFilter === l}
                  >
                    {l === 'All' ? 'All languages' : l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-shimmer">Loading showtimes…</div>
        ) : shows.length ? (
          <div className="movie-grid">
            {groupShowsByMovie(shows).map(({ movie, shows: mShows }) => (
              <MovieShowCard
                key={movie.id}
                movie={movie}
                shows={mShows}
                onMovieClick={() => onMovieClick(movie)}
                onBookNow={() => onBookNow(mShows[0])}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No shows available</strong>
            {currentCity
              ? `No shows currently scheduled in ${currentCity.name} on this date. Try a different city or date.`
              : 'Select a city to see showtimes.'}
          </div>
        )}
      </section>

      {/* All movies */}
      <section className="section">
        <div className="section-header">
          <div>
            <span className="eyebrow">Full catalogue</span>
            <h2>All Movies</h2>
          </div>
        </div>
        {movies.length ? (
          <div className="movie-grid">
            {movies.map(m => (
              <MovieCard key={m.id} movie={m} onClick={() => onMovieClick(m)} />
            ))}
          </div>
        ) : (
          <div className="loading-shimmer">Loading movies…</div>
        )}
      </section>

      {/* Theatres */}
      {theatres.length > 0 && (
        <section className="section">
          <div className="section-header">
            <div>
              <span className="eyebrow">Local screens</span>
              <h2>Theatres in {currentCity?.name ?? 'your city'}</h2>
            </div>
          </div>
          <div className="theatre-grid">
            {theatres.map(t => (
              <div className="theatre-card" key={t.id}>
                <div className="theatre-icon"><MapPin size={18} /></div>
                <div>
                  <h3>{t.name}</h3>
                  <p>{t.address ?? 'Cinema location'}</p>
                  <span className="theatre-shows-badge">
                    {shows.filter(s => s.screen?.theatre?.id === t.id).length} shows today
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Date Strip
// ═══════════════════════════════════════════════════════════════════
function DateStrip({ selectedDate, onChange }: { selectedDate: string; onChange: (d: string) => void }) {
  // Build the 7-day strip anchored to the schedule start date ("Today").
  // Slot 0 → "Today"     (anchor date, e.g. 2026-09-23 Wednesday)
  // Slot 1 → "Tomorrow"  (anchor + 1 day)
  // Slots 2-6 → full weekday name of the corresponding date
  const days = useMemo(() => {
    const anchor = getScheduleAnchor()
    return Array.from({ length: 7 }, (_, i) => {
      const isoDate = addDays(anchor, i)
      const label =
        i === 0 ? 'Today' :
        i === 1 ? 'Tomorrow' :
        weekdayName(isoDate)          // e.g. "Friday", "Saturday" …
      return { label, value: isoDate }
    })
  }, []) // anchor is constant per page-load — no deps needed

  return (
    <div style={{ marginTop: 24, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} role="group" aria-label="Select date">
      {days.map(d => (
        <button
          key={d.value}
          className={`filter-pill${selectedDate === d.value ? ' active' : ''}`}
          onClick={() => onChange(d.value)}
          aria-pressed={selectedDate === d.value}
        >
          {d.label}
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Group shows by movie (deduplicate home grid)
// ═══════════════════════════════════════════════════════════════════
function groupShowsByMovie(shows: Show[]): { movie: Movie; shows: Show[] }[] {
  const map = new Map<number, { movie: Movie; shows: Show[] }>()
  for (const s of shows) {
    if (!s.movie) continue
    const key = s.movie.id
    if (!map.has(key)) map.set(key, { movie: s.movie, shows: [] })
    map.get(key)!.shows.push(s)
  }
  return Array.from(map.values())
}

// ═══════════════════════════════════════════════════════════════════
// Movie+Show card — one card per movie, shows all available times
// ═══════════════════════════════════════════════════════════════════
function MovieShowCard({
  movie, shows, onMovieClick, onBookNow,
}: {
  movie: Movie; shows: Show[]; onMovieClick: () => void; onBookNow: (s: Show) => void
}) {
  // pick the earliest show as the primary
  const primary = shows[0]
  // collect unique theatres
  const theatreNames = Array.from(new Set(shows.map(s => s.screen?.theatre?.name).filter(Boolean))) as string[]

  return (
    <article className="movie-card">
      <div
        className="poster-wrap"
        onClick={onMovieClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onMovieClick()}
        aria-label={`View details for ${movie.title}`}
      >
        <img src={movie.posterUrl || FALLBACK} alt={movie.title} loading="lazy" />
        {movie.rating != null && (
          <span className="poster-rating">★ {movie.rating.toFixed(1)}</span>
        )}
        <div className="poster-overlay">
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>View details →</span>
        </div>
      </div>

      <div className="movie-card-body">
        <div className="movie-title" title={movie.title}>{movie.title}</div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '6px 0 10px' }}>
          {movie.genre && <span className="badge">{movie.genre}</span>}
          {movie.language && (
            <span className="badge" style={{ background: 'var(--surface-strong)', color: 'var(--text-secondary)' }}>
              {movie.language}
            </span>
          )}
        </div>

        {/* Theatres */}
        {theatreNames.length > 0 && (
          <div className="movie-meta">
            <MapPin size={13} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {theatreNames.slice(0, 2).join(', ')}
              {theatreNames.length > 2 && ` +${theatreNames.length - 2} more`}
            </span>
          </div>
        )}

        {/* Showtime pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, margin: '10px 0 14px' }}>
          {shows.slice(0, 4).map(s => (
            <button
              key={s.id}
              onClick={() => onBookNow(s)}
              style={{
                padding: '4px 9px',
                borderRadius: 6,
                border: '1px solid var(--accent)',
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {fmtTime(s.startTime)}
            </button>
          ))}
          {shows.length > 4 && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
              +{shows.length - 4} more
            </span>
          )}
        </div>

        <button className="btn-primary full" onClick={() => onBookNow(primary)}>
          <Ticket size={14} /> Book Now
        </button>
      </div>
    </article>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Show Card — kept for internal use (no longer used on home grid)
// ═══════════════════════════════════════════════════════════════════
function ShowCard({ show, onMovieClick, onBookNow }: { show: Show; onMovieClick: () => void; onBookNow: () => void }) {
  const m = show.movie
  return (
    <article className="movie-card">
      <div className="poster-wrap" onClick={onMovieClick} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onMovieClick()}
        aria-label={`View details for ${m?.title}`}
      >
        <img src={m?.posterUrl || FALLBACK} alt={m?.title ?? 'Movie poster'} loading="lazy" />
        {m?.rating && <span className="poster-rating">★ {m.rating.toFixed(1)}</span>}
        <div className="poster-overlay">
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>View details →</span>
        </div>
      </div>
      <div className="movie-card-body">
        <div className="movie-title" title={m?.title}>{m?.title ?? 'Untitled'}</div>
        {m?.genre && <span className="badge">{m.genre}</span>}
        <div className="movie-meta" style={{ marginTop: 10 }}>
          <MapPin size={13} /> {show.screen?.theatre?.name ?? 'Theatre'}
        </div>
        <div className="movie-meta">
          <Clock3 size={13} /> {fmtTime(show.startTime)}
          <span style={{ marginLeft: 8, fontWeight: 700, color: 'var(--accent)' }}>{fmtPrice(show.ticketPrice)}</span>
        </div>
        <button className="btn-primary full" style={{ marginTop: 14 }} onClick={onBookNow}>
          <Ticket size={14} /> Book Now
        </button>
      </div>
    </article>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Movie Card (catalogue grid — no show context)
// ═══════════════════════════════════════════════════════════════════
function MovieCard({ movie, onClick }: { movie: Movie; onClick: () => void }) {
  return (
    <article className="movie-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      style={{ cursor: 'pointer' }}
    >
      <div className="poster-wrap">
        <img src={movie.posterUrl || FALLBACK} alt={movie.title} loading="lazy" />
        {movie.rating && <span className="poster-rating">★ {movie.rating.toFixed(1)}</span>}
        <div className="poster-overlay">
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>See showtimes →</span>
        </div>
      </div>
      <div className="movie-card-body">
        <div className="movie-title" title={movie.title}>{movie.title}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '6px 0' }}>
          {movie.genre    && <span className="badge">{movie.genre}</span>}
          {movie.language && <span className="badge" style={{ background: 'var(--surface-strong)', color: 'var(--text-secondary)' }}>{movie.language}</span>}
        </div>
        {movie.durationMinutes && (
          <div className="movie-meta"><Clock3 size={13} />{fmtDuration(movie.durationMinutes)}</div>
        )}
      </div>
    </article>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Movie Detail Page
// ═══════════════════════════════════════════════════════════════════
function MovieDetailPage({
  movie, cities, cityId, currentCity, shows, loading, selectedDate,
  onCityChange, onDateChange, onBack, onBookNow,
}: {
  movie: Movie; cities: City[]; cityId: number | null; currentCity?: City
  shows: Show[]; loading: boolean; selectedDate: string
  onCityChange: (id: number) => void; onDateChange: (d: string) => void
  onBack: () => void; onBookNow: (s: Show) => void
}) {
  // Group shows by theatre
  const byTheatre = useMemo(() => {
    const map = new Map<number, { theatre: Theatre; shows: Show[] }>()
    for (const s of shows) {
      const t = s.screen?.theatre
      if (!t) continue
      if (!map.has(t.id)) map.set(t.id, { theatre: t, shows: [] })
      map.get(t.id)!.shows.push(s)
    }
    return Array.from(map.values())
  }, [shows])

  return (
    <>
      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={16} /> Back to browsing
      </button>

      <section className="detail-hero">
        <img
          className="detail-poster"
          src={movie.posterUrl || FALLBACK}
          alt={movie.title}
        />
        <div>
          <span className="eyebrow">{movie.genre ?? 'Feature'}</span>
          <h1>{movie.title}</h1>

          <div className="detail-tags">
            {movie.language && <span className="badge">{movie.language}</span>}
            {movie.genre    && <span className="badge">{movie.genre}</span>}
            {movie.rating   && (
              <span className="badge" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
                ★ {movie.rating.toFixed(1)}
              </span>
            )}
          </div>

          {movie.description && (
            <p className="detail-desc">{movie.description}</p>
          )}

          <div className="detail-stats">
            {movie.durationMinutes && (
              <span className="stat-item"><Clock3 size={15} />{fmtDuration(movie.durationMinutes)}</span>
            )}
            {movie.releaseDate && (
              <span className="stat-item"><Film size={15} />Released {movie.releaseDate}</span>
            )}
          </div>

          <CityPicker
            cities={cities}
            cityId={cityId}
            onChange={onCityChange}
            label="Showtimes in"
            inline
          />
        </div>
      </section>

      {/* Date strip */}
      <DateStrip selectedDate={selectedDate} onChange={onDateChange} />

      {/* Showtimes */}
      <section className="section">
        <div className="section-header">
          <div>
            <span className="eyebrow">{currentCity?.name ?? 'All cities'}</span>
            <h2>Theatre Showtimes</h2>
          </div>
        </div>

        {loading ? (
          <div className="loading-shimmer">Loading showtimes…</div>
        ) : byTheatre.length ? (
          <div className="showtime-list">
            {byTheatre.map(({ theatre, shows: tShows }) => (
              <div key={theatre.id} className="showtime-row">
                <div>
                  <h3>{theatre.name}</h3>
                  <p className="text-muted">{theatre.address ?? 'Cinema location'}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    {tShows.map(s => (
                      <button
                        key={s.id}
                        className="filter-pill"
                        style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                        onClick={() => onBookNow(s)}
                      >
                        {fmtTime(s.startTime)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="showtime-actions">
                  <span className="price-tag">{fmtPrice(tShows[0]?.ticketPrice)}</span>
                  <button className="btn-primary sm" onClick={() => onBookNow(tShows[0])}>
                    <Ticket size={13} /> Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No shows available</strong>
            {currentCity
              ? `No screenings of "${movie.title}" are scheduled in ${currentCity.name} on this date.`
              : 'Select a city above to see showtimes.'}
          </div>
        )}
      </section>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Seat Selection Page  (auth already confirmed before reaching here)
// ═══════════════════════════════════════════════════════════════════
function SeatSelectionPage({
  show, seats, selectedSeats, loading, bookingBusy,
  onToggleSeat, onBack, onConfirm,
}: {
  show: Show; seats: Seat[]; selectedSeats: number[]
  loading: boolean; bookingBusy: boolean
  onToggleSeat: (id: number) => void
  onBack: () => void; onConfirm: () => void
}) {
  // Group by row for display
  const rows = useMemo(() => {
    const map = new Map<string, Seat[]>()
    for (const s of seats) {
      const row = s.row ?? 'A'
      if (!map.has(row)) map.set(row, [])
      map.get(row)!.push(s)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [seats])

  const totalPrice = (show.ticketPrice ?? 0) * selectedSeats.length

  return (
    <div className="seat-page">
      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={16} /> Back to showtimes
      </button>

      <div className="seat-panel">
        <span className="eyebrow">{show.screen?.theatre?.name} · {fmtTime(show.startTime)}</span>
        <h1>Select Seats</h1>
        <p className="text-muted">
          {show.movie?.title} &nbsp;·&nbsp; {fmtPrice(show.ticketPrice)} per seat
        </p>

        <div className="screen-indicator">
          <div className="screen-bar" />
          <p className="screen-label">All eyes this way — Screen</p>
        </div>

        {loading ? (
          <div className="loading-shimmer">Loading seat map…</div>
        ) : seats.length ? (
          <>
            {rows.length > 1 ? (
              // row-labelled layout
              <div style={{ display: 'grid', gap: 8 }}>
                {rows.map(([rowLabel, rowSeats]) => (
                  <div key={rowLabel} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ width: 20, fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>{rowLabel}</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                      {rowSeats.sort((a, b) => (a.column ?? 0) - (b.column ?? 0)).map(s => (
                        <button
                          key={s.id}
                          className={`seat-btn${selectedSeats.includes(s.id) ? ' selected' : ''}`}
                          style={{ minWidth: 40 }}
                          onClick={() => onToggleSeat(s.id)}
                          aria-label={`Seat ${s.seatNumber}`}
                          aria-pressed={selectedSeats.includes(s.id)}
                        >
                          {s.seatNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // flat grid
              <div className="seat-grid">
                {seats.map(s => (
                  <button
                    key={s.id}
                    className={`seat-btn${selectedSeats.includes(s.id) ? ' selected' : ''}`}
                    onClick={() => onToggleSeat(s.id)}
                    aria-label={`Seat ${s.seatNumber}`}
                    aria-pressed={selectedSeats.includes(s.id)}
                  >
                    {s.seatNumber}
                  </button>
                ))}
              </div>
            )}

            <div className="seat-legend">
              <span className="seat-legend-item">
                <span className="legend-dot" style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }} />
                Available
              </span>
              <span className="seat-legend-item">
                <span className="legend-dot" style={{ background: 'var(--accent)' }} />
                Selected
              </span>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <strong>No seats available</strong>
            This show is fully booked. Try another showtime.
          </div>
        )}

        <div className="booking-summary">
          <div>
            <p className="text-muted">{selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected</p>
            {selectedSeats.length > 0 && (
              <p className="booking-total">{fmtPrice(totalPrice)}</p>
            )}
          </div>
          <button
            className="btn-primary"
            disabled={!selectedSeats.length || bookingBusy}
            onClick={onConfirm}
          >
            {bookingBusy ? 'Confirming…' : <><Check size={15} /> Confirm Booking</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Confirmation Screen
// ═══════════════════════════════════════════════════════════════════
function ConfirmationPage({
  booking, onViewBookings, onHome,
}: {
  booking: Booking; onViewBookings: () => void; onHome: () => void
}) {
  return (
    <div style={{ maxWidth: 600, margin: '48px auto 0', textAlign: 'center' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(34,197,94,0.12)', margin: '0 auto 24px',
      }}>
        <Check size={32} style={{ color: 'var(--success)' }} />
      </div>
      <span className="eyebrow">You're all set</span>
      <h1 style={{ fontSize: 'clamp(36px,6vw,60px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '10px 0 16px' }}>
        Booking Confirmed
      </h1>

      <div style={{
        padding: '24px 28px', borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)', background: 'var(--surface)',
        textAlign: 'left', marginBottom: 28,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <span className="text-muted">Booking #{booking.id}</span>
          <span className="status-chip confirmed">Confirmed</span>
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          {booking.show?.movie?.title ?? 'Movie'}
        </h3>
        <div className="movie-meta" style={{ marginBottom: 6 }}>
          <MapPin size={13} /> {booking.show?.screen?.theatre?.name ?? 'Theatre'}
        </div>
        <div className="movie-meta" style={{ marginBottom: 16 }}>
          <Clock3 size={13} /> {fmtTime(booking.show?.startTime)} · {booking.show?.showDate}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <span className="text-muted">Seats: {(booking.bookedSeats ?? []).map(s => s.seatNumber).join(', ')}</span>
          <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 18 }}>{fmtPrice(booking.totalPrice)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="btn-ghost" onClick={onHome}>Browse more movies</button>
        <button className="btn-primary" onClick={onViewBookings}>
          <Ticket size={14} /> My Bookings
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// My Bookings Page
// ═══════════════════════════════════════════════════════════════════
function BookingsPage({
  bookings, onBack, onCancel,
}: {
  bookings: Booking[]; onBack: () => void; onCancel: (id: number) => void
}) {
  const confirmed = bookings.filter(b => b.status !== 'CANCELLED')
  const cancelled = bookings.filter(b => b.status === 'CANCELLED')

  return (
    <>
      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={16} /> Browse movies
      </button>

      <section className="section" style={{ marginTop: 16 }}>
        <span className="eyebrow">Your tickets</span>
        <h1 style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '10px 0 28px' }}>
          My Bookings
        </h1>

        {!bookings.length ? (
          <div className="empty-state">
            <strong>No bookings yet</strong>
            Find a movie and book your first seat!
          </div>
        ) : (
          <>
            {confirmed.length > 0 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>Upcoming</h3>
                <div className="bookings-list" style={{ marginBottom: 32 }}>
                  {confirmed.map(b => <BookingCard key={b.id} booking={b} onCancel={onCancel} />)}
                </div>
              </>
            )}
            {cancelled.length > 0 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>Cancelled</h3>
                <div className="bookings-list">
                  {cancelled.map(b => <BookingCard key={b.id} booking={b} onCancel={onCancel} />)}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </>
  )
}

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel: (id: number) => void }) {
  const isCancelled = booking.status === 'CANCELLED'
  return (
    <article className="booking-card">
      <div>
        <h3>{booking.show?.movie?.title ?? 'Movie booking'}</h3>
        <div className="movie-meta">
          <MapPin size={13} /> {booking.show?.screen?.theatre?.name ?? 'Theatre'}
        </div>
        <div className="movie-meta">
          <Clock3 size={13} /> {fmtTime(booking.show?.startTime)} · {booking.show?.showDate}
        </div>
        <p className="text-tiny" style={{ marginTop: 8 }}>
          Seats: {(booking.bookedSeats ?? []).map(s => s.seatNumber).join(', ') || '—'}
        </p>
      </div>
      <div className="booking-side">
        <span className={`status-chip ${isCancelled ? 'cancelled' : 'confirmed'}`}>
          {booking.status ?? 'CONFIRMED'}
        </span>
        <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 18 }}>{fmtPrice(booking.totalPrice)}</span>
        {!isCancelled && (
          <button className="btn-danger" onClick={() => onCancel(booking.id)}>
            Cancel
          </button>
        )}
      </div>
    </article>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Auth Overlay (modal)
// ═══════════════════════════════════════════════════════════════════
function AuthOverlay({
  mode, onModeChange, onLoginSuccess, onClose,
}: {
  mode: 'login' | 'register'
  onModeChange: (m: 'login' | 'register') => void
  onLoginSuccess: (user: AppUser) => void
  onClose: () => void
}) {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [pw,      setPw]      = useState('')
  const [phone,   setPhone]   = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [regOk,   setRegOk]   = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const res = await apiFetch<AppUser & { password?: string }>('/users/login', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim().toLowerCase(), password: pw }),
        })
        onLoginSuccess({ id: Number(res.id), name: res.name, email: res.email })
      } else {
        await apiFetch('/users/register', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password: pw, phoneNumber: phone.trim() }),
        })
        setRegOk(true)
        onModeChange('login')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'grid', placeItems: 'center',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'login' ? 'Sign in' : 'Create account'}
    >
      <div style={{
        width: '100%', maxWidth: 440,
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: 'clamp(24px, 5vw, 44px)',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
      }}>
        <button
          style={{ position: 'absolute', top: 16, right: 16, color: 'var(--text-secondary)' }}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <span className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Create account'}</span>
        <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', margin: '8px 0 24px' }}>
          {mode === 'login' ? 'Sign in to continue' : 'Join CineStage'}
        </h2>

        {regOk && mode === 'login' && (
          <div className="auth-success" style={{ marginBottom: 16 }}>
            Account created — you can sign in now.
          </div>
        )}
        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          {mode === 'register' && (
            <input required className="auth-input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
          )}
          <input required className="auth-input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
          {mode === 'register' && (
            <input required className="auth-input" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
          )}
          <input required className="auth-input" type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} />

          <button className="btn-primary full" type="submit" disabled={loading} style={{ marginTop: 4, height: 50, fontSize: 15 }}>
            {loading
              ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
              : (mode === 'login' ? 'Sign in' : 'Create account')
            }
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
          {mode === 'login' ? (
            <>New here?{' '}
              <button style={{ color: 'var(--accent)', fontWeight: 700 }} onClick={() => { onModeChange('register'); setError('') }}>
                Create an account
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button style={{ color: 'var(--accent)', fontWeight: 700 }} onClick={() => { onModeChange('login'); setError('') }}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
