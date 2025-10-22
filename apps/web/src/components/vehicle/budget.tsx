'use client'

import { FC } from 'react'

export const Budget: FC = () => {
  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="text-lg font-semibold mb-4">Budget & Expenses</h2>
      <p className="text-muted-foreground">Financial tracking for repairs and parts will be managed here.</p>
    </div>
  )
}