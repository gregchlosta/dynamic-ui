import type { ShowCardGridArgs } from '../../types'

const CardGrid = ({ title, cards }: ShowCardGridArgs) => {
  return (
    <div className='bg-white rounded-2xl shadow-lg p-6 my-4 border border-gray-200'>
      <h3 className='text-2xl font-bold text-gray-800 mb-6'>{title}</h3>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {cards.map((card, idx) => (
          <div
            key={idx}
            className='bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300 cursor-pointer group'
          >
            {/* Image */}
            {card.image && (
              <div className='h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-6xl overflow-hidden'>
                {card.image.startsWith('http') ? (
                  <img
                    src={card.image}
                    alt={card.title}
                    className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
                  />
                ) : (
                  <span className='group-hover:scale-110 transition-transform duration-300'>
                    {card.image}
                  </span>
                )}
              </div>
            )}

            {/* Content */}
            <div className='p-5'>
              <h4 className='text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors'>
                {card.title}
              </h4>
              <p className='text-gray-600 text-sm mb-4 line-clamp-3'>
                {card.description}
              </p>

              {/* Tags */}
              {card.tags && card.tags.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {card.tags.map((tag, tagIdx) => (
                    <span
                      key={tagIdx}
                      className='px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-xs font-semibold rounded-full'
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CardGrid
