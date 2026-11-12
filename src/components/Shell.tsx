import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useWallet } from '../shop/useWallet'
import { useFriendAlerts } from '../social/useFriends'
import { ThemeMenu } from '../theme/ThemeMenu'
import { HubBell } from './HubBell'
import { openPalette } from './CommandPalette'
import { APP_NAME } from '../config'
import { COURSES, LANG_CODES } from '../content'
import { dueCards, liveStreak, todayXp, useStore } from '../store/useStore'
import { Icon, type IconName } from './Icon'
import { useAppLinks } from '../social/apps'

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Learn', icon: 'home' },
  { to: '/review', label: 'Review', icon: 'layers' },
  { to: '/practice', label: 'Practice', icon: 'mic' },
  { to: '/friends', label: 'Friends', icon: 'users' },
  { to: '/shop', label: 'Shop', icon: 'bag' },
  { to: '/profile', label: 'Profile', icon: 'user' },
]

export function Shell() {
  const { activeLang, setActiveLang, progress, streak, xpByDay, dailyGoal } = useStore()
  const due = dueCards(progress[activeLang]).length
  const xp = todayXp(xpByDay)
  const s = liveStreak(streak)
  const { coins } = useWallet()
  const location = useLocation()
  const alerts = useFriendAlerts()

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">L</span>
          <span>
            {APP_NAME.slice(0, 3)}
            <span className="hero-gradient">{APP_NAME.slice(3)}</span>
          </span>
        </div>
        <nav>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon name={n.icon} />
              <span>{n.label}</span>
              {n.to === '/review' && due > 0 && <span className="badge">{due}</span>}
              {n.to === '/friends' && alerts > 0 && <span className="badge">{alerts}</span>}
            </NavLink>
          ))}
        </nav>
        <OtherApps />
      </aside>

      <div className="main-col">
        <header className="topbar">
          <div className="lang-switch" role="tablist" aria-label="Course">
            {LANG_CODES.map((code) => (
              <button
                key={code}
                role="tab"
                aria-selected={code === activeLang}
                className={`lang-chip lang-${code} ${code === activeLang ? 'active' : ''}`}
                onClick={() => setActiveLang(code)}
                title={COURSES[code].name}
              >
                <span lang={COURSES[code].bcp47}>{COURSES[code].badge}</span>
              </button>
            ))}
          </div>
          <div className="topbar-stats">
            <span className={`topstat ${xp > 0 ? 'flame-on' : 'flame-off'}`} title="Day streak">
              <Icon name="flame" filled size={18} /> <span key={s} className="bump">{s}</span>
            </span>
            <span className={`topstat xp ${xp >= dailyGoal ? 'goal-met' : ''}`} title="XP today / daily goal">
              <Icon name="bolt" filled size={18} /> <span key={xp} className="bump">{xp}</span>/{dailyGoal}
            </span>
            {streak.freezes > 0 && (
              <span className="topstat freeze" title="Streak freezes">
                <Icon name="snow" size={18} /> {streak.freezes}
              </span>
            )}
            <Link to="/shop" className="topstat coin-stat" title="Coins — open the shop">
              <Icon name="coin" size={18} /> <span key={coins} className="bump">{coins.toLocaleString()}</span>
            </Link>
            <button className="icon-btn" onClick={openPalette} aria-label="Search and jump" title="Search and jump (Ctrl+K)" data-testid="palette-button"><Icon name="search" size={20} /></button>
            <HubBell />
            <ThemeMenu />
          </div>
        </header>
        <main className="page">
          <div key={location.pathname} className="page-anim">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="tabbar">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
            <Icon name={n.icon} />
            <span>{n.label}</span>
            {n.to === '/review' && due > 0 && <span className="badge">{due}</span>}
            {n.to === '/friends' && alerts > 0 && <span className="badge">{alerts}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

/** The other two apps on the same account: chat and voice in Banter, games in Wordle Unlimited. */
function OtherApps() {
  const links = useAppLinks()
  if (!links) return null
  return (
    <div className="other-apps">
      <span className="other-apps-label">Same account</span>
      <a href={links.banterUrl} target="_blank" rel="noopener noreferrer" className="other-app">
        <span className="other-app-mark banter">B</span>
        <span><strong>Banter</strong><span className="small muted">Chat, voice and servers</span></span>
        <Icon name="external" size={13} />
      </a>
      <a href={links.wordleUrl} target="_blank" rel="noopener noreferrer" className="other-app">
        <span className="other-app-mark wordle">W</span>
        <span><strong>Wordle Unlimited</strong><span className="small muted">Play with friends</span></span>
        <Icon name="external" size={13} />
      </a>
    </div>
  )
}
