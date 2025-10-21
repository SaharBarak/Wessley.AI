'use client'

import { FC } from 'react'

export const ErrorList: FC = () => {
  return (
    <div className="p-3">
      <h3 className="text-sm font-semibold mb-2">Error List</h3>
      <div className="text-xs text-muted-foreground">
        Active issues with 3D model highlighting
      </div>
    </div>
  )
}