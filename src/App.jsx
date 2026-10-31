import { useState, useEffect } from 'react'
import {
  Heart, Star, Users, ShieldCheck, Clock, AlertTriangle, CheckCircle2,
  UserPlus, Wallet, FileText, Briefcase, Activity, X,
} from 'lucide-react'

/* ---------- constants & helpers ---------- */
const KEY = 'careconnect-v1'
const CATS = ['Companionship', 'Mobility', 'Post-Surgery', 'Vitals']
const GOOD = ['Punctual', 'Empathetic', 'Professional', 'Caring']
const BAD = ['Rude', 'Late', 'Careless']
const BASE_RATE = 250 // platform escrow hold per hour
const PRIORITY_WINDOW_MS = 60000 // jobs open to <4.5 caregivers after this
const DISCLAIMER =
  'CareConnect is a neutral technology platform connecting independent caregivers. CareConnect assumes no liability for theft, loss of personal belongings, or property damages. Full verification responsibility rests with the contracting parties.'
const INIT = {
  clients: [], caregivers: [], bookings: [], audit: [], escrow: 0,
  session: { clientId: null, caregiverId: null },
}
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || INIT } catch { return INIT } }
const clamp = (n) => Math.min(5, Math.max(0, Math.round(n * 100) / 100))
const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase()
const startMs = (b) => new Date(`${b.date}T${b.time}`).getTime()
const score = (c) => Math.round(c.rating * 20 + c.exp * 2 - c.rate / 50)
const fmt = (ts) => new Date(ts).toLocaleString()


 
 const API = import.meta.env.VITE_API_URL || `http://${location.hostname}:5000/api/state`
const loadSession = () => { try { return JSON.parse(localStorage.getItem('cc-session')) || INIT.session } catch { return INIT.session } }

function useStore() {
  const [s, set] = useState({ ...INIT, session: loadSession() })
  useEffect(() => {
    const pull = () =>
      fetch(API).then((r) => r.json())
        .then((d) => set((p) => {
          const m = { ...INIT, ...d, session: p.session }
          return JSON.stringify(p) === JSON.stringify(m) ? p : m
        }))
        .catch(() => {})
    pull()
    const t = setInterval(pull, 1500)
    return () => clearInterval(t)
  }, [])
  const up = (fn) => set((p) => {
    const n = structuredClone(p)
    fn(n)
    localStorage.setItem('cc-session', JSON.stringify(n.session))
    fetch(API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...n, session: INIT.session }) })
    return n
  })
  return [s, up]
}





const Card = ({ title, icon: I, children, right }) => (
  <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-semibold text-slate-800 flex items-center gap-2">
        {I && <I size={18} className="text-teal-600" />}{title}
      </h2>
      {right}
    </div>
    {children}
  </section>
)
const tones = {
  green: 'bg-emerald-100 text-emerald-700', red: 'bg-rose-100 text-rose-700',
  amber: 'bg-amber-100 text-amber-800', blue: 'bg-sky-100 text-sky-700',
  gray: 'bg-slate-100 text-slate-600', teal: 'bg-teal-100 text-teal-700',
}
const Badge = ({ tone = 'gray', children }) => (
  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${tones[tone]}`}>{children}</span>
)
const Btn = ({ tone = 'teal', className = '', ...p }) => {
  const c = {
    teal: 'bg-teal-600 hover:bg-teal-700 text-white', red: 'bg-rose-600 hover:bg-rose-700 text-white',
    gray: 'bg-slate-100 hover:bg-slate-200 text-slate-700', blue: 'bg-sky-600 hover:bg-sky-700 text-white',
  }[tone]
  return <button {...p} className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition ${c} ${className}`} />
}
const Input = ({ label, ...p }) => (
  <label className="block text-sm text-slate-600">
    {label}
    <input {...p} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500" />
  </label>
)
const Stars = ({ value, onChange, size = 18 }) => (
  <span className="inline-flex">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={size} onClick={onChange ? () => onChange(n) : undefined}
        className={`${onChange ? 'cursor-pointer' : ''} ${n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
    ))}
  </span>
)
const RatingBadge = ({ v }) => (
  <Badge tone={v < 3.5 ? 'red' : v >= 4.5 ? 'green' : 'amber'}><Star size={12} className="fill-current" />{v.toFixed(2)}</Badge>
)
const Empty = ({ children }) => <p className="text-sm text-slate-400 py-4 text-center">{children}</p>
const statusTone = { Pending: 'amber', Confirmed: 'blue', Accepted: 'teal', 'En Route': 'teal', 'Clocked In': 'green', Completed: 'gray', Cancelled: 'red' }

function Register({ fields, onSubmit, label }) {
  const [v, setV] = useState({})
  const ok = fields.every(([k]) => v[k] !== undefined && String(v[k]).trim() !== '')
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {fields.map(([k, l, t]) => (
        <Input key={k} label={l} type={t || 'text'} value={v[k] ?? ''} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
      ))}
      <div className="sm:col-span-2">
        <Btn disabled={!ok} onClick={() => { onSubmit(v); setV({}) }}><UserPlus size={14} className="inline mr-1" />{label}</Btn>
      </div>
    </div>
  )
}

function RateModal({ title, tags, onClose, onSubmit }) {
  const [stars, setStars] = useState(0)
  const [sel, setSel] = useState([])
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between mb-3">
          <h3 className="font-semibold">{title}</h3>
          <X className="cursor-pointer" onClick={onClose} />
        </div>
        <Stars value={stars} onChange={setStars} size={32} />
        {tags && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((t) => (
              <button key={t} onClick={() => setSel(sel.includes(t) ? sel.filter((x) => x !== t) : [...sel, t])}
                className={`px-3 py-1 rounded-full text-sm border ${sel.includes(t) ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-300 text-slate-600'}`}>{t}</button>
            ))}
          </div>
        )}
        <Btn className="mt-5" disabled={!stars} onClick={() => { onSubmit(stars, sel); onClose() }}>Submit rating</Btn>
      </div>
    </div>
  )
}

/* ---------- Side A: Client ---------- */
function ClientView({ s, up, notify }) {
  const cl = s.clients.find((c) => c.id === s.session.clientId)
  const blank = { name: '', age: '', locality: '', cat: CATS[0], date: '', time: '', hours: 2 }
  const [f, setF] = useState(blank)
  const [consent, setConsent] = useState(false)
  const [rate, setRate] = useState(null)
  const valid = cl && f.name && f.age && f.locality && f.date && f.time && Number(f.hours) > 0 && consent
  const mine = s.bookings.filter((b) => b.clientId === cl?.id).reverse()

  const submit = () => {
    const id = 'BK-' + uid()
    up((n) => {
      n.bookings.push({ id, clientId: cl.id, patient: { name: f.name, age: f.age, locality: f.locality },
        cat: f.cat, date: f.date, time: f.time, hours: Number(f.hours), status: 'Pending',
        caregiverId: null, declinedBy: [], cancelledBy: [], created: Date.now(), amount: Number(f.hours) * BASE_RATE })
      n.audit.push({ id: uid(), ts: Date.now(), bookingId: id, who: cl.name, text: DISCLAIMER })
    })
    setF(blank); setConsent(false); notify(`Booking ${id} created. Pay to dispatch.`)
  }
  const pay = (b) => up((n) => {
    const x = n.bookings.find((y) => y.id === b.id)
    x.status = 'Confirmed'; x.paidAt = Date.now(); n.escrow += x.amount
  })
  const cancel = (b) => up((n) => {
    const x = n.bookings.find((y) => y.id === b.id)
    const c = n.clients.find((y) => y.id === x.clientId)
    const late = x.caregiverId && startMs(x) - Date.now() < 2 * 3600 * 1000
    if (x.paidAt) n.escrow -= x.amount
    x.status = 'Cancelled'
    if (late) {
      c.trust = clamp(c.trust - 0.5); c.cancels += 1
      notify('Late cancellation (<2h) on an accepted duty: Trust Score -0.5')
    } else notify('Booking cancelled.')
  })
  const submitRating = (b, stars, tags) => up((n) => {
    const x = n.bookings.find((y) => y.id === b.id)
    const g = n.caregivers.find((y) => y.id === x.caregiverId)
    x.clientRating = { stars, tags }
    g.rating = clamp(g.rating + (stars - g.rating) * 0.25)
    g.ratingsCount += 1
  })

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="space-y-5 lg:col-span-1">
        <Card title="Family account" icon={Users}>
          {s.clients.length > 0 && (
            <select className="w-full border rounded-lg px-3 py-2 mb-3" value={s.session.clientId || ''}
              onChange={(e) => up((n) => { n.session.clientId = e.target.value })}>
              <option value="">Select family account…</option>
              {s.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {cl && (
            <div className="mb-3 p-3 rounded-xl bg-teal-50 flex items-center justify-between">
              <span className="text-sm text-slate-600">Platform Trust Score</span>
              <RatingBadge v={cl.trust} />
            </div>
          )}
          <Register label="Create family account" fields={[['name', 'Contact / Family name'], ['phone', 'Phone', 'tel']]}
            onSubmit={(v) => up((n) => { const id = 'CL-' + uid(); n.clients.push({ id, name: v.name, phone: v.phone, trust: 4.5, cancels: 0, ratingsCount: 0 }); n.session.clientId = id })} />
        </Card>
        <Card title="Elder care request" icon={Heart}>
          {!cl ? <Empty>Create or select a family account first.</Empty> : (
            <div className="space-y-3">
              <Input label="Patient full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Age" type="number" min="1" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} />
                <Input label="Locality" value={f.locality} onChange={(e) => setF({ ...f, locality: e.target.value })} />
              </div>
              <label className="block text-sm text-slate-600">Service category
                <select className="mt-1 w-full border rounded-lg px-3 py-2" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>
                  {CATS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Input label="Date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
                <Input label="Start" type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
                <Input label="Hours" type="number" min="1" value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} />
              </div>
              <label className="flex gap-2 text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                <span>{DISCLAIMER}</span>
              </label>
              <Btn disabled={!valid} onClick={submit} className="w-full">Request caregiver</Btn>
            </div>
          )}
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card title="Live booking tracker" icon={Activity}>
          {mine.length === 0 ? <Empty>No bookings yet. Submit a request to see it here.</Empty> : (
            <div className="space-y-3">
              {mine.map((b) => {
                const g = s.caregivers.find((y) => y.id === b.caregiverId)
                return (
                  <div key={b.id} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-800">{b.patient.name} <span className="text-slate-400 font-normal">· {b.patient.age} yrs · {b.patient.locality}</span></p>
                        <p className="text-sm text-slate-500">{b.cat} · {b.date} {b.time} · {b.hours}h · Hold ₹{b.amount}</p>
                      </div>
                      <Badge tone={statusTone[b.status]}>{b.status === 'Confirmed' && !g ? 'Confirmed / Dispatched' : b.status}</Badge>
                    </div>
                    {g && <p className="text-sm mt-2 text-slate-600">Caregiver: <b>{g.name}</b> <RatingBadge v={g.rating} /></p>}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {b.status === 'Pending' && <Btn onClick={() => pay(b)}><Wallet size={14} className="inline mr-1" />Pay Now / Confirm Dispatch</Btn>}
                      {['Pending', 'Confirmed', 'Accepted'].includes(b.status) && <Btn tone="red" onClick={() => cancel(b)}>Cancel</Btn>}
                      {b.status === 'Completed' && !b.clientRating && <Btn tone="blue" onClick={() => setRate(b)}>Rate caregiver</Btn>}
                      {b.clientRating && <span className="text-sm text-slate-500 flex items-center gap-2">You rated <Stars value={b.clientRating.stars} size={14} />{b.clientRating.tags.map((t) => <Badge key={t}>{t}</Badge>)}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
      {rate && <RateModal title={`Rate your caregiver (${rate.id})`} tags={[...GOOD, ...BAD]} onClose={() => setRate(null)} onSubmit={(st, t) => submitRating(rate, st, t)} />}
    </div>
  )
}

/* ---------- Side B: Caregiver ---------- */
function CaregiverView({ s, up, notify }) {
  const me = s.caregivers.find((c) => c.id === s.session.caregiverId)
  const [rate, setRate] = useState(null)
  const [, tick] = useState(0)
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t) }, [])

  const open = (b) => b.status === 'Confirmed' && !b.caregiverId && me && !b.declinedBy.includes(me.id) &&
    (me.rating >= 4.5 || Date.now() - b.paidAt > PRIORITY_WINDOW_MS)
  const feed = s.bookings.filter(open)
  const duties = s.bookings.filter((b) => b.caregiverId === me?.id && b.status !== 'Cancelled')
  const set = (b, fn) => up((n) => fn(n.bookings.find((y) => y.id === b.id), n))

  const accept = (b) => set(b, (x) => { x.caregiverId = me.id; x.status = 'Accepted' })
  const decline = (b) => set(b, (x) => { x.declinedBy.push(me.id) })
  const advance = (b, next) => set(b, (x, n) => {
    x.status = next
    if (next === 'Completed') {
      const g = n.caregivers.find((y) => y.id === me.id)
      g.rating = clamp(g.rating + 0.03); g.completed += 1
      n.escrow -= x.amount
      notify('Shift completed. Payment released from escrow.')
    }
  })
  const cancel = (b) => up((n) => {
    const x = n.bookings.find((y) => y.id === b.id)
    const g = n.caregivers.find((y) => y.id === me.id)
    g.rating = clamp(g.rating - 0.4); g.cancels += 1
    x.cancelledBy.push(me.id); x.caregiverId = null; x.status = 'Confirmed'; x.paidAt = x.paidAt
    notify('High cancellation rates reduce priority job dispatch. Rating -0.4')
  })
  const reverse = (b, stars) => up((n) => {
    const x = n.bookings.find((y) => y.id === b.id)
    const c = n.clients.find((y) => y.id === x.clientId)
    x.caregiverRating = stars
    c.trust = clamp(c.trust + (stars - c.trust) * 0.25); c.ratingsCount += 1
  })

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="space-y-5">
        <Card title="Student profile" icon={ShieldCheck}>
          {s.caregivers.length > 0 && (
            <select className="w-full border rounded-lg px-3 py-2 mb-3" value={s.session.caregiverId || ''}
              onChange={(e) => up((n) => { n.session.caregiverId = e.target.value })}>
              <option value="">Select caregiver profile…</option>
              {s.caregivers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {me && (
            <div className="mb-3 p-3 rounded-xl bg-teal-50 text-sm space-y-1">
              <div className="flex justify-between"><b>{me.name}</b><RatingBadge v={me.rating} /></div>
              <p className="text-slate-600">ID {me.roll} · Age {me.age} · {me.exp} yr exp · ₹{me.rate}/hr</p>
              <p className="text-slate-500">Completed {me.completed} · Cancelled {me.cancels}</p>
              {me.rating >= 4.5 ? <Badge tone="green">Priority dispatch</Badge> : <Badge tone="amber">Standard dispatch (jobs open after {PRIORITY_WINDOW_MS / 1000}s)</Badge>}
            </div>
          )}
          <Register label="Register caregiver" fields={[['name', 'Student name'], ['roll', 'College ID / Roll'], ['age', 'Age', 'number'], ['exp', 'Experience (years)', 'number'], ['rate', 'Base hourly rate (₹)', 'number']]}
            onSubmit={(v) => up((n) => { const id = 'CG-' + uid(); n.caregivers.push({ id, name: v.name, roll: v.roll, age: Number(v.age), exp: Number(v.exp), rate: Number(v.rate), rating: 4.8, ratingsCount: 0, cancels: 0, completed: 0 }); n.session.caregiverId = id })} />
        </Card>
      </div>
      <div className="lg:col-span-2 space-y-5">
        <Card title="Live job feed" icon={Briefcase}>
          {!me ? <Empty>Register or select a caregiver profile.</Empty> : feed.length === 0 ? <Empty>No open jobs. Paid client requests appear here instantly.</Empty> : (
            <div className="space-y-3">
              {feed.map((b) => {
                const c = s.clients.find((y) => y.id === b.clientId)
                return (
                  <div key={b.id} className="border rounded-xl p-4 flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-medium">{b.cat} · {b.patient.locality}</p>
                      <p className="text-sm text-slate-500">{b.patient.name}, {b.patient.age} · {b.date} {b.time} · {b.hours}h · est. ₹{b.hours * me.rate}</p>
                      {c && c.trust < 3 && <Badge tone="red"><AlertTriangle size={12} />Low client trust score ({c.trust.toFixed(2)})</Badge>}
                    </div>
                    <div className="flex gap-2 items-start">
                      <Btn onClick={() => accept(b)}>Accept Duty</Btn>
                      <Btn tone="gray" onClick={() => decline(b)}>Decline Duty</Btn>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
        <Card title="My duties" icon={Clock}>
          {duties.length === 0 ? <Empty>No accepted duties.</Empty> : (
            <div className="space-y-3">
              {duties.map((b) => {
                const c = s.clients.find((y) => y.id === b.clientId)
                const nxt = { Accepted: 'En Route', 'En Route': 'Clocked In', 'Clocked In': 'Completed' }[b.status]
                return (
                  <div key={b.id} className="border rounded-xl p-4">
                    <div className="flex justify-between flex-wrap gap-2">
                      <p className="font-medium">{b.patient.name} · {b.cat} · {b.date} {b.time}</p>
                      <Badge tone={statusTone[b.status]}>{b.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">Client: {c?.name} {c && <RatingBadge v={c.trust} />}</p>
                    <div className="flex flex-wrap gap-2 mt-3 items-center">
                      {nxt && <Btn onClick={() => advance(b, nxt)}>Mark: {nxt === 'Completed' ? 'Shift Completed' : nxt}</Btn>}
                      {b.status === 'Accepted' && <Btn tone="red" onClick={() => cancel(b)}>Cancel duty</Btn>}
                      {b.status === 'Completed' && !b.caregiverRating && <Btn tone="blue" onClick={() => setRate(b)}>Rate client / family</Btn>}
                      {b.caregiverRating && <span className="text-sm text-slate-500 flex items-center gap-2">Client rated <Stars value={b.caregiverRating} size={14} /></span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
      {rate && <RateModal title="Rate the client / family environment" onClose={() => setRate(null)} onSubmit={(st) => reverse(rate, st)} />}
    </div>
  )
}

/* ---------- Side C: Admin ---------- */
function AdminView({ s, up }) {
  const active = s.bookings.filter((b) => ['Accepted', 'En Route', 'Clocked In'].includes(b.status)).length
  const pending = s.bookings.filter((b) => ['Pending', 'Confirmed'].includes(b.status) && !b.caregiverId).length
  const dispatch = s.bookings.filter((b) => !['Completed', 'Cancelled'].includes(b.status))
  const best = (b) => s.caregivers.filter((c) => !b.declinedBy.includes(c.id)).sort((a, z) => score(z) - score(a))[0]
  const kpis = [
    ['Active shifts', active, Activity], ['Verified caregivers', s.caregivers.length, ShieldCheck],
    ['Pending matches', pending, Clock], ['Escrow balance', '₹' + s.escrow, Wallet],
  ]
  const reassign = (b, id) => up((n) => {
    const x = n.bookings.find((y) => y.id === b.id)
    if (!id) return
    x.caregiverId = id; if (x.status === 'Confirmed' || x.status === 'Pending') x.status = 'Accepted'
  })
  const rows = [
    ...s.clients.map((c) => ({ id: c.id, name: c.name, type: 'Client', v: c.trust, cancels: c.cancels })),
    ...s.caregivers.map((c) => ({ id: c.id, name: c.name, type: 'Caregiver', v: c.rating, cancels: c.cancels })),
  ]
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(([l, v, I]) => (
          <div key={l} className="bg-white rounded-2xl border p-4 shadow-sm">
            <I size={18} className="text-teal-600" />
            <p className="text-2xl font-bold mt-2">{v}</p><p className="text-sm text-slate-500">{l}</p>
          </div>
        ))}
      </div>
      <Card title="Live dispatch" icon={Briefcase}>
        {dispatch.length === 0 ? <Empty>No live bookings.</Empty> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500"><th className="py-2">Booking</th><th>Patient</th><th>Status</th><th>Assigned</th><th>Top match</th><th>Override</th></tr></thead>
            <tbody>{dispatch.map((b) => {
              const t = best(b); const a = s.caregivers.find((c) => c.id === b.caregiverId)
              return (
                <tr key={b.id} className="border-t">
                  <td className="py-2">{b.id}</td><td>{b.patient.name}</td>
                  <td><Badge tone={statusTone[b.status]}>{b.status}</Badge></td>
                  <td>{a ? a.name : '—'}</td>
                  <td>{t ? <>{t.name} <Badge tone={t.rating >= 4.5 ? 'green' : 'gray'}>score {score(t)}{t.rating >= 4.5 ? ' · priority' : ''}</Badge></> : '—'}</td>
                  <td><select className="border rounded px-2 py-1" value="" onChange={(e) => reassign(b, e.target.value)}>
                    <option value="">Reassign…</option>
                    {s.caregivers.map((c) => <option key={c.id} value={c.id}>{c.name} ({score(c)})</option>)}
                  </select></td>
                </tr>
              )
            })}</tbody></table></div>
        )}
      </Card>
      <Card title="Two-way rating monitor" icon={Star}>
        {rows.length === 0 ? <Empty>No users yet.</Empty> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500"><th className="py-2">User</th><th>Type</th><th>Score</th><th>Cancellations</th><th>Flag</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-t"><td className="py-2">{r.name}</td><td>{r.type}</td><td><RatingBadge v={r.v} /></td><td>{r.cancels}</td>
                <td>{r.v < 3.5 ? <Badge tone="red"><AlertTriangle size={12} />Account Under Review for frequent cancellations</Badge> : <Badge tone="green">Good standing</Badge>}</td></tr>
            ))}</tbody></table></div>
        )}
      </Card>
      <Card title="Consent & audit log" icon={FileText}>
        {s.audit.length === 0 ? <Empty>Signed disclaimers appear here for each booking.</Empty> : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {[...s.audit].reverse().map((a) => (
              <div key={a.id} className="text-sm border rounded-lg p-3">
                <p className="font-medium">{a.bookingId} · signed by {a.who} <span className="text-slate-400 font-normal">· {fmt(a.ts)}</span></p>
                <p className="text-xs text-slate-500 mt-1">{a.text}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

/* ---------- App shell ---------- */
const ROLES = [['client', 'Client / Family View'], ['caregiver', 'Student Caregiver View'], ['admin', 'Platform Operations (Admin) View']]

export default function App() {
  const [s, up] = useStore()
  const [role, setRole] = useState(() => localStorage.getItem('careconnect-role') || 'client')
  const [toast, setToast] = useState(null)
  const notify = (m) => { setToast(m); setTimeout(() => setToast(null), 4500) }
  useEffect(() => localStorage.setItem('careconnect-role', role), [role])
  const P = { s, up, notify }
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-slate-50 text-slate-800">
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-teal-700"><Heart className="fill-teal-600 text-teal-600" size={22} />CareConnect</div>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white">
            {ROLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {role === 'client' && <ClientView {...P} />}
        {role === 'caregiver' && <CaregiverView {...P} />}
        {role === 'admin' && <AdminView {...P} />}
      </main>
      {toast && (
        <div className="fixed bottom-5 right-5 max-w-sm bg-slate-900 text-white text-sm rounded-xl px-4 py-3 shadow-lg flex gap-2 z-50">
          <CheckCircle2 size={18} className="shrink-0 text-teal-400" />{toast}
        </div>
      )}
    </div>
  )
}
