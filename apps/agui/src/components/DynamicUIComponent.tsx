import ChartComponent from './ui/ChartComponent'
import WeatherCard from './ui/WeatherCard'
import TaskList from './ui/TaskList'
import CardGrid from './ui/CardGrid'
import ProgressTracker from './ui/ProgressTracker'
import type { ToolArgs } from '../types'

interface DynamicUIComponentProps {
  toolName: string
  toolArgs: ToolArgs
}

const DynamicUIComponent = ({
  toolName,
  toolArgs,
}: DynamicUIComponentProps) => {
  switch (toolName) {
    case 'show_chart':
      return <ChartComponent {...(toolArgs as any)} />
    case 'show_weather_card':
      return <WeatherCard {...(toolArgs as any)} />
    case 'show_task_list':
      return <TaskList {...(toolArgs as any)} />
    case 'show_card_grid':
      return <CardGrid {...(toolArgs as any)} />
    case 'show_progress_tracker':
      return <ProgressTracker {...(toolArgs as any)} />
    default:
      return (
        <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <p className='text-yellow-800'>Unknown tool: {toolName}</p>
        </div>
      )
  }
}

export default DynamicUIComponent
