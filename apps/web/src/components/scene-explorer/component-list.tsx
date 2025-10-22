'use client'

import { FC } from 'react'

export const ComponentList: FC = () => {
  return (
    <div className="p-3">
      <h3 className="text-sm font-semibold mb-2">Component List</h3>
      <div className="text-xs text-muted-foreground">
        Searchable flat list of all electrical parts
      </div>
    </div>
  )
}