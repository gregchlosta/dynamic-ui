import ChartComponent from './ui/ChartComponent'
import WeatherCard from './ui/WeatherCard'
import TaskList from './ui/TaskList'
import CardGrid from './ui/CardGrid'
import ProgressTracker from './ui/ProgressTracker'

const DynamicUIComponent = ({ toolName, toolArgs }) => {
  switch (toolName) {
    case 'show_chart':
      return <ChartComponent {...toolArgs} />
    case 'show_weather_card':
      return <WeatherCard {...toolArgs} />
    case 'show_task_list':
      return <TaskList {...toolArgs} />
    case 'show_card_grid':
      return <CardGrid {...toolArgs} />
    case 'show_progress_tracker':
      return <ProgressTracker {...toolArgs} />
    default:
      return (
        <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <p className='text-yellow-800'>Unknown tool: {toolName}</p>
        </div>
      )
  }
}

export default DynamicUIComponent
