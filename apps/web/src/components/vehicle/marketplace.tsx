'use client'

import { FC } from 'react'

export const Marketplace: FC = () => {
  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="text-lg font-semibold mb-4">Parts Marketplace</h2>
      <p className="text-muted-foreground">Find and source compatible parts with price comparison.</p>
    </div>
  )
}