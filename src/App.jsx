
import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen, LayoutDashboard, Plus, Search, Clock3,
  CalendarDays, Trash2, Pencil, CheckCircle2,
  TrendingUp, X, GraduationCap, LogOut
} from 'lucide-react'
import { supabase } from './supabase'

import {
  getSessions,
  addSession,
  updateSession,
  deleteSession as removeSession,
  changeSessionStatus
} from './sessionService'

const emptyForm = {
  subject: '',
  date: new Date().toLocaleDateString('en-CA'),
  duration: 30,
  status: 'Planned'
}

function toSession(row) {
  return {
    id: row.id,
    subject: row.subject,
    date: row.session_date,
    duration: row.duration,
    status: row.status
  }
}

function App() {
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [dbError, setDbError] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadSessions() {
      try {
        const data = await getSessions()
        if (active) {
          setSessions(data.map(toSession))
          setDbError('')
        }
      } catch (err) {
        if (active) setDbError(err.message)
      } finally {
        if (active) setLoadingSessions(false)
      }
    }

    loadSessions()
    return () => { active = false }
  }, [])

  const stats = useMemo(() => {
    const completed = sessions.filter(s => s.status === 'Completed')
    const minutes = completed.reduce((sum, s) => sum + Number(s.duration), 0)
    return {
      total: sessions.length,
      completed: completed.length,
      hours: (minutes / 60).toFixed(1),
      progress: sessions.length
        ? Math.round((completed.length / sessions.length) * 100)
        : 0
    }
  }, [sessions])

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.subject.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'All' || session.status === filter
    return matchesSearch && matchesFilter
  })

  function openAdd() {
    setEditingId(null)
    setForm({ ...emptyForm })
    setError('')
    setShowModal(true)
  }

  function openEdit(session) {
    setEditingId(session.id)
    setForm({
      subject: session.subject,
      date: session.date,
      duration: session.duration,
      status: session.status
    })
    setError('')
    setShowModal(true)
  }

  async function saveSession(event) {
    event.preventDefault()
    if (saving) return
    setError('')

    const duration = Number(form.duration)
    if (!form.subject.trim()) {
      setError('Please enter a subject.')
      return
    }
    if (!form.date || !Number.isInteger(duration) || duration < 1 || duration > 1440) {
      setError('Please enter a valid date and duration (1–1440 minutes).')
      return
    }

    const sessionData = {
      subject: form.subject.trim(),
      date: form.date,
      duration,
      status: form.status
    }

    setSaving(true)
    try {
      const result = editingId !== null
        ? await updateSession(editingId, sessionData)
        : await addSession(sessionData)
      const updated = toSession(result)
      setSessions(previous => editingId !== null
        ? previous.map(s => s.id === editingId ? updated : s)
        : [updated, ...previous]
      )
      setDbError('')
      setShowModal(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteSession(id) {
    if (!window.confirm('Are you sure you want to delete this session?')) return
    try {
      await removeSession(id)
      setSessions(previous => previous.filter(s => s.id !== id))
      setDbError('')
    } catch (err) {
      setDbError(err.message)
    }
  }

  async function toggleStatus(id) {
    const current = sessions.find(s => s.id === id)
    if (!current) return
    const newStatus = current.status === 'Completed' ? 'Planned' : 'Completed'
    try {
      const updated = await changeSessionStatus(id, newStatus)
      setSessions(previous => previous.map(s => s.id === id ? toSession(updated) : s))
      setDbError('')
    } catch (err) {
      setDbError(err.message)
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) setDbError(error.message)
  }

  const cards = [
    { title: 'Total Sessions', value: stats.total, icon: BookOpen, color: 'bg-violet-100 text-violet-600' },
    { title: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
    { title: 'Hours Studied', value: stats.hours, icon: Clock3, color: 'bg-blue-100 text-blue-600' },
    { title: 'Completion Rate', value: `${stats.progress}%`, icon: TrendingUp, color: 'bg-orange-100 text-orange-600' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col bg-slate-950 p-6 text-white md:flex">
          <div className="flex items-center gap-3 text-xl font-bold">
            <div className="rounded-xl bg-violet-600 p-2">
              <GraduationCap size={24} />
            </div>
            StudyFlow
          </div>

          <div className="mt-12 flex items-center gap-3 rounded-xl bg-violet-600/20 px-4 py-3 text-violet-200">
            <LayoutDashboard size={20} />
            Dashboard
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-auto mb-4 flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <LogOut size={20} />
            Logout
          </button>
          <div className="rounded-2xl bg-slate-800 p-4">
            <p className="font-semibold">Keep learning!</p>
            <p className="mt-2 text-sm text-slate-400">
              Small steps lead to big progress.
            </p>
          </div>
        </aside>

        <main className="mx-auto w-full max-w-7xl flex-1 p-5 md:p-10">
          {loadingSessions && (
            <p role="status" className="mb-4 text-sm text-violet-600">Loading your sessions...</p>
          )}
          {dbError && (
            <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{dbError}</p>
          )}
          <header className="mb-9 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-violet-600">
                YOUR STUDY WORKSPACE
              </p>
              <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                Study Dashboard
              </h1>
              <p className="mt-2 text-slate-500">
                Organize your sessions and track your progress.
              </p>
            </div>

            <button
              onClick={openAdd}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
            >
              <Plus size={19} />
              New Session
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 md:hidden"
            >
              <LogOut size={18} />
              Logout
            </button>
          </header>

          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(card => {
              const Icon = card.icon
              return (
                <div key={card.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}>
                    <Icon size={23} />
                  </div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <p className="mt-2 text-3xl font-bold">{card.value}</p>
                </div>
              )
            })}
          </section>

          <section className="mb-8 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-7 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Your Progress</h2>
                <p className="mt-1 text-sm text-violet-100">
                  Every completed session counts.
                </p>
              </div>
              <span className="text-3xl font-bold">{stats.progress}%</span>
            </div>
            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <h2 className="text-xl font-bold">Study Sessions</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage your learning schedule.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
                  <Search size={18} className="text-slate-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search subjects..."
                    aria-label="Search subjects"
                    className="w-40 py-3 outline-none sm:w-48"
                  />
                </div>

                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  aria-label="Filter by status"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none"
                >
                  <option>All</option>
                  <option>Planned</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>

            {!loadingSessions && filteredSessions.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <BookOpen size={40} className="mx-auto text-slate-300" />
                <h3 className="mt-4 font-semibold">No sessions found</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Add a session or try changing your filters.
                </p>
                <button onClick={openAdd} className="mt-5 font-semibold text-violet-600">
                  + Add session
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left">
                  <thead className="bg-slate-50 text-sm text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Subject</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Duration</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map(session => (
                      <tr key={session.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-5 font-semibold">{session.subject}</td>
                        <td className="px-6 py-5 text-slate-500">
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays size={16} />
                            {session.date}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-slate-500">{session.duration} min</td>
                        <td className="px-6 py-5">
                          <button
                            onClick={() => toggleStatus(session.id)}
                            title="Click to change status"
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              session.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {session.status}
                          </button>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => openEdit(session)}
                              aria-label={`Edit ${session.subject}`}
                              className="text-slate-500 hover:text-violet-600"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => deleteSession(session.id)}
                              aria-label={`Delete ${session.subject}`}
                              className="text-slate-500 hover:text-red-600"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <footer className="mt-8 text-center text-sm text-slate-400">
            StudyFlow — Built with React and Tailwind CSS
          </footer>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-dialog-title"
            className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 id="session-dialog-title" className="text-xl font-bold">
                {editingId !== null ? 'Edit Session' : 'New Study Session'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Close dialog"
                className="text-slate-400 hover:text-slate-800"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={saveSession} className="space-y-4">
              <div>
                <label htmlFor="subject" className="mb-2 block text-sm font-medium">
                  Subject
                </label>
                <input
                  id="subject"
                  required
                  maxLength={100}
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. React Practice"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label htmlFor="date" className="mb-2 block text-sm font-medium">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  required
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label htmlFor="duration" className="mb-2 block text-sm font-medium">
                  Duration (minutes)
                </label>
                <input
                  id="duration"
                  type="number"
                  min="1"
                  max="1440"
                  required
                  value={form.duration}
                  onChange={e => setForm({ ...form, duration: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label htmlFor="status" className="mb-2 block text-sm font-medium">
                  Status
                </label>
                <select
                  id="status"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <option>Planned</option>
                  <option>Completed</option>
                </select>
              </div>

              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId !== null ? 'Save Changes' : 'Create Session'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
