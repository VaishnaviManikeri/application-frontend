import { useEffect, useMemo, useState } from 'react'
import {
  clearTokens,
  createApplication,
  deleteApplication,
  getApplications,
  getCurrentUser,
  hasSession,
  loginAccount,
  logoutAccount,
  registerAccount,
  updateApplication,
} from './api.js'
import './App.css'

const navigation = [
  { label: 'Overview', items: [{ label: 'Dashboard', icon: 'grid' }, { label: 'Applications', icon: 'briefcase', count: '12' }, { label: 'Follow-ups', icon: 'calendar', count: '3' }] },
  { label: 'Workspace', items: [{ label: 'Companies', icon: 'building' }, { label: 'Interview prep', icon: 'book' }, { label: 'Statistics', icon: 'chart' }] },
  { label: 'Personal', items: [{ label: 'Settings', icon: 'settings' }] },
]

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18M8 15h.01M12 15h.01M16 15h.01" /></>,
    building: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 21v-4h6v4M8 7h1M15 7h1M8 11h1M15 11h1" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
    chart: <><path d="M3 3v18h18M8 15l4-4 4 3 5-7" /><path d="M17 7h4v4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1L15.8 21h-2.8l-.3-1.9a8 8 0 0 1-1.8-.7l-1.6.8-1.7-2.3L9 15.6a8 8 0 0 1-.1-2l-1.5-1.1 1.3-2.5 1.8.5a8 8 0 0 1 1.7-1L12.5 7h2.8l.3 1.9a8 8 0 0 1 1.8.7l1.6-.8 1.7 2.3-1.4 1.3a8 8 0 0 1 .1 2.6Z" transform="translate(-1 -2)" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    down: <path d="m7 10 5 5 5-5" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    check: <path d="m5 12 4 4L19 6" />,
    filter: <><path d="M4 7h16M7 12h10M10 17h4" /></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function BrandMark({ color, mark }) {
  return <span className={`company-mark mark-${color}`}>{mark}</span>
}

function StatusBadge({ status }) {
  const key = status.toLowerCase().replaceAll(' ', '-')
  return <span className={`status-badge status-${key}`}><span />{status}</span>
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatMemberDate(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function AuthScreen({ onAuthenticated }) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const form = new FormData(event.currentTarget)
    const credentials = {
      name: form.get('name')?.trim(),
      email: form.get('email')?.trim(),
      password: form.get('password'),
    }
    try {
      const user = isRegistering
        ? await registerAccount(credentials)
        : await loginAccount(credentials)
      onAuthenticated(user)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="brand auth-brand" href="#" onClick={(event) => event.preventDefault()}>
          <span className="brand-symbol"><span /><span /><span /></span>
          <span>jobtrack<span className="brand-period">.</span></span>
        </a>
        <div className="auth-intro">
          <span className="eyebrow">{isRegistering ? 'YOUR NEXT CHAPTER STARTS HERE' : 'WELCOME BACK'}</span>
          <h1>{isRegistering ? 'Create your account' : 'Sign in to JobTrack'}</h1>
          <p>{isRegistering ? 'A calmer, clearer way to keep your job search moving.' : 'Pick up where you left off on your job search.'}</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegistering && <label className="form-field">Your name<input name="name" type="text" autoComplete="name" placeholder="Alex Morgan" maxLength="150" required /></label>}
          <label className="form-field">Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength="254" required /></label>
          <label className="form-field">Password<input name="password" type="password" autoComplete={isRegistering ? 'new-password' : 'current-password'} placeholder={isRegistering ? 'At least 8 characters' : 'Enter your password'} minLength={isRegistering ? 8 : undefined} required /></label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="primary-button auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : isRegistering ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <p className="auth-switch">
          {isRegistering ? 'Already have an account?' : 'New to JobTrack?'}
          <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError('') }}>
            {isRegistering ? 'Sign in' : 'Create an account'}
          </button>
        </p>
        <div className="auth-privacy">Your job search details are private to your account.</div>
      </section>
      <div className="auth-side-note"><span>✳</span><p>Every small step<br />moves you forward.</p></div>
    </main>
  )
}

function App() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activePage, setActivePage] = useState('Dashboard')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [menuId, setMenuId] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    if (!hasSession()) {
      setAuthLoading(false)
      return () => { active = false }
    }
    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch(() => {
        clearTokens()
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setAuthLoading(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    function onSessionExpired() {
      setUser(null)
      setApplications([])
    }
    window.addEventListener('jobtrack:session-expired', onSessionExpired)
    return () => window.removeEventListener('jobtrack:session-expired', onSessionExpired)
  }, [])

  useEffect(() => {
    let active = true
    if (!user) {
      setApplications([])
      setLoading(false)
      return () => { active = false }
    }
    setLoading(true)
    getApplications()
      .then((data) => {
        if (active) {
          setApplications(data)
          setApiError('')
        }
      })
      .catch((error) => {
        if (active) setApiError(error.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [user])

  async function refreshApplications() {
    setLoading(true)
    try {
      setApplications(await getApplications())
      setApiError('')
    } catch (error) {
      setApiError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredApplications = useMemo(() => applications.filter((application) => {
    const matchesSearch = `${application.company} ${application.position} ${application.email}`.toLowerCase().includes(search.toLowerCase())
    return matchesSearch && (statusFilter === 'All statuses' || application.status === statusFilter)
  }), [applications, search, statusFilter])

  const counts = useMemo(() => ({
    total: applications.length,
    interviews: applications.filter((item) => item.status === 'Interview').length,
    offers: applications.filter((item) => item.status === 'Offer').length,
    response: applications.length ? Math.round((applications.filter((item) => ['Interview', 'Offer', 'Rejected'].includes(item.status)).length / applications.length) * 100) : 0,
  }), [applications])

  const dueFollowUps = applications.filter((item) => item.followUp && !['Rejected', 'Offer', 'Withdrawn'].includes(item.status)).slice(0, 3)

  function showToast(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  function openNewApplication() {
    setEditing(null)
    setModalOpen(true)
  }

  async function saveApplication(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const company = form.get('company').trim()
    const item = {
      company,
      position: form.get('position').trim(),
      email: form.get('email').trim(),
      date: form.get('date'),
      status: form.get('status'),
      source: form.get('source'),
      followUp: form.get('followUp') || null,
      jobUrl: form.get('jobUrl').trim(),
      resume: form.get('resume').trim(),
      salary: form.get('salary').trim(),
      companyUrl: form.get('companyUrl').trim(),
      recruiterName: form.get('recruiterName').trim(),
      recruiterLinkedin: form.get('recruiterLinkedin').trim(),
      location: form.get('location').trim(),
      notes: form.get('notes').trim(),
      color: editing?.color ?? ['violet', 'blue', 'green', 'dark'][applications.length % 4],
      mark: editing?.mark ?? company.slice(0, 1).toUpperCase(),
    }
    try {
      const saved = editing
        ? await updateApplication(editing.id, item)
        : await createApplication(item)
      setApplications((current) => editing
        ? current.map((application) => application.id === editing.id ? saved : application)
        : [saved, ...current])
      setApiError('')
      setModalOpen(false)
      showToast(editing ? 'Application updated' : 'Application added')
    } catch (error) {
      setApiError(error.message)
      showToast(`Could not save: ${error.message}`)
    }
  }

  async function removeApplication(application) {
    try {
      await deleteApplication(application.id)
      setApplications((current) => current.filter((item) => item.id !== application.id))
      setApiError('')
      setMenuId(null)
      showToast('Application deleted')
    } catch (error) {
      setApiError(error.message)
      setMenuId(null)
      showToast(`Could not delete: ${error.message}`)
    }
  }

  function signOut() {
    logoutAccount()
    setUser(null)
    setApiError('')
    setActivePage('Dashboard')
  }

  function exportCsv() {
    const columns = ['Company', 'Position', 'Email', 'Application date', 'Status', 'Source', 'Follow-up date', 'Job description URL', 'Resume version', 'Salary expectations', 'Company website', 'Recruiter name', 'Recruiter LinkedIn', 'Location', 'Notes']
    const rows = applications.map((item) => [item.company, item.position, item.email, item.date, item.status, item.source, item.followUp, item.jobUrl, item.resume, item.salary, item.companyUrl, item.recruiterName, item.recruiterLinkedin, item.location, item.notes])
    const csv = [columns, ...rows].map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'jobtrack-applications.csv'
    link.click()
    URL.revokeObjectURL(url)
    showToast('Your applications were exported')
  }

  function renderApplicationsTable() {
    return (
      <div className="table-wrap">
        <table>
          <thead><tr><th>Company</th><th>Applied date</th><th>Status</th><th>Follow-up</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{filteredApplications.map((application) => (
            <tr key={application.id}>
              <td><div className="company-cell"><BrandMark color={application.color} mark={application.mark} /><div><strong>{application.company}</strong><span>{application.position}</span></div></div></td>
              <td className="date-cell">{formatDate(application.date)}</td>
              <td><StatusBadge status={application.status} /></td>
              <td className="date-cell">{application.followUp ? <span className="follow-date"><Icon name="clock" size={14} />{formatDate(application.followUp)}</span> : '—'}</td>
              <td className="action-cell"><button className="icon-button row-menu-button" aria-label={`Actions for ${application.company}`} onClick={() => setMenuId(menuId === application.id ? null : application.id)}><Icon name="dots" size={18} /></button>
                {menuId === application.id && <div className="row-menu"><button onClick={() => { setEditing(application); setModalOpen(true); setMenuId(null) }}>Edit application</button><button className="danger-action" onClick={() => removeApplication(application)}>Delete application</button></div>}
              </td>
            </tr>
          ))}</tbody>
        </table>
        {filteredApplications.length === 0 && <div className="empty-state"><span>No applications found</span><small>Try another search or add a new application.</small></div>}
      </div>
    )
  }

  function pageContent() {
    if (activePage === 'Dashboard') return (
      <>
        <div className="welcome-row"><div><div className="eyebrow">MONDAY, OCTOBER 12, 2026</div><h1>Good morning, {firstName} <span>✳</span></h1><p>Here’s what’s happening with your job search today.</p></div><button className="primary-button" onClick={openNewApplication}><Icon name="plus" size={17} /> Add application</button></div>
        <section className="stats-grid" aria-label="Application statistics">
          <article className="stat-card"><div className="stat-top"><span>Total applications</span><span className="stat-icon purple"><Icon name="briefcase" size={17} /></span></div><div className="stat-number">{counts.total}<span className="trend up"><Icon name="arrow" size={13} /> 18%</span></div><div className="stat-foot">vs. last month</div><div className="spark spark-purple"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></article>
          <article className="stat-card"><div className="stat-top"><span>Interviews</span><span className="stat-icon peach"><Icon name="calendar" size={17} /></span></div><div className="stat-number">{counts.interviews}<span className="trend up"><Icon name="arrow" size={13} /> 2</span></div><div className="stat-foot">scheduled this month</div><div className="spark spark-peach"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></article>
          <article className="stat-card"><div className="stat-top"><span>Offers received</span><span className="stat-icon green"><Icon name="check" size={17} /></span></div><div className="stat-number">{counts.offers}<span className="trend neutral">This is your moment</span></div><div className="stat-foot">you’ve got this ✨</div><div className="spark spark-green"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></article>
          <article className="stat-card"><div className="stat-top"><span>Response rate</span><span className="stat-icon blue"><Icon name="chart" size={17} /></span></div><div className="stat-number">{counts.response}%<span className="trend up"><Icon name="arrow" size={13} /> 6%</span></div><div className="stat-foot">vs. last month</div><div className="spark spark-blue"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></article>
        </section>
        <section className="main-panels">
          <article className="panel progress-panel"><div className="panel-heading"><div><h2>Application progress</h2><p>Your search at a glance</p></div><button className="select-button" onClick={() => setActivePage('Statistics')}>Last 30 days <Icon name="down" size={14} /></button></div><div className="chart-summary"><strong>{applications.length}</strong><span>applications tracked</span><span className="chart-growth"><Icon name="arrow" size={13} /> 12.5%</span></div><div className="chart-area"><div className="y-labels"><span>12</span><span>9</span><span>6</span><span>3</span><span>0</span></div><div className="chart-graph"><div className="grid-lines"><i/><i/><i/><i/><i/></div><svg viewBox="0 0 600 150" preserveAspectRatio="none" role="img" aria-label="Application progress trending upward over six weeks"><defs><linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7367f0" stopOpacity=".18"/><stop offset="100%" stopColor="#7367f0" stopOpacity="0"/></linearGradient></defs><path d="M0 127 C35 120 55 105 90 109 S145 92 180 97 S235 71 270 79 S320 60 360 66 S415 43 450 51 S510 22 540 33 S580 16 600 12 V150 H0Z" fill="url(#areaFill)"/><path d="M0 127 C35 120 55 105 90 109 S145 92 180 97 S235 71 270 79 S320 60 360 66 S415 43 450 51 S510 22 540 33 S580 16 600 12" fill="none" stroke="#7367f0" strokeWidth="3" vectorEffect="non-scaling-stroke"/></svg><div className="x-labels"><span>Sep 14</span><span>Sep 21</span><span>Sep 28</span><span>Oct 5</span><span>Oct 12</span></div></div></div><div className="chart-legend"><span><i className="legend-dot purple-dot"/>Applications</span><span><i className="legend-dot grey-dot"/>Interviews</span><span className="chart-note">You’re on a roll. Keep it up!</span></div></article>
          <article className="panel follow-panel"><div className="panel-heading"><div><h2>Coming up</h2><p>Your next follow-ups</p></div><button className="text-link" onClick={() => setActivePage('Follow-ups')}>See all <Icon name="arrow" size={14} /></button></div><div className="follow-list">{dueFollowUps.length ? dueFollowUps.map((application, index) => <div className="follow-item" key={application.id}><div className={`follow-date-box ${index === 0 ? 'today' : ''}`}><strong>{new Date(`${application.followUp}T12:00:00`).getDate()}</strong><span>{new Date(`${application.followUp}T12:00:00`).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span></div><div className="follow-info"><strong>{application.company}</strong><span>{application.status === 'Interview' ? 'Interview follow-up' : 'Check in with recruiter'}</span></div><button aria-label={`Open ${application.company} application`} onClick={() => { setEditing(application); setModalOpen(true) }} className="follow-arrow"><Icon name="arrow" size={15} /></button></div>) : <div className="empty-follow">All caught up! Add a follow-up date to an application.</div>}</div><button className="reminder-button" onClick={openNewApplication}><Icon name="plus" size={15} /> Schedule a reminder</button></article>
        </section>
        <section className="panel applications-panel"><div className="panel-heading application-heading"><div><h2>Recent applications</h2><p>Keep an eye on your latest opportunities</p></div><button className="text-link" onClick={() => setActivePage('Applications')}>View all <Icon name="arrow" size={14} /></button></div><div className="application-toolbar"><label className="search-field"><Icon name="search" size={17} /><input aria-label="Search applications" placeholder="Search company or role..." value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></label><label className="filter-select"><Icon name="filter" size={16} /><select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option>{['Interested', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'].map((status) => <option key={status}>{status}</option>)}</select><Icon name="down" size={14} /></label><button className="export-button" onClick={exportCsv}><Icon name="file" size={15} /> Export</button></div>{renderApplicationsTable()}</section>
        <footer className="dashboard-footer"><span>Made with a little optimism <span className="heart">♥</span></span><span>Small steps, big things. You’ve got this!</span></footer>
      </>
    )

    if (activePage === 'Applications') return <div className="subpage"><div className="welcome-row"><div><div className="eyebrow">YOUR JOB SEARCH</div><h1>My applications</h1><p>All your opportunities, organized in one place.</p></div><button className="primary-button" onClick={openNewApplication}><Icon name="plus" size={17} /> Add application</button></div><section className="panel applications-panel"><div className="application-toolbar"><label className="search-field"><Icon name="search" size={17} /><input aria-label="Search applications" placeholder="Search company or role..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="filter-select"><Icon name="filter" size={16} /><select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option>{['Interested', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'].map((status) => <option key={status}>{status}</option>)}</select><Icon name="down" size={14} /></label><button className="export-button" onClick={exportCsv}><Icon name="file" size={15} /> Export</button></div>{renderApplicationsTable()}</section></div>

    if (activePage === 'Follow-ups') return <div className="subpage"><div className="welcome-row"><div><div className="eyebrow">STAY ON THEIR RADAR</div><h1>Follow-ups</h1><p>A little follow-through goes a long way.</p></div><button className="primary-button" onClick={openNewApplication}><Icon name="plus" size={17} /> Add reminder</button></div><section className="panel applications-panel follow-page"><div className="panel-heading"><div><h2>Upcoming reminders</h2><p>Follow-ups linked to your applications</p></div></div>{dueFollowUps.length ? dueFollowUps.map((item) => <div className="follow-item follow-page-item" key={item.id}><div className="follow-date-box"><strong>{new Date(`${item.followUp}T12:00:00`).getDate()}</strong><span>{new Date(`${item.followUp}T12:00:00`).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span></div><BrandMark color={item.color} mark={item.mark} /><div className="follow-info"><strong>{item.company} · {item.position}</strong><span>{item.notes || `Follow up with ${item.email || 'recruiter'}`}</span></div><button className="export-button" onClick={() => { setEditing(item); setModalOpen(true) }}>Edit</button></div>) : <div className="empty-state"><span>No upcoming reminders</span><small>Add a follow-up date to any application to see it here.</small></div>}</section></div>

    if (activePage === 'Statistics') return <div className="subpage"><div className="welcome-row"><div><div className="eyebrow">THE BIG PICTURE</div><h1>Your progress</h1><p>Every application is a step closer to your next chapter.</p></div><button className="export-button" onClick={exportCsv}><Icon name="file" size={15} /> Export data</button></div><section className="stats-grid compact-stats"><article className="stat-card"><div className="stat-top"><span>Total applications</span><span className="stat-icon purple"><Icon name="briefcase" size={17} /></span></div><div className="stat-number">{counts.total}</div><div className="stat-foot">opportunities tracked</div></article><article className="stat-card"><div className="stat-top"><span>Interview rate</span><span className="stat-icon peach"><Icon name="calendar" size={17} /></span></div><div className="stat-number">{counts.total ? Math.round(counts.interviews / counts.total * 100) : 0}%</div><div className="stat-foot">applications to interviews</div></article><article className="stat-card"><div className="stat-top"><span>Response rate</span><span className="stat-icon blue"><Icon name="chart" size={17} /></span></div><div className="stat-number">{counts.response}%</div><div className="stat-foot">heard back from a company</div></article><article className="stat-card"><div className="stat-top"><span>Offers received</span><span className="stat-icon green"><Icon name="check" size={17} /></span></div><div className="stat-number">{counts.offers}</div><div className="stat-foot">the exciting part ✨</div></article></section><section className="panel applications-panel"><div className="panel-heading"><div><h2>Applications by status</h2><p>Where things stand right now</p></div></div><div className="status-breakdown">{['Interested', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'].map((status) => { const n = applications.filter((item) => item.status === status).length; return <div className="breakdown-row" key={status}><span>{status}</span><div className="breakdown-track"><i className={`bar-${status.toLowerCase()}`} style={{ width: `${applications.length ? Math.max(n / applications.length * 100, n ? 8 : 0) : 0}%` }} /></div><strong>{n}</strong></div> })}</div></section></div>

    if (activePage === 'Companies') {
      const companies = [...new Map(applications.map((item) => [item.company, item])).values()]
      return <div className="subpage"><div className="welcome-row"><div><div className="eyebrow">YOUR NETWORK</div><h1>Companies & recruiters</h1><p>Every conversation starts somewhere.</p></div><button className="primary-button" onClick={openNewApplication}><Icon name="plus" size={17} /> Add company</button></div><div className="company-grid">{companies.length ? companies.map((item) => <article className="panel company-card" key={item.id}><div className="company-card-top"><BrandMark color={item.color} mark={item.mark} /><StatusBadge status={item.status} /></div><h2>{item.company}</h2><p>{item.position}{item.location ? ` · ${item.location}` : ''}</p>{item.recruiterName && <span className="recruiter-name">{item.recruiterName}</span>}<a href={item.email ? `mailto:${item.email}` : undefined}>{item.email || 'Add a recruiter email'}</a>{item.companyUrl && <a href={item.companyUrl} target="_blank" rel="noreferrer">Company website <Icon name="arrow" size={11} /></a>}{item.recruiterLinkedin && <a href={item.recruiterLinkedin} target="_blank" rel="noreferrer">Recruiter LinkedIn <Icon name="arrow" size={11} /></a>}<div className="company-card-bottom"><span>{item.source}</span><button className="icon-button" aria-label={`Edit ${item.company}`} onClick={() => { setEditing(item); setModalOpen(true) }}><Icon name="dots" /></button></div></article>) : <div className="panel company-empty">Add an application to start building your company list.</div>}</div></div>
    }

    if (activePage === 'Interview prep') return <div className="subpage"><div className="welcome-row"><div><div className="eyebrow">FEEL READY, BE READY</div><h1>Interview prep</h1><p>Your notes and next steps, all in one place.</p></div><button className="primary-button" onClick={openNewApplication}><Icon name="plus" size={17} /> Add an interview</button></div><section className="panel applications-panel"><div className="panel-heading"><div><h2>Interview notes</h2><p>Applications currently in the interview stage</p></div></div>{applications.filter((item) => item.status === 'Interview' || item.status === 'Assessment').map((item) => <article className="prep-card" key={item.id}><BrandMark color={item.color} mark={item.mark} /><div className="follow-info"><strong>{item.company} · {item.position}</strong><span>{item.notes || 'Add your interview notes and questions to prepare.'}</span></div><button className="export-button" onClick={() => { setEditing(item); setModalOpen(true) }}>Add notes</button></article>)}{!applications.some((item) => item.status === 'Interview' || item.status === 'Assessment') && <div className="empty-state"><span>No interviews to prep for yet</span><small>Once an application reaches interview stage, it will show up here.</small></div>}<div className="prep-tip"><span>✳</span><div><strong>A little preparation goes a long way.</strong><p>Research the company, revisit the job description, and come with a question or two of your own.</p></div></div></section></div>

    return <div className="subpage"><div className="welcome-row"><div><div className="eyebrow">MAKE IT YOURS</div><h1>Settings & data</h1><p>Your job search, your way.</p></div></div><section className="panel settings-panel"><div className="account-profile"><span className="account-avatar">{initials}</span><div className="account-identity"><h2>{user.name || firstName}</h2><p>{user.email}</p></div><span className="account-badge">Personal account</span></div><div className="account-details"><div><span>Full name</span><strong>{user.name || 'Not provided'}</strong></div><div><span>Email address</span><strong>{user.email}</strong></div><div><span>Account created</span><strong>{formatMemberDate(user.joinedAt)}</strong></div></div><div className="settings-section"><div><h2>Data & backup</h2><p>Export a copy of your applications.</p></div><button className="export-button" onClick={exportCsv}><Icon name="file" size={15} /> Export applications to CSV</button></div><div className="settings-section"><div><h2>Storage status</h2><p>Your applications are synced with your account.</p></div><span className="storage-status"><span /> Connected to JobTrack</span></div></section></div>
  }

  if (authLoading) return <main className="auth-loading">Loading your JobTrack account…</main>
  if (!user) return <AuthScreen onAuthenticated={(authenticatedUser) => { setUser(authenticatedUser); setApiError('') }} />

  const firstName = user.name?.trim().split(/\s+/)[0] || user.email.split('@')[0]
  const initials = user.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || user.email.slice(0, 2).toUpperCase()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setActivePage('Dashboard') }}><span className="brand-symbol"><span /><span /><span /></span><span>jobtrack<span className="brand-period">.</span></span></a>
        <div className="workspace-switch"><span className="workspace-avatar">{initials}</span><span className="workspace-name"><strong>{firstName}’s workspace</strong><small>Personal account</small></span><Icon name="down" size={14} /></div>
        <nav aria-label="Main navigation">{navigation.map((group) => <div className="nav-group" key={group.label}><span className="nav-label">{group.label}</span>{group.items.map((item) => <button key={item.label} aria-label={item.label} title={item.label} className={`nav-item ${activePage === item.label ? 'active' : ''}`} onClick={() => setActivePage(item.label)}><Icon name={item.icon} size={17} /><span>{item.label}</span>{item.count && <span className="nav-count">{item.label === 'Applications' ? applications.length : dueFollowUps.length}</span>}</button>)}</div>)}</nav>
        <div className="sidebar-bottom"><div className="upgrade-card"><div className="upgrade-spark">✳</div><strong>You’re doing great!</strong><p>Consistency is the secret. Keep showing up for yourself.</p><button onClick={() => setActivePage('Statistics')}>See your progress <Icon name="arrow" size={13} /></button><span className="upgrade-decoration">✳</span></div><button className="profile-button" onClick={signOut} title="Sign out"><span className="profile-avatar">{initials}</span><span><strong>{user.name || firstName}</strong><small>{user.email}</small></span><Icon name="logout" size={17} /></button></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{activePage}</strong></div><div className="topbar-actions"><span className="today-label"><Icon name="calendar" size={15} /> Monday, Oct 12</span><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setActivePage('Follow-ups')}><Icon name="bell" size={19} /><i /></button><button className="top-avatar top-avatar-button" title="Account profile">{initials}</button><button className="sign-out-button" onClick={signOut}><Icon name="logout" size={16} /><span>Sign out</span></button></div></header>
        <div className="content-area">{apiError && <div className="api-alert" role="alert"><span>{apiError}</span><button onClick={refreshApplications}>Retry connection</button></div>}{loading ? <div className="loading-state">Connecting to your applications…</div> : pageContent()}</div>
      </main>
      {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false) }}><section className="application-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><span className="eyebrow">A NEW OPPORTUNITY</span><h2 id="modal-title">{editing ? 'Edit application' : 'Add an application'}</h2><p>Every great next step starts with one.</p></div><button className="icon-button" aria-label="Close form" onClick={() => setModalOpen(false)}><Icon name="close" size={20} /></button></div><form onSubmit={saveApplication}><div className="form-grid"><label className="form-field">Company name <em>*</em><input name="company" placeholder="e.g. Acme Inc." required defaultValue={editing?.company} autoFocus /></label><label className="form-field">Position applied for <em>*</em><input name="position" placeholder="e.g. Product Designer" required defaultValue={editing?.position} /></label><label className="form-field">HR / application email<input name="email" type="email" placeholder="recruiter@company.com" defaultValue={editing?.email} /></label><label className="form-field">Application date <em>*</em><input name="date" type="date" required defaultValue={editing?.date ?? new Date().toISOString().slice(0, 10)} /></label><label className="form-field">Application status<select name="status" defaultValue={editing?.status ?? 'Interested'}>{['Interested', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'].map((status) => <option key={status}>{status}</option>)}</select></label><label className="form-field">Application source<select name="source" defaultValue={editing?.source ?? 'Company website'}>{['Company website', 'LinkedIn', 'Naukri', 'Direct email', 'Referral', 'Other'].map((source) => <option key={source}>{source}</option>)}</select></label><label className="form-field">Next follow-up date<input name="followUp" type="date" defaultValue={editing?.followUp} /></label><label className="form-field">Salary expectations<input name="salary" placeholder="e.g. $120,000 / year" defaultValue={editing?.salary} /></label><label className="form-field">Company website<input name="companyUrl" type="url" placeholder="https://company.com" defaultValue={editing?.companyUrl} /></label><label className="form-field">Recruiter name<input name="recruiterName" placeholder="e.g. Jordan Lee" defaultValue={editing?.recruiterName} /></label><label className="form-field">Recruiter LinkedIn<input name="recruiterLinkedin" type="url" placeholder="https://linkedin.com/in/..." defaultValue={editing?.recruiterLinkedin} /></label><label className="form-field">Location<input name="location" placeholder="e.g. Remote · New York" defaultValue={editing?.location} /></label><label className="form-field full-field">Job description URL<input name="jobUrl" type="url" placeholder="https://company.com/careers/role" defaultValue={editing?.jobUrl} /></label><label className="form-field full-field">Resume version<input name="resume" placeholder="e.g. Product design — v3" defaultValue={editing?.resume} /></label><label className="form-field full-field">Notes<textarea name="notes" rows="3" placeholder="Add a note to your future self..." defaultValue={editing?.notes} /></label></div><div className="modal-footer"><span><em>*</em> Required fields</span><div><button type="button" className="cancel-button" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="primary-button"><Icon name="plus" size={16} />{editing ? 'Save changes' : 'Add application'}</button></div></div></form></section></div>}
      {toast && <div className="toast"><span><Icon name="check" size={16} /></span>{toast}</div>}
    </div>
  )
}

export default App
