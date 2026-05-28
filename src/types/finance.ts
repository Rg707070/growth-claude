export type TransactionType = 'income' | 'expense'

export interface FinanceTransaction {
  id: string
  user_id: string
  amount: number
  type: TransactionType
  category: string
  note: string | null
  date: string
  created_at: string
}

export type WishlistStatus = 'want' | 'bought'

export interface FinanceWishlistItem {
  id: string
  user_id: string
  title: string
  estimated_price: number | null
  status: WishlistStatus
  created_at: string
}
