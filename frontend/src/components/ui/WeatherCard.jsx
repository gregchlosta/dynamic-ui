const WeatherCard = ({
  city,
  temperature,
  condition,
  humidity,
  windSpeed,
  forecast,
}) => {
  const getWeatherIcon = (cond) => {
    const icons = {
      sunny: '☀️',
      cloudy: '☁️',
      rainy: '🌧️',
      snowy: '❄️',
      'partly cloudy': '⛅',
      stormy: '⛈️',
    }
    return icons[cond.toLowerCase()] || '🌤️'
  }

  const getWeatherGradient = (cond) => {
    const gradients = {
      sunny: 'from-yellow-400 to-orange-500',
      cloudy: 'from-gray-400 to-gray-600',
      rainy: 'from-blue-400 to-blue-600',
      snowy: 'from-blue-200 to-blue-400',
      'partly cloudy': 'from-blue-300 to-yellow-400',
      stormy: 'from-gray-600 to-purple-800',
    }
    return gradients[cond.toLowerCase()] || 'from-blue-400 to-purple-500'
  }

  return (
    <div className='bg-white rounded-3xl shadow-2xl p-8 my-4 border border-gray-200 max-w-2xl'>
      {/* Header */}
      <div
        className={`bg-gradient-to-r ${getWeatherGradient(
          condition
        )} rounded-2xl p-6 text-white mb-6`}
      >
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-4xl font-bold'>{city}</h2>
            <p className='text-xl mt-2 opacity-90'>{condition}</p>
          </div>
          <div className='text-right'>
            <div className='text-7xl mb-2'>{getWeatherIcon(condition)}</div>
            <div className='text-6xl font-bold'>{temperature}°</div>
          </div>
        </div>
      </div>

      {/* Current Details */}
      <div className='grid grid-cols-2 gap-4 mb-6'>
        <div className='bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4'>
          <div className='text-sm text-gray-600 mb-1'>💧 Humidity</div>
          <div className='text-3xl font-bold text-blue-600'>{humidity}%</div>
        </div>
        <div className='bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4'>
          <div className='text-sm text-gray-600 mb-1'>💨 Wind Speed</div>
          <div className='text-3xl font-bold text-purple-600'>
            {windSpeed} mph
          </div>
        </div>
      </div>

      {/* 3-Day Forecast */}
      <div className='border-t pt-6'>
        <h3 className='text-lg font-semibold mb-4 text-gray-700'>
          3-Day Forecast
        </h3>
        <div className='grid grid-cols-3 gap-4'>
          {forecast.map((day, idx) => (
            <div
              key={idx}
              className='text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:shadow-lg transition-shadow'
            >
              <div className='font-semibold text-gray-700 mb-2'>{day.day}</div>
              <div className='text-4xl my-3'>
                {getWeatherIcon(day.condition)}
              </div>
              <div className='text-sm text-gray-600'>
                <span className='font-bold text-red-500'>{day.high}°</span>
                {' / '}
                <span className='font-bold text-blue-500'>{day.low}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WeatherCard
