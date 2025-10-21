'use client'

import { FC } from 'react'

export const ProjectDashboard: FC = () => {
  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="text-lg font-semibold mb-4">Project Manager Dashboard</h2>
      <p className="text-muted-foreground">Comprehensive project overview with health scores, timelines, and progress tracking.</p>
    </div>
  )
}