'use client'

import { FC } from 'react'

export const ComponentTree: FC = () => {
  return (
    <div className="p-3">
      <h3 className="text-sm font-semibold mb-2">Component Tree</h3>
      <div className="text-xs text-muted-foreground">
        Hierarchical view: Engine → Ignition → Starter → Relays
      </div>
    </div>
  )
}