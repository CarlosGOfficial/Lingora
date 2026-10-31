import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AccountPanel } from '../components/AccountPanel'
import { NameTag } from '../components/NameTag'
import { PageHeader } from '../components/PageHeader'
import { cosmeticsOf, levelFromXp } from '../shop/catalog'
import { DAILY_GOALS } from '../config'
import { COURSES, LANG_CODES, allLessons } from '../content'
import { addDays, dayKey, weekStart } from '../lib/date'
import { isLearned } from '../lib/fsrs'
import { useStore } from '../store/useStore'

const WEEKS = 16

function Heatmap({ xpByDay, frozen, goal }: { xpByDay: Record<string, number>; frozen: string[]; goal: number }) {
  const today = dayKey()
  const start = addDays(weekStart(today), -7 * (WEEKS - 1))
  const cols = Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)))
  return (
    <div className="heatmap" role="img" aria-label="Activity over the last 16 weeks">
      {cols.map((col, i) => (
        <div key={i} className="heat-col">
          {col.map((day) => {
            const xp = xpByDay[day] ?? 0
            const level = day > today ? 'future' : frozen.includes(day) ? 'frozen' : xp === 0 ? 'l0' : xp < goal / 2 ? 'l1' : xp < goal ? 'l2' : 'l3'
            return <span key={day} className={`heat ${level}`} title={`${day}: ${xp} XP${frozen.includes(day) ? ' (freeze)' : ''}`} />
          })}
        </div>
      ))}
    </div>
  )
}

export function ProfilePage() {
  const s = useStore()
  const [name, setName] = useState(s.name)
  const totalXp = Object.values(s.xpByDay).reduce((a, b) => a + b, 0)

  return (
    <div className="stack">
      <PageHeader icon="user" title="Profile" subtitle="Your progress, settings and account." />

      <div className="profile-head">
        <span className="avatar big">{s.name[0]?.toUpperCase()}</span>
        {s.account ? (
          <div className="grow">
            <NameTag name={s.account.username} {...cosmeticsOf(s.appearance.equipped)} />
            <div className="muted small">
              Level {levelFromXp(totalXp)} · <Link to="/shop">change your look in the shop</Link>
            </div>
          </div>
        ) : (
        <form
          className="row grow"
          onSubmit={(e) => {
            e.preventDefault()
            s.setName(name)
          }}
        >
          <input className="text-input grow" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} aria-label="Display name" />
          {name !== s.name && <button className="btn">Save</button>}
        </form>
        )}
      </div>

      <div className="dash">
        <div className="stat-tile tone-flame">
          <span className="stat-label">Current streak</span>
          <span className="stat-value">{s.streak.current}</span>
        </div>
        <div className="stat-tile tone-flame">
          <span className="stat-label">Longest streak</span>
          <span className="stat-value">{s.streak.longest}</span>
        </div>
        <div className="stat-tile tone-xp">
          <span className="stat-label">Total XP</span>
          <span className="stat-value">{totalXp}</span>
        </div>
        <div className="stat-tile tone-accent">
          <span className="stat-label">Streak freezes</span>
          <span className="stat-value">{s.streak.freezes}</span>
        </div>
      </div>

      <section>
        <h2>Account & sync</h2>
        <AccountPanel />
      </section>

      <section>
        <h2>Activity</h2>
        <Heatmap xpByDay={s.xpByDay} frozen={s.streak.frozenDays} goal={s.dailyGoal} />
      </section>

      <section>
        <h2>Courses</h2>
        <div className="course-progress">
          {LANG_CODES.map((code) => {
            const c = COURSES[code]
            const p = s.progress[code]
            const total = allLessons(c).length
            const learned = Object.values(p.cards).filter(isLearned).length
            return (
              <div key={code} className="course-row">
                <span className={`lang-badge small lang-${code}`} lang={c.bcp47}>
                  {c.badge}
                </span>
                <div className="grow">
                  <strong>{c.name}</strong>
                  <div className="muted small">
                    {c.standard} · {p.completedLessons.length}/{total} lessons · {learned} items learned · {p.xp} XP
                  </div>
                  <div className="progress thin">
                    <div style={{ width: `${(p.completedLessons.length / total) * 100}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2>Daily goal</h2>
        <div className="goal-list inline">
          {DAILY_GOALS.map((g) => (
            <button key={g.xp} className={`goal-option ${s.dailyGoal === g.xp ? 'active' : ''}`} onClick={() => s.setDailyGoal(g.xp)}>
              <strong>{g.label}</strong>
              <span className="muted small">{g.xp} XP</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Settings</h2>
        <div className="settings">
          <label className="toggle">
            <input type="checkbox" checked={s.settings.listening} onChange={(e) => s.updateSettings({ listening: e.target.checked })} />
            Listening exercises in lessons
          </label>
          <label className="toggle">
            <input type="checkbox" checked={s.settings.speaking} onChange={(e) => s.updateSettings({ speaking: e.target.checked })} />
            Speaking exercises in lessons
          </label>
          <label className="toggle">
            <input type="checkbox" checked={s.settings.showReading} onChange={(e) => s.updateSettings({ showReading: e.target.checked })} />
            Show pinyin / kana / romaji above text
          </label>
          <label className="field">
            <span>Audio speed: {s.settings.speechRate.toFixed(2)}×</span>
            <input
              type="range"
              min={0.5}
              max={1.2}
              step={0.05}
              value={s.settings.speechRate}
              onChange={(e) => s.updateSettings({ speechRate: Number(e.target.value) })}
            />
          </label>
        </div>
      </section>

      <section>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (confirm('Erase all progress, streaks and friends on this device?')) s.resetAll()
          }}
        >
          Reset all progress
        </button>
      </section>
    </div>
  )
}
