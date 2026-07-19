import { useState, type ReactElement } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, LockKeyhole, Pencil, Plus, Shapes, Trash2, WalletCards } from 'lucide-react'

import { archiveCategory, createCategory, getCategories, updateCategory } from '@/api/categories'
import { getApiErrorMessage } from '@/api/client'
import type { Category, TransactionType, Wallet } from '@/api/types'
import { archiveWallet, createWallet, getWallets, updateWallet } from '@/api/wallets'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { formatMoney } from '@/lib/format'
import { triggerHaptic, triggerNotificationHaptic } from '@/utils/triggerHaptic'

const COLORS = ['#2481CC', '#31B56A', '#F15B5B', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#64748B']
const WALLET_EMOJIS = ['💳', '💵', '🏦', '🪙', '📱', '✈️', '🏠', '🎯']
const EXPENSE_EMOJIS = ['🛒', '🍔', '🚕', '🏠', '💊', '🎁', '🎮', '✈️']
const INCOME_EMOJIS = ['💰', '💼', '📈', '🎁', '🏦', '🧾', '💻', '⭐']

type SettingsTab = 'wallets' | 'categories'

function ChoiceStrip({
  values,
  value,
  onChange,
}: {
  values: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {values.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={value === item}
          onClick={() => { triggerHaptic('selection'); onChange(item) }}
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg border text-lg transition-all ${value === item ? 'border-tg-button bg-tg-button/10' : 'border-tg-hint/10 bg-tg-secondary-bg'}`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

function ColorStrip({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Цвет ${color}`}
          aria-pressed={value === color}
          onClick={() => { triggerHaptic('selection'); onChange(color) }}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: color }}
        >
          {value === color && <Check className="size-4 text-white" />}
        </button>
      ))}
    </div>
  )
}

function FieldBlock({ label, children }: { label: string; children: ReactElement }) {
  return <div className="block space-y-1.5"><span className="block text-xs font-semibold text-tg-subtitle-text">{label}</span>{children}</div>
}

function WalletEditor({ wallet, trigger }: { wallet?: Wallet; trigger: ReactElement }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(WALLET_EMOJIS[0])
  const [color, setColor] = useState(COLORS[0])
  const [initialBalance, setInitialBalance] = useState('0')
  const [isDefault, setIsDefault] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setName(wallet?.name ?? '')
      setEmoji(wallet?.emoji ?? WALLET_EMOJIS[0])
      setColor(wallet?.color ?? COLORS[0])
      setInitialBalance(wallet?.initialBalance ?? '0')
      setIsDefault(wallet?.isDefault ?? false)
    }
    setOpen(nextOpen)
  }

  const closeAndRefresh = async () => {
    triggerNotificationHaptic('success')
    setOpen(false)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wallets'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['analytics'] }),
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] }),
    ])
  }
  const saveMutation = useMutation({
    mutationFn: () => {
      const input = { name: name.trim(), emoji: emoji.trim(), color, initialBalance: initialBalance.replace(',', '.'), isDefault }
      return wallet ? updateWallet(wallet.id, input) : createWallet(input)
    },
    onSuccess: closeAndRefresh,
    onError: () => triggerNotificationHaptic('error'),
  })
  const archiveMutation = useMutation({
    mutationFn: () => archiveWallet(wallet!.id),
    onSuccess: closeAndRefresh,
    onError: () => triggerNotificationHaptic('error'),
  })
  const error = saveMutation.error ?? archiveMutation.error
  const canArchive = wallet?.kind === 'CUSTOM' && !wallet.isDefault && Number(wallet.balance) === 0

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger render={trigger} />
      <DrawerContent className="mx-auto max-w-110 rounded-t-2xl border-t border-tg-hint/10 bg-tg-section-bg text-tg-text">
        <div className="overflow-y-auto px-5 pb-safe">
          <DrawerHeader className="flex-row items-center justify-between px-0 pb-4 pr-11 pt-5 text-left">
            <DrawerTitle className="text-lg font-bold">{wallet ? 'Редактировать кошелёк' : 'Новый кошелёк'}</DrawerTitle>
            {canArchive && (
              <Button type="button" size="icon-sm" variant="ghost" className="text-tg-destructive-text" title="Архивировать кошелёк" aria-label="Архивировать кошелёк" disabled={archiveMutation.isPending} onClick={() => { if (window.confirm('Архивировать этот кошелёк?')) archiveMutation.mutate() }}>
                {archiveMutation.isPending ? <Spinner /> : <Trash2 />}
              </Button>
            )}
          </DrawerHeader>
          <form className="space-y-4 pb-5" onSubmit={(event) => { event.preventDefault(); triggerHaptic('heavy'); saveMutation.mutate() }}>
            <FieldBlock label="Название"><Input aria-label="Название кошелька" value={name} onChange={(event) => setName(event.target.value)} maxLength={40} placeholder="Например, Накопления" className="h-11 bg-tg-secondary-bg" autoFocus /></FieldBlock>
            <FieldBlock label="Эмодзи"><div><ChoiceStrip values={WALLET_EMOJIS} value={emoji} onChange={setEmoji} /><Input value={emoji} onChange={(event) => setEmoji(event.target.value)} maxLength={8} className="mt-2 h-10 bg-tg-secondary-bg" aria-label="Своё эмодзи" /></div></FieldBlock>
            <FieldBlock label="Цвет"><div><ColorStrip value={color} onChange={setColor} /></div></FieldBlock>
            <FieldBlock label="Начальный остаток"><Input aria-label="Начальный остаток" value={initialBalance} onChange={(event) => setInitialBalance(event.target.value.replace(/[^0-9.,-]/g, ''))} inputMode="decimal" className="h-11 bg-tg-secondary-bg" /></FieldBlock>
            <label className="flex h-12 items-center justify-between rounded-lg bg-tg-secondary-bg px-3">
              <span className="text-sm font-semibold">Основной кошелёк</span>
              <input type="checkbox" checked={isDefault} disabled={wallet?.isDefault} onChange={(event) => setIsDefault(event.target.checked)} className="size-5 accent-(--color-tg-button)" />
            </label>
            {error && <p role="alert" className="text-center text-xs text-tg-destructive-text">{getApiErrorMessage(error)}</p>}
            <Button type="submit" disabled={!name.trim() || !emoji.trim() || saveMutation.isPending} className="h-12 w-full rounded-xl text-sm font-bold">
              {saveMutation.isPending && <Spinner />}{saveMutation.isPending ? 'Сохраняем...' : 'Сохранить'}
            </Button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function CategoryEditor({ category, type, trigger }: { category?: Category; type: TransactionType; trigger: ReactElement }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const presets = type === 'EXPENSE' ? EXPENSE_EMOJIS : INCOME_EMOJIS
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(presets[0])
  const [color, setColor] = useState(COLORS[0])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setName(category?.name ?? '')
      setEmoji(category?.emoji ?? presets[0])
      setColor(category?.color ?? COLORS[0])
    }
    setOpen(nextOpen)
  }

  const closeAndRefresh = async () => {
    triggerNotificationHaptic('success')
    setOpen(false)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['categories'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['analytics'] }),
    ])
  }
  const saveMutation = useMutation({
    mutationFn: () => category
      ? updateCategory(category.id, { name: name.trim(), emoji: emoji.trim(), color })
      : createCategory({ name: name.trim(), emoji: emoji.trim(), color, type }),
    onSuccess: closeAndRefresh,
    onError: () => triggerNotificationHaptic('error'),
  })
  const archiveMutation = useMutation({
    mutationFn: () => archiveCategory(category!.id),
    onSuccess: closeAndRefresh,
    onError: () => triggerNotificationHaptic('error'),
  })
  const error = saveMutation.error ?? archiveMutation.error

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger render={trigger} />
      <DrawerContent className="mx-auto max-w-110 rounded-t-2xl border-t border-tg-hint/10 bg-tg-section-bg text-tg-text">
        <div className="overflow-y-auto px-5 pb-safe">
          <DrawerHeader className="flex-row items-center justify-between px-0 pb-4 pr-11 pt-5 text-left">
            <DrawerTitle className="text-lg font-bold">{category ? 'Редактировать категорию' : 'Новая категория'}</DrawerTitle>
            {category && <Button type="button" size="icon-sm" variant="ghost" className="text-tg-destructive-text" title="Архивировать категорию" aria-label="Архивировать категорию" disabled={archiveMutation.isPending} onClick={() => { if (window.confirm('Архивировать эту категорию? Старые транзакции сохранятся.')) archiveMutation.mutate() }}>{archiveMutation.isPending ? <Spinner /> : <Trash2 />}</Button>}
          </DrawerHeader>
          <form className="space-y-4 pb-5" onSubmit={(event) => { event.preventDefault(); triggerHaptic('heavy'); saveMutation.mutate() }}>
            <FieldBlock label="Название"><Input aria-label="Название категории" value={name} onChange={(event) => setName(event.target.value)} maxLength={40} placeholder="Название категории" className="h-11 bg-tg-secondary-bg" autoFocus /></FieldBlock>
            <FieldBlock label="Эмодзи"><div><ChoiceStrip values={presets} value={emoji} onChange={setEmoji} /><Input value={emoji} onChange={(event) => setEmoji(event.target.value)} maxLength={8} className="mt-2 h-10 bg-tg-secondary-bg" aria-label="Своё эмодзи" /></div></FieldBlock>
            <FieldBlock label="Цвет"><div><ColorStrip value={color} onChange={setColor} /></div></FieldBlock>
            {error && <p role="alert" className="text-center text-xs text-tg-destructive-text">{getApiErrorMessage(error)}</p>}
            <Button type="submit" disabled={!name.trim() || !emoji.trim() || saveMutation.isPending} className="h-12 w-full rounded-xl text-sm font-bold">{saveMutation.isPending && <Spinner />}{saveMutation.isPending ? 'Сохраняем...' : 'Сохранить'}</Button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function WalletsSettings() {
  const query = useQuery({ queryKey: ['wallets'], queryFn: getWallets })
  return (
    <section className="animate-page-enter mt-5">
      <div className="mb-2 flex items-center justify-between border-b border-tg-hint/10 pb-2">
        <h2 className="text-base font-bold">Кошельки</h2>
        <WalletEditor trigger={<Button type="button" size="icon-sm" title="Добавить кошелёк" aria-label="Добавить кошелёк"><Plus /></Button>} />
      </div>
      {query.isLoading && <div className="space-y-2">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-16 bg-tg-secondary-bg" />)}</div>}
      {query.isError && <p className="py-5 text-sm text-tg-destructive-text">{getApiErrorMessage(query.error)}</p>}
      {query.data?.items.map((wallet) => (
        <WalletEditor key={wallet.id} wallet={wallet} trigger={(
          <button type="button" className="flex h-16 w-full items-center justify-between gap-3 border-b border-tg-hint/8 text-left last:border-0">
            <span className="flex min-w-0 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg text-xl" style={{ backgroundColor: `${wallet.color}18` }}>{wallet.emoji}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{wallet.name}</span><span className="block text-xs text-tg-hint">{wallet.isDefault ? 'Основной' : wallet.kind === 'CUSTOM' ? 'Пользовательский' : 'Встроенный'}</span></span></span>
            <span className="flex shrink-0 items-center gap-2"><span className="text-sm font-bold tabular-nums">{formatMoney(wallet.balance)} ₽</span><Pencil className="size-4 text-tg-hint" /></span>
          </button>
        )} />
      ))}
    </section>
  )
}

function CategoriesSettings() {
  const [type, setType] = useState<TransactionType>('EXPENSE')
  const query = useQuery({ queryKey: ['categories', type], queryFn: () => getCategories(type) })
  return (
    <section className="animate-page-enter mt-5">
      <div className="mb-3 grid grid-cols-2 rounded-lg bg-tg-secondary-bg p-1">
        {(['EXPENSE', 'INCOME'] as const).map((value) => <button key={value} type="button" onClick={() => { triggerHaptic('selection'); setType(value) }} className={`h-9 rounded-md text-xs font-semibold ${type === value ? 'bg-tg-section-bg text-tg-text shadow-sm' : 'text-tg-hint'}`}>{value === 'EXPENSE' ? 'Расходы' : 'Доходы'}</button>)}
      </div>
      <div className="mb-2 flex items-center justify-between border-b border-tg-hint/10 pb-2">
        <h2 className="text-base font-bold">Категории</h2>
        <CategoryEditor type={type} trigger={<Button type="button" size="icon-sm" title="Добавить категорию" aria-label="Добавить категорию"><Plus /></Button>} />
      </div>
      {query.isLoading && <div className="space-y-2">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14 bg-tg-secondary-bg" />)}</div>}
      {query.isError && <p className="py-5 text-sm text-tg-destructive-text">{getApiErrorMessage(query.error)}</p>}
      {query.data?.map((category) => {
        const row = <span className="flex h-14 w-full items-center justify-between gap-3 border-b border-tg-hint/8 text-left last:border-0"><span className="flex min-w-0 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg text-lg" style={{ backgroundColor: `${category.color}18` }}>{category.emoji}</span><span className="truncate text-sm font-semibold">{category.name}</span></span>{category.userId ? <Pencil className="size-4 shrink-0 text-tg-hint" /> : <LockKeyhole className="size-4 shrink-0 text-tg-hint/60" />}</span>
        return category.userId
          ? <CategoryEditor key={category.id} category={category} type={type} trigger={<button type="button" className="w-full">{row}</button>} />
          : <div key={category.id}>{row}</div>
      })}
    </section>
  )
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('wallets')
  return (
    <div className="min-h-screen bg-tg-bg px-4 pb-28 pt-5 text-tg-text select-none">
      <header className="animate-page-enter"><h1 className="text-2xl font-bold">Настройки</h1></header>
      <div className="mt-4 grid grid-cols-2 rounded-lg bg-tg-secondary-bg p-1">
        <button type="button" onClick={() => { triggerHaptic('selection'); setTab('wallets') }} className={`flex h-10 items-center justify-center gap-2 rounded-md text-xs font-semibold transition-all ${tab === 'wallets' ? 'bg-tg-section-bg text-tg-text shadow-sm' : 'text-tg-hint'}`}><WalletCards className="size-4" />Кошельки</button>
        <button type="button" onClick={() => { triggerHaptic('selection'); setTab('categories') }} className={`flex h-10 items-center justify-center gap-2 rounded-md text-xs font-semibold transition-all ${tab === 'categories' ? 'bg-tg-section-bg text-tg-text shadow-sm' : 'text-tg-hint'}`}><Shapes className="size-4" />Категории</button>
      </div>
      {tab === 'wallets' ? <WalletsSettings /> : <CategoriesSettings />}
    </div>
  )
}
