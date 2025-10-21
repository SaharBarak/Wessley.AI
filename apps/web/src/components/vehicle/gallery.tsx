'use client'

import { FC } from 'react'

export const Gallery: FC = () => {
  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="text-lg font-semibold mb-4">Gallery</h2>
      <p className="text-muted-foreground">Vehicle photos, diagrams, and documentation will appear here.</p>
    </div>
  )
}