'use client'

import { FC } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export const ProjectDashboard: FC = () => {
  return (
    <div className="flex h-full flex-col">
      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <div className="border-b px-6 py-4">
          <h1 className="text-2xl font-bold mb-2">Dashboard & Budget</h1>
          <TabsList className="bg-transparent border-b-0">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Project Overview
            </TabsTrigger>
            <TabsTrigger value="budget" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Budget & Expenses
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="flex-1 p-6">
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Project Manager Dashboard</h2>
            <p className="text-muted-foreground">
              Comprehensive project overview with health scores, timelines, and progress tracking.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Active Projects</h3>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">2 on track, 1 needs attention</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Total Budget</h3>
                <p className="text-2xl font-bold">$2,450</p>
                <p className="text-sm text-muted-foreground">Across all projects</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Progress</h3>
                <p className="text-2xl font-bold">67%</p>
                <p className="text-sm text-muted-foreground">Average completion</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="budget" className="flex-1 p-6">
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Budget & Expenses</h2>
            <p className="text-muted-foreground">
              Financial tracking for repairs and parts management.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Recent Expenses</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 border rounded">
                    <span>Engine Oil Change</span>
                    <span>$65.00</span>
                  </div>
                  <div className="flex justify-between p-2 border rounded">
                    <span>Brake Pads</span>
                    <span>$120.00</span>
                  </div>
                  <div className="flex justify-between p-2 border rounded">
                    <span>Air Filter</span>
                    <span>$25.00</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold">Budget Categories</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 border rounded">
                    <span>Maintenance</span>
                    <span>$450 / $800</span>
                  </div>
                  <div className="flex justify-between p-2 border rounded">
                    <span>Parts</span>
                    <span>$320 / $600</span>
                  </div>
                  <div className="flex justify-between p-2 border rounded">
                    <span>Tools</span>
                    <span>$180 / $400</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 p-6">
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Analytics & Reports</h2>
            <p className="text-muted-foreground">
              Detailed analytics and reporting for project performance.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Cost per Mile</h3>
                <p className="text-2xl font-bold">$0.12</p>
                <p className="text-sm text-muted-foreground">Last 30 days</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Efficiency Score</h3>
                <p className="text-2xl font-bold">85%</p>
                <p className="text-sm text-muted-foreground">Above average</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}