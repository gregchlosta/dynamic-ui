const ProgressTracker = ({ title, steps }) => {
  const completedCount = steps.filter((s) => s.status === 'completed').length
  const inProgressIndex = steps.findIndex((s) => s.status === 'in-progress')
  const progressPercent = (completedCount / steps.length) * 100

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓'
      case 'in-progress':
        return '⋯'
      case 'pending':
      default:
        return '○'
    }
  }

  const getStepColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white'
      case 'in-progress':
        return 'bg-blue-500 text-white animate-pulse'
      case 'pending':
      default:
        return 'bg-gray-300 text-gray-600'
    }
  }

  const getStepBgColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'in-progress':
        return 'bg-blue-50 border-blue-200 shadow-lg'
      case 'pending':
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className='bg-white rounded-2xl shadow-lg p-6 my-4 border border-gray-200 max-w-3xl'>
      {/* Header */}
      <div className='mb-6'>
        <h3 className='text-2xl font-bold text-gray-800 mb-2'>{title}</h3>

        <div className='flex items-center justify-between text-sm text-gray-600 mb-3'>
          <span>
            {completedCount} of {steps.length} steps completed
          </span>
          <span className='font-semibold'>{Math.round(progressPercent)}%</span>
        </div>

        {/* Progress Bar */}
        <div className='h-3 bg-gray-200 rounded-full overflow-hidden'>
          <div
            className='h-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 transition-all duration-1000'
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className='space-y-4'>
        {steps.map((step, idx) => (
          <div key={idx} className='relative'>
            {/* Connector Line */}
            {idx < steps.length - 1 && (
              <div
                className={`absolute left-5 top-12 w-0.5 h-8 ${
                  step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}

            {/* Step Card */}
            <div
              className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${getStepBgColor(
                step.status
              )}`}
            >
              {/* Status Icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${getStepColor(
                  step.status
                )}`}
              >
                {getStepIcon(step.status)}
              </div>

              {/* Step Content */}
              <div className='flex-1'>
                <div className='flex items-center justify-between mb-1'>
                  <h4
                    className={`font-bold ${
                      step.status === 'completed'
                        ? 'text-green-700'
                        : step.status === 'in-progress'
                        ? 'text-blue-700'
                        : 'text-gray-600'
                    }`}
                  >
                    {step.name}
                  </h4>

                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      step.status === 'completed'
                        ? 'bg-green-200 text-green-800'
                        : step.status === 'in-progress'
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step.status}
                  </span>
                </div>

                {step.description && (
                  <p className='text-sm text-gray-600 mt-2'>
                    {step.description}
                  </p>
                )}

                {step.status === 'in-progress' && (
                  <div className='mt-3 flex items-center gap-2 text-sm text-blue-600 font-medium'>
                    <div className='flex gap-1'>
                      <span className='animate-bounce'>●</span>
                      <span className='animate-bounce delay-100'>●</span>
                      <span className='animate-bounce delay-200'>●</span>
                    </div>
                    <span>Processing...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {completedCount === steps.length && (
        <div className='mt-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border-2 border-green-300'>
          <div className='flex items-center gap-3'>
            <div className='text-3xl'>🎉</div>
            <div>
              <p className='font-bold text-green-800'>All steps completed!</p>
              <p className='text-sm text-green-700'>
                Great job on finishing this project.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressTracker
