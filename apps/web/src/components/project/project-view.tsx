"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  IconPlus, 
  IconCheck, 
  IconX, 
  IconAlertTriangle, 
  IconSettings, 
  IconCurrency,
  IconTool,
  IconChevronRight,
  IconEdit,
  IconTrash,
  IconClipboard,
  IconCalculator,
  IconExclamationCircle
} from "@tabler/icons-react"

interface ProjectViewProps {
  projectName: string
  projectId: string
}

interface TodoItem {
  id: string
  title: string
  completed: boolean
  priority: "low" | "medium" | "high"
}

interface Fault {
  id: string
  title: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "in_progress" | "resolved"
  createdAt: string
}

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
}

export function ProjectView({ projectName, projectId }: ProjectViewProps) {
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: "1", title: "Check engine oil level", completed: false, priority: "high" },
    { id: "2", title: "Replace air filter", completed: true, priority: "medium" },
    { id: "3", title: "Inspect brake pads", completed: false, priority: "high" },
  ])

  const [faults, setFaults] = useState<Fault[]>([
    {
      id: "1",
      title: "Heat AC Issue",
      description: "AC not blowing cold air consistently",
      severity: "medium",
      status: "open",
      createdAt: "2024-02-27"
    },
    {
      id: "2", 
      title: "Engine Oil Leak",
      description: "Small oil leak detected under engine bay",
      severity: "high",
      status: "in_progress",
      createdAt: "2024-02-20"
    }
  ])

  const [expenses, setExpenses] = useState<Expense[]>([
    { id: "1", description: "Oil Change", amount: 45.99, category: "Maintenance", date: "2024-02-15" },
    { id: "2", description: "New Brake Pads", amount: 89.50, category: "Parts", date: "2024-02-10" },
    { id: "3", description: "Diagnostic Fee", amount: 120.00, category: "Service", date: "2024-02-05" },
  ])

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const budget = 1500.00

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500"
      case "high": return "bg-orange-500"
      case "medium": return "bg-yellow-500"
      case "low": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-red-500"
      case "medium": return "border-l-yellow-500"
      case "low": return "border-l-green-500"
      default: return "border-l-gray-500"
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a]">
      {/* 3D Scene Header */}
      <div className="h-64 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <IconTool className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{projectName}</h1>
            <p className="text-gray-300">Vehicle Project Dashboard</p>
          </div>
        </div>
      </div>

      {/* Main Content - Grid Layout like the example */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          
          {/* To-Do List Section */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center space-x-2">
                <IconClipboard className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-white">To-Do List</CardTitle>
              </div>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <IconPlus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <div className="space-y-3">
                  {todos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`flex items-center space-x-3 p-3 border-l-4 ${getPriorityColor(todo.priority)} bg-gray-800 rounded-r-lg hover:bg-gray-750 transition-colors`}
                    >
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          todo.completed 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-gray-400 hover:border-white'
                        }`}
                      >
                        {todo.completed && <IconCheck className="w-3 h-3 text-white" />}
                      </button>
                      <span className={`flex-1 ${todo.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                        {todo.title}
                      </span>
                      <Badge variant={todo.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                        {todo.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Faults Section */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center space-x-2">
                <IconExclamationCircle className="w-5 h-5 text-red-400" />
                <CardTitle className="text-white">Faults</CardTitle>
              </div>
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                <IconPlus className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <div className="space-y-3">
                  {faults.map((fault) => (
                    <div key={fault.id} className="p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white text-sm">{fault.title}</h4>
                        <Badge className={`${getSeverityColor(fault.severity)} text-white text-xs`}>
                          {fault.severity}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-xs mb-2 line-clamp-2">{fault.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{fault.createdAt}</span>
                        <Badge variant="outline" className="border-gray-600 text-xs">
                          {fault.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Manage Section */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center space-x-2">
                <IconTool className="w-5 h-5 text-green-400" />
                <CardTitle className="text-white">Manage</CardTitle>
              </div>
              <Button size="sm" variant="outline" className="border-gray-600">
                <IconSettings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Project Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-white">{todos.length}</div>
                    <div className="text-xs text-gray-400">Total Tasks</div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-white">
                      {faults.filter(f => f.status !== "resolved").length}
                    </div>
                    <div className="text-xs text-gray-400">Open Issues</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Quick Actions</h4>
                  <Button className="w-full justify-start text-sm h-9" variant="ghost">
                    <IconEdit className="w-4 h-4 mr-2" />
                    Edit Project Details
                  </Button>
                  <Button className="w-full justify-start text-sm h-9" variant="ghost">
                    <IconTrash className="w-4 h-4 mr-2 text-red-400" />
                    <span className="text-red-400">Archive Project</span>
                  </Button>
                  <Button className="w-full justify-start text-sm h-9" variant="ghost">
                    <IconAlertTriangle className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>

                {/* Project Progress */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">Project Progress</h4>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(todos.filter(t => t.completed).length / todos.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {todos.filter(t => t.completed).length} of {todos.length} tasks completed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget & Expenses Section */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center space-x-2">
                <IconCalculator className="w-5 h-5 text-yellow-400" />
                <CardTitle className="text-white">Budget & Expenses</CardTitle>
              </div>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <IconPlus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Budget Overview */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Budget Used</span>
                    <span className="text-lg font-semibold text-white">
                      {((totalExpenses / budget) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((totalExpenses / budget) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>${totalExpenses.toFixed(2)} spent</span>
                    <span>${budget.toFixed(2)} total</span>
                  </div>
                </div>

                {/* Recent Expenses */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Recent Expenses</h4>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {expenses.map((expense) => (
                        <div key={expense.id} className="flex items-center justify-between p-2 bg-gray-800 rounded hover:bg-gray-750 transition-colors">
                          <div>
                            <div className="text-sm text-white">{expense.description}</div>
                            <div className="text-xs text-gray-500">{expense.category} • {expense.date}</div>
                          </div>
                          <div className="text-sm font-medium text-white">${expense.amount.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}