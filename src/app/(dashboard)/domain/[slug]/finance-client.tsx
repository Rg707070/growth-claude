'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Plus, X, Check, Trash2,
  TrendingUp, TrendingDown, ShoppingBag, Flame,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { useHabitReminders } from '@/hooks/use-notifications'
import { DomainHabitsTab } from '@/components/domain-habits-tab'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  createTransaction, deleteTransaction,
  createWishlistItem, updateWishlistStatus, deleteWishlistItem,
} from './finance-actions'
import type { Domain, Habit } from '@/types'
import type { FinanceTransaction, FinanceWishlistItem, TransactionType } from '@/types/finance'

type Tab = 'transactions' | 'wishlist' | 'habits'

const EXPENSE_CATEGORIES = [
  { value: 'food', he: 'אוכל', icon: '🍔' },
  { value: 'transport', he: 'תחבורה', icon: '🚌' },
  { value: 'entertainment', he: 'בידור', icon: '🎭' },
  { value: 'shopping', he: 'קניות', icon: '🛒' },
  { value: 'health', he: 'בריאות', icon: '💊' },
  { value: 'education', he: 'לימודים', icon: '📚' },
  { value: 'savings', he: 'חיסכון', icon: '🏦' },
  { value: 'other', he: 'אחר', icon: '📌' },
]

const INCOME_CATEGORIES = [
  { value: 'pocket', he: 'כיס', icon: '💵' },
  { value: 'work', he: 'עבודה', icon: '💼' },
  { value: 'gift', he: 'מתנה', icon: '🎁' },
  { value: 'other', he: 'אחר', icon: '📌' },
]

function fmt(n: number) {
  return `₪${n.toLocaleString('he-IL')}`
}

interface Props {
  domain: Domain
  habits: Habit[]
  completedIds: string[]
  userId: string
  transactions: FinanceTransaction[]
  wishlist: FinanceWishlistItem[]
  schemaReady: boolean
}

export function FinanceClient({
  domain, habits: initialHabits, completedIds, userId,
  transactions, wishlist, schemaReady,
}: Props) {
  const router = useRouter()
  const { isRTL } = useLang()
  const [tab, setTab] = useState<Tab>('transactions')
  const [habits, setHabits] = useState(initialHabits)

  useHabitReminders(habits)

  const completedSet = useMemo(() => new Set(completedIds), [completedIds])

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthlyTx = transactions.filter((t) => t.date.startsWith(thisMonth))
  const monthlyIncome = monthlyTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthlyExpense = monthlyTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = monthlyIncome - monthlyExpense
  const pendingWishlist = wishlist.filter((w) => w.status === 'want').length

  const color = domain.color

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 space-y-5 md:max-w-none md:px-0 md:pt-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl flex-shrink-0"
            style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
          >
            <ArrowRight size={20} style={{ color: 'var(--foreground)', transform: isRTL ? 'none' : 'rotate(180deg)' }} />
          </button>
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${color}22` }}
          >
            {domain.icon}
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
              {isRTL ? domain.nameHe : domain.nameEn}
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'החודש' : 'This month'}
            </p>
          </div>
        </div>

        {!schemaReady && <SchemaBanner isRTL={isRTL} />}

        {/* Monthly summary */}
        <div className="grid grid-cols-3 gap-2">
          <StatTile
            color="#10b981"
            icon={<TrendingUp size={15} />}
            label={isRTL ? 'הכנסות' : 'Income'}
            value={fmt(monthlyIncome)}
          />
          <StatTile
            color="#ef4444"
            icon={<TrendingDown size={15} />}
            label={isRTL ? 'הוצאות' : 'Expenses'}
            value={fmt(monthlyExpense)}
          />
          <StatTile
            color={balance >= 0 ? color : '#ef4444'}
            icon={<Flame size={15} />}
            label={isRTL ? 'יתרה' : 'Balance'}
            value={fmt(balance)}
          />
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
          <TabButton active={tab === 'transactions'} onClick={() => setTab('transactions')} color={color}>
            {isRTL ? 'עסקאות' : 'Transactions'}
          </TabButton>
          <TabButton active={tab === 'wishlist'} onClick={() => setTab('wishlist')} color={color}>
            {isRTL ? `קנייה${pendingWishlist > 0 ? ` (${pendingWishlist})` : ''}` : `Wishlist${pendingWishlist > 0 ? ` (${pendingWishlist})` : ''}`}
          </TabButton>
          <TabButton active={tab === 'habits'} onClick={() => setTab('habits')} color={color}>
            {isRTL ? 'הרגלים' : 'Habits'}
          </TabButton>
        </div>

        {tab === 'transactions' && (
          <TransactionsTab transactions={transactions} color={color} isRTL={isRTL} />
        )}
        {tab === 'wishlist' && (
          <WishlistTab wishlist={wishlist} color={color} isRTL={isRTL} />
        )}
        {tab === 'habits' && (
          <DomainHabitsTab
            habits={habits}
            completedSet={completedSet}
            domain={domain}
            userId={userId}
            onAdded={(h) => setHabits((prev) => [...prev, h])}
            isRTL={isRTL}
          />
        )}

      </div>
    </div>
  )
}

// ── Shared primitives ──────────────────────────────────────────

function SchemaBanner({ isRTL }: { isRTL: boolean }) {
  return (
    <Card className="p-4" style={{ borderColor: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}>
      <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
        {isRTL ? 'נדרשת הרצה של מיגרציית SQL' : 'SQL migration required'}
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
        {isRTL
          ? 'הרץ את supabase-finance-schema.sql ב-Supabase'
          : 'Run supabase-finance-schema.sql in Supabase SQL editor'}
      </p>
    </Card>
  )
}

function StatTile({ color, icon, label, value }: {
  color: string; icon: React.ReactNode; label: string; value: string
}) {
  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-1"
      style={{ background: `${color}15`, border: `1px solid ${color}33` }}
    >
      <div className="flex items-center gap-1" style={{ color }}>
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-semibold truncate">{label}</span>
      </div>
      <div className="text-base font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
        {value}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, color, children }: {
  active: boolean; onClick: () => void; color: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all truncate"
      style={{ background: active ? color : 'transparent', color: active ? 'white' : 'var(--muted-foreground)' }}
    >
      {children}
    </button>
  )
}

// ── Transactions Tab ───────────────────────────────────────────

function TransactionsTab({ transactions, color, isRTL }: {
  transactions: FinanceTransaction[]; color: string; isRTL: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [note, setNote] = useState('')
  const [pending, startTransition] = useTransition()

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const submit = () => {
    const n = parseInt(amount)
    if (!n || n <= 0) return
    startTransition(async () => {
      await createTransaction({ amount: n, type, category, note: note.trim() || undefined })
      setAmount(''); setNote(''); setCategory('food')
      setAdding(false)
    })
  }

  return (
    <div className="space-y-3">
      {transactions.length === 0 && !adding && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'אין עסקאות עדיין' : 'No transactions yet'}
        </p>
      )}

      {transactions.slice(0, 50).map((tx) => (
        <TransactionRow key={tx.id} tx={tx} isRTL={isRTL} />
      ))}

      {adding ? (
        <Card className="p-4 space-y-3">
          {/* Income / Expense toggle */}
          <div
            className="flex rounded-xl overflow-hidden"
            style={{ border: `1px solid var(--border)` }}
          >
            <button
              onClick={() => { setType('expense'); setCategory('food') }}
              className="flex-1 py-2 text-sm font-semibold transition-all"
              style={{
                background: type === 'expense' ? '#ef4444' : 'transparent',
                color: type === 'expense' ? 'white' : 'var(--muted-foreground)',
              }}
            >
              {isRTL ? '− הוצאה' : '− Expense'}
            </button>
            <button
              onClick={() => { setType('income'); setCategory('pocket') }}
              className="flex-1 py-2 text-sm font-semibold transition-all"
              style={{
                background: type === 'income' ? '#10b981' : 'transparent',
                color: type === 'income' ? 'white' : 'var(--muted-foreground)',
              }}
            >
              {isRTL ? '+ הכנסה' : '+ Income'}
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span
                className="absolute start-3 top-1/2 -translate-y-1/2 text-sm font-semibold"
                style={{ color: 'var(--muted-foreground)' }}
              >
                ₪
              </span>
              <Input
                autoFocus
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="0"
                className="rounded-xl ps-8"
                style={{
                  background: 'var(--c-input)',
                  border: '1px solid var(--c-input-border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl px-3 text-sm"
              style={{
                background: 'var(--secondary)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.icon} {isRTL ? c.he : c.value}
                </option>
              ))}
            </select>
          </div>

          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={isRTL ? 'הערה (אופציונלי)' : 'Note (optional)'}
            className="rounded-xl"
            style={{
              background: 'var(--c-input)',
              border: '1px solid var(--c-input-border)',
              color: 'var(--foreground)',
            }}
          />

          <div className="flex gap-2">
            <Button
              onClick={submit}
              disabled={pending || !amount || parseInt(amount) <= 0}
              className="flex-1"
              style={{
                background: type === 'income' ? '#10b981' : '#ef4444',
                color: 'white',
              }}
            >
              {isRTL ? 'שמור' : 'Save'}
            </Button>
            <button
              onClick={() => { setAdding(false); setAmount(''); setNote('') }}
              className="p-2 rounded-xl"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
            >
              <X size={18} />
            </button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed transition-all"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <Plus size={18} />
          <span className="text-sm">{isRTL ? 'הוסף עסקה' : 'Add Transaction'}</span>
        </button>
      )}
    </div>
  )
}

function TransactionRow({ tx, isRTL }: { tx: FinanceTransaction; isRTL: boolean }) {
  const [pending, startTransition] = useTransition()
  const isIncome = tx.type === 'income'
  const allCats = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
  const cat = allCats.find((c) => c.value === tx.category)
  const dateLabel = tx.date.slice(5).replace('-', '/')

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: 'var(--card)', border: '1px solid var(--c-border)' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
        style={{ background: isIncome ? '#10b98120' : '#ef444420' }}
      >
        {cat?.icon ?? '💸'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-base font-bold tabular-nums"
            style={{ color: isIncome ? '#10b981' : '#ef4444' }}
          >
            {isIncome ? '+' : '−'}{fmt(tx.amount)}
          </span>
          <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
            {dateLabel}
          </span>
        </div>
        <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
          {cat ? (isRTL ? cat.he : cat.value) : tx.category}
          {tx.note && ` · ${tx.note}`}
        </p>
      </div>
      <button
        onClick={() => startTransition(async () => { await deleteTransaction(tx.id) })}
        disabled={pending}
        className="p-1.5 flex-shrink-0"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ── Wishlist Tab ───────────────────────────────────────────────

function WishlistTab({ wishlist, color, isRTL }: {
  wishlist: FinanceWishlistItem[]; color: string; isRTL: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!title.trim()) return
    startTransition(async () => {
      await createWishlistItem({
        title: title.trim(),
        estimated_price: price ? parseInt(price) : null,
      })
      setTitle(''); setPrice('')
      setAdding(false)
    })
  }

  const want = wishlist.filter((w) => w.status === 'want')
  const bought = wishlist.filter((w) => w.status === 'bought')

  return (
    <div className="space-y-3">
      {wishlist.length === 0 && !adding && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'רשימת הקניות ריקה' : 'Wishlist is empty'}
        </p>
      )}

      {want.map((item) => (
        <WishlistRow key={item.id} item={item} color={color} isRTL={isRTL} />
      ))}

      {bought.length > 0 && (
        <>
          <p className="text-xs uppercase tracking-wider pt-2" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'נקנה' : 'Purchased'}
          </p>
          {bought.map((item) => (
            <WishlistRow key={item.id} item={item} color={color} isRTL={isRTL} />
          ))}
        </>
      )}

      {adding ? (
        <Card className="p-4 space-y-3">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={isRTL ? 'מה אתה רוצה לקנות?' : 'What do you want to buy?'}
          />
          <div className="relative">
            <span
              className="absolute start-3 top-1/2 -translate-y-1/2 text-sm font-semibold"
              style={{ color: 'var(--muted-foreground)' }}
            >
              ₪
            </span>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={isRTL ? 'מחיר משוער (אופציונלי)' : 'Estimated price (optional)'}
              className="ps-8"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={submit}
              disabled={pending || !title.trim()}
              className="flex-1"
              style={{ background: color, color: 'white' }}
            >
              {isRTL ? 'הוסף לרשימה' : 'Add to list'}
            </Button>
            <button
              onClick={() => { setAdding(false); setTitle(''); setPrice('') }}
              className="p-2 rounded-xl"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
            >
              <X size={18} />
            </button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <ShoppingBag size={18} />
          <span className="text-sm">{isRTL ? 'הוסף פריט' : 'Add Item'}</span>
        </button>
      )}
    </div>
  )
}

function WishlistRow({ item, color, isRTL }: {
  item: FinanceWishlistItem; color: string; isRTL: boolean
}) {
  const [pending, startTransition] = useTransition()
  const bought = item.status === 'bought'

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: 'var(--card)', border: '1px solid var(--c-border)', opacity: bought ? 0.55 : 1 }}
    >
      <button
        onClick={() => startTransition(async () => {
          await updateWishlistStatus(item.id, bought ? 'want' : 'bought')
        })}
        disabled={pending}
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
        style={{ background: bought ? color : 'transparent', border: `2px solid ${color}` }}
      >
        {bought && <Check size={13} color="white" />}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: 'var(--foreground)', textDecoration: bought ? 'line-through' : 'none' }}
        >
          {item.title}
        </p>
        {item.estimated_price && (
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {fmt(item.estimated_price)}
          </p>
        )}
      </div>

      <button
        onClick={() => startTransition(async () => { await deleteWishlistItem(item.id) })}
        disabled={pending}
        className="p-1.5 flex-shrink-0"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
