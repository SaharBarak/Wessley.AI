'use client'

import { FC, useState } from 'react'
import { ComponentTree } from './component-tree'
import { ComponentList } from './component-list'
import { ErrorList } from './error-list'
import { IconHierarchy, IconList, IconAlertTriangle } from '@tabler/icons-react'

export const SceneExplorer: FC = () => {
  const [activeSection, setActiveSection] = useState<'tree' | 'list' | 'errors'>('tree')
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="absolute top-4 right-4 z-10">
      {/* Vertical Icon Menu */}
      <div className="flex flex-col bg-background border rounded-lg shadow-lg">
        <button
          onClick={() => {
            setActiveSection('tree')
            setIsExpanded(!isExpanded || activeSection !== 'tree')
          }}
          className={`p-3 rounded-t-lg hover:bg-muted transition-colors ${
            activeSection === 'tree' && isExpanded
              ? 'bg-accent text-accent-foreground' 
              : 'text-muted-foreground'
          }`}
          title="Component Tree"
        >
          <IconHierarchy size={20} />
        </button>
        
        <button
          onClick={() => {
            setActiveSection('list')
            setIsExpanded(!isExpanded || activeSection !== 'list')
          }}
          className={`p-3 border-y hover:bg-muted transition-colors ${
            activeSection === 'list' && isExpanded
              ? 'bg-accent text-accent-foreground' 
              : 'text-muted-foreground'
          }`}
          title="Component List"
        >
          <IconList size={20} />
        </button>
        
        <button
          onClick={() => {
            setActiveSection('errors')
            setIsExpanded(!isExpanded || activeSection !== 'errors')
          }}
          className={`p-3 rounded-b-lg hover:bg-muted transition-colors ${
            activeSection === 'errors' && isExpanded
              ? 'bg-accent text-accent-foreground' 
              : 'text-muted-foreground'
          }`}
          title="Error List"
        >
          <IconAlertTriangle size={20} />
        </button>
      </div>

      {/* Expandable Panel */}
      {isExpanded && (
        <div className="absolute top-0 right-16 w-80 bg-background border rounded-lg shadow-lg">
          <div className="p-3 border-b">
            <h3 className="text-sm font-semibold">
              {activeSection === 'tree' && 'Component Tree'}
              {activeSection === 'list' && 'Component List'}
              {activeSection === 'errors' && 'Error List'}
            </h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {activeSection === 'tree' && <ComponentTree />}
            {activeSection === 'list' && <ComponentList />}
            {activeSection === 'errors' && <ErrorList />}
          </div>
        </div>
      )}
    </div>
  )
}