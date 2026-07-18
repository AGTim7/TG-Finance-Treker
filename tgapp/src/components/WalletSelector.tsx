import { WalletCards } from 'lucide-react'

import type { Wallet } from '@/api/types'
import { formatMoney } from '@/lib/format'
import { triggerHaptic } from '@/utils/triggerHaptic'

type WalletSelectorProps = {
  wallets: Wallet[]
  value?: string
  onChange: (walletId?: string) => void
  showBalance?: boolean
}

export default function WalletSelector({
  wallets,
  value,
  onChange,
  showBalance = false,
}: WalletSelectorProps) {
  const options = [
    { id: undefined, name: 'Все кошельки', emoji: null, balance: null },
    ...wallets.map((wallet) => ({
      id: wallet.id,
      name: wallet.name,
      emoji: wallet.emoji,
      balance: wallet.balance,
    })),
  ]

  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max gap-2" role="radiogroup" aria-label="Кошелёк">
        {options.map((option) => {
          const selected = option.id === value
          return (
            <button
              key={option.id ?? 'all'}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                triggerHaptic('selection')
                onChange(option.id)
              }}
              className={`flex h-11 items-center gap-2 rounded-lg border px-3 text-left transition-all active:scale-[0.98] ${
                selected
                  ? 'border-tg-button bg-tg-button/10 text-tg-text'
                  : 'border-tg-hint/12 bg-tg-section-bg text-tg-subtitle-text'
              }`}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-tg-secondary-bg text-base">
                {option.emoji ?? <WalletCards className="size-4" />}
              </span>
              <span className="max-w-36 truncate text-xs font-semibold">{option.name}</span>
              {showBalance && option.balance !== null && (
                <span className="text-[11px] font-bold tabular-nums text-tg-hint">
                  {formatMoney(option.balance)} ₽
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
