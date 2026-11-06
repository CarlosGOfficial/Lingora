import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { NameTag } from '../components/NameTag'
import { PageHeader } from '../components/PageHeader'
import { celebrate } from '../lib/celebrate'
import {
  CATEGORIES,
  DAILY_REWARDS,
  RARITY,
  SHOP_ITEM_BY_ID,
  dailyDeals,
  dayNumber,
  itemsIn,
  priceToday,
  type Category,
  type EquipSlot,
  type ShopItem,
} from '../shop/catalog'
import { useWallet } from '../shop/useWallet'
import { cannotBuy } from '../shop/wallet'
import { useStore } from '../store/useStore'
import { themeSwatch } from '../theme/ThemeMenu'

function useCountdownToUtcMidnight() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const left = Math.max(0, (dayNumber(new Date(now)) + 1) * 86_400_000 - now)
  const hh = Math.floor(left / 3_600_000)
  const mm = Math.floor((left % 3_600_000) / 60_000)
  const ss = Math.floor((left % 60_000) / 1000)
  return `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export function Coins({ value, size = 18 }: { value: number; size?: number }) {
  return (
    <span className="coins">
      <Icon name="coin" size={size} /> {value.toLocaleString()}
    </span>
  )
}

function ItemPreview({ item, name }: { item: ShopItem; name: string }) {
  switch (item.category) {
    case 'theme':
      return (
        <div className="item-preview theme-preview" style={{ ...themeSwatch(item.theme!), boxShadow: 'none' }}>
          <span style={{ background: item.theme!.card, color: item.theme!.text }}>Aa</span>
          <span style={{ background: item.theme!.primary.type === 'solid' ? item.theme!.primary.color : `linear-gradient(${item.theme!.primary.angle}deg, ${item.theme!.primary.colors.join(',')})` }} />
        </div>
      )
    case 'title':
      return (
        <div className="item-preview">
          <span className="title-chip big">{item.text}</span>
        </div>
      )
    case 'nameColor':
      return (
        <div className="item-preview">
          <NameTag name={name} nameColor={item.color} />
        </div>
      )
    case 'celebration':
      return (
        <div className="item-preview">
          <button type="button" className="btn btn-ghost small" onClick={() => celebrate(item.celebration)}>
            <Icon name="play" size={14} /> Preview
          </button>
        </div>
      )
    case 'powerup':
      return (
        <div className="item-preview powerup">
          <Icon name="snow" size={34} />
        </div>
      )
  }
}

function ItemCard({ item, deal }: { item: ShopItem; deal?: boolean }) {
  const wallet = useWallet()
  const name = useStore((s) => s.name)
  const equipped = useStore((s) => s.appearance.equipped)
  const buyItem = useStore((s) => s.buyItem)
  const equip = useStore((s) => s.equip)
  const [confirming, setConfirming] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!confirming) return
    const id = setTimeout(() => setConfirming(false), 3500)
    return () => clearTimeout(id)
  }, [confirming])

  const price = priceToday(item)
  const owned = wallet.owned.has(item.id)
  const slot = item.category === 'powerup' ? null : (item.category as EquipSlot)
  const isOn = slot ? equipped[slot] === item.id : false
  const blocked = cannotBuy(item, wallet)
  const locked = !!item.level && wallet.level < item.level
  const held = item.consumable ? wallet.held(item.id) : 0

  return (
    <article className={`item-card ${isOn ? 'equipped' : ''}`} style={{ ['--rarity' as string]: RARITY[item.rarity].color }}>
      {deal && <span className="deal-tag">−30%</span>}
      <ItemPreview item={item} name={name || 'You'} />
      <div className="item-meta">
        <strong>{item.name}</strong>
        <span className="rarity">{RARITY[item.rarity].label}</span>
      </div>
      {item.description && <p className="muted small item-desc">{item.description}</p>}

      {owned && !item.consumable ? (
        slot && (
          <button className={`btn ${isOn ? '' : 'btn-primary'} small`} onClick={() => equip(slot, isOn ? (slot === 'title' || slot === 'celebration' ? defaultFor(slot) : null) : item.id)}>
            {isOn ? 'Equipped ✓' : 'Equip'}
          </button>
        )
      ) : locked ? (
        <span className="lock-note">
          <Icon name="lock" size={14} /> Level {item.level}
        </span>
      ) : (
        <button
          className={`btn small ${confirming ? 'btn-primary' : ''}`}
          disabled={!!blocked && !confirming}
          title={blocked ?? undefined}
          onClick={() => {
            if (!confirming) return setConfirming(true)
            const err = buyItem(item.id)
            setConfirming(false)
            setMsg(err ?? (item.consumable ? 'Added!' : 'Yours!'))
            setTimeout(() => setMsg(null), 2000)
          }}
        >
          {confirming ? (
            <>Confirm {price}?</>
          ) : (
            <>
              {deal && <s className="muted">{item.price}</s>} <Coins value={price} size={14} />
            </>
          )}
        </button>
      )}
      {item.consumable && (
        <span className="muted small">
          Holding {held}/{item.consumable.max}
        </span>
      )}
      {msg && <span className="small item-msg">{msg}</span>}
      {!owned && blocked && !locked && !confirming && !item.consumable && <span className="muted small">{blocked}</span>}
    </article>
  )
}

const defaultFor = (slot: EquipSlot) => (slot === 'title' ? 'tt_learner' : slot === 'celebration' ? 'ce_confetti' : null)

export function ShopPage() {
  const wallet = useWallet()
  const claimDaily = useStore((s) => s.claimDaily)
  const signedIn = useStore((s) => !!s.account)
  const [params, setParams] = useSearchParams()
  const tab = (CATEGORIES.some((c) => c.id === params.get('tab')) ? params.get('tab') : 'theme') as Category
  const countdown = useCountdownToUtcMidnight()
  const [claimed, setClaimed] = useState<number | null>(null)
  const deals = dailyDeals()
  const { level, xpIntoLevel, xpForNext, fraction, nextReward } = wallet.progress

  return (
    <div className="stack">
      <PageHeader
        icon="bag"
        title="Shop"
        subtitle={
          <>
            Every XP you earn is a coin. Level-ups and the daily reward pay extra.
            {signedIn && ' Your coins are shared with Wordle Unlimited: earn in either app, spend in either shop.'}
            {!signedIn && (
              <>
                {' '}
                <Link to="/profile">Sign in</Link> to keep your coins on every device.
              </>
            )}
          </>
        }
        right={
          <span className="coins big">
            <Icon name="coin" size={24} /> {wallet.coins.toLocaleString()}
          </span>
        }
      />

      <div className="level-card">
        <div className="level-badge">{level}</div>
        <div className="grow">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>Level {level}</strong>
            <span className="muted small">
              {xpIntoLevel} / {xpForNext} XP · next level pays <Coins value={nextReward} size={12} />
            </span>
          </div>
          <div className="progress thin">
            <div style={{ width: `${fraction * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="daily-card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0 }}>
              <Icon name="gift" size={18} /> Daily reward
            </h3>
            <span className="muted small">Claim every day to climb the ladder. Skipping a day starts it over.</span>
          </div>
          {wallet.daily.claimedToday ? (
            <span className="muted small">{claimed ? `+${claimed} coins!` : 'Come back tomorrow'}</span>
          ) : (
            <button className="btn btn-primary" onClick={() => setClaimed(claimDaily())}>
              Claim <Coins value={wallet.daily.reward} size={14} />
            </button>
          )}
        </div>
        <ol className="ladder">
          {DAILY_REWARDS.map((coins, i) => {
            const day = i + 1
            const pos = ((wallet.daily.streakDay - 1) % DAILY_REWARDS.length) + 1
            const state = day < pos || (day === pos && wallet.daily.claimedToday) ? 'done' : day === pos ? 'today' : ''
            return (
              <li key={day} className={state}>
                <span className="small muted">Day {day}</span>
                <strong>{coins}</strong>
              </li>
            )
          })}
        </ol>
      </div>

      <section>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>
            <Icon name="tag" size={18} /> Today’s deals
          </h2>
          <span className="muted small">New deals in {countdown}</span>
        </div>
        <div className="item-grid stagger">
          {deals.map((d) => (
            <ItemCard key={d.itemId} item={SHOP_ITEM_BY_ID.get(d.itemId)!} deal />
          ))}
        </div>
      </section>

      <section>
        <div className="tabs" role="tablist">
          {CATEGORIES.map((c) => (
            <button key={c.id} role="tab" aria-selected={tab === c.id} className={`tab-btn ${tab === c.id ? 'active' : ''}`} onClick={() => setParams({ tab: c.id }, { replace: true })}>
              {c.plural}
            </button>
          ))}
        </div>
        {tab === 'theme' && (
          <p className="muted small">
            Or design your own in the <Link to="/themes">Theme Studio</Link> — free.
          </p>
        )}
        <div className="item-grid stagger">
          {itemsIn(tab).map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  )
}
