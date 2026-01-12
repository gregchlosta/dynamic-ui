import { useState } from 'react'
import type { ShowTaskListArgs, Task } from '../../types'

const TaskList = ({ title, tasks: initialTasks }: ShowTaskListArgs) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  const toggleTask = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    )
  }

  const getPriorityColor = (priority: Task['priority']): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getPriorityIcon = (priority: Task['priority']): string => {
    switch (priority) {
      case 'high':
        return '🔴'
      case 'medium':
        return '🟡'
      case 'low':
        return '🟢'
      default:
        return '⚪'
    }
  }

  const completedCount = tasks.filter((t) => t.completed).length
  const progressPercent = (completedCount / tasks.length) * 100

  return (
    <div className='bg-white rounded-2xl shadow-lg p-6 my-4 border border-gray-200 max-w-2xl'>
      {/* Header */}
      <div className='mb-6'>
        <h3 className='text-2xl font-bold text-gray-800 mb-2'>{title}</h3>
        <div className='flex items-center justify-between text-sm text-gray-600 mb-3'>
          <span>
            {completedCount} of {tasks.length} completed
          </span>
          <span>{Math.round(progressPercent)}%</span>
        </div>

        {/* Progress Bar */}
        <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
          <div
            className='h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500'
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className='space-y-3'>
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
              task.completed
                ? 'bg-gray-50 border-gray-200'
                : 'bg-white border-gray-300 hover:border-blue-400'
            }`}
            onClick={() => toggleTask(task.id)}
          >
            {/* Checkbox */}
            <div
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                task.completed
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-transparent'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              {task.completed && <span className='text-white text-sm'>✓</span>}
            </div>

            {/* Task Text */}
            <div className='flex-1'>
              <p
                className={`font-medium ${
                  task.completed
                    ? 'text-gray-500 line-through'
                    : 'text-gray-800'
                }`}
              >
                {task.text}
              </p>
            </div>

            {/* Priority Badge */}
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(
                task.priority
              )}`}
            >
              {getPriorityIcon(task.priority)} {task.priority}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TaskList
