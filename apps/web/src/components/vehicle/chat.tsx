'use client'

import { FC } from 'react'

export const Chat: FC = () => {
  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="text-lg font-semibold mb-4">Chat History</h2>
      <p className="text-muted-foreground">Vehicle conversation history and chat management.</p>
    </div>
  )
}