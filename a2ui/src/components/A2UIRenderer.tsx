import React from 'react'
import type { UISpecification } from '../types'

interface A2UIRendererProps {
  spec: UISpecification
}

/**
 * A2UIRenderer - Interprets and renders declarative UI specifications
 *
 * This component takes a UISpecification object and dynamically renders
 * the appropriate React components based on the specification.
 */
export const A2UIRenderer: React.FC<A2UIRendererProps> = ({ spec }) => {
  return <UIComponent spec={spec} />
}

/**
 * UIComponent - Recursive component renderer
 * Maps component types to actual React elements
 */
const UIComponent: React.FC<{ spec: UISpecification }> = ({ spec }) => {
  // Validate spec
  if (!spec || typeof spec !== 'object') {
    console.warn('Invalid spec provided:', spec)
    return null
  }

  const { component, props = {}, children = [], layout, style } = spec

  // Check if component type is valid
  if (!component || typeof component !== 'string') {
    console.warn('Missing or invalid component type:', spec)
    return (
      <div className='p-3 bg-red-50 border border-red-200 rounded-lg text-sm'>
        <span className='text-red-800 font-semibold'>⚠️ Invalid component</span>
        <p className='text-red-600 text-xs mt-1'>
          Component type is missing or invalid
        </p>
      </div>
    )
  }

  // Map component types to renderers
  switch (component) {
    case 'container':
      return (
        <div className={getLayoutClasses(layout)} style={style}>
          {children
            .filter((child) => child && child.component)
            .map((child, idx) => (
              <UIComponent key={idx} spec={child} />
            ))}
        </div>
      )

    case 'card':
      return (
        <div
          className='bg-white rounded-2xl shadow-lg p-6 my-4 border border-gray-200'
          style={style}
        >
          {children
            .filter((child) => child && child.component)
            .map((child, idx) => (
              <UIComponent key={idx} spec={child} />
            ))}
        </div>
      )

    case 'heading':
      const HeadingTag = `h${props.level || 2}` as keyof JSX.IntrinsicElements
      return (
        <HeadingTag
          className={`font-bold text-gray-800 mb-4 ${getHeadingSize(
            props.level || 2
          )}`}
          style={style}
        >
          {props.text}
        </HeadingTag>
      )

    case 'text':
      return (
        <p className='text-gray-700 leading-relaxed' style={style}>
          {props.content}
        </p>
      )

    case 'button':
      return (
        <button
          className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
          style={style}
        >
          {props.label}
        </button>
      )

    case 'image':
      return (
        <img
          src={props.src}
          alt={props.alt || ''}
          className='rounded-lg w-full object-cover'
          style={style}
        />
      )

    case 'list':
      return (
        <ul className='space-y-2' style={style}>
          {(props.items || []).map((item: string, idx: number) => (
            <li key={idx} className='flex items-start gap-3'>
              <span className='text-blue-500 font-bold mt-1'>•</span>
              <span className='text-gray-700'>{item}</span>
            </li>
          ))}
        </ul>
      )

    case 'grid':
      return (
        <div
          className={`grid gap-4 ${getGridCols(props.columns)}`}
          style={style}
        >
          {children
            .filter((child) => child && child.component)
            .map((child, idx) => (
              <UIComponent key={idx} spec={child} />
            ))}
        </div>
      )

    case 'badge':
      return (
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getBadgeColor(
            props.color
          )}`}
          style={style}
        >
          {props.text}
        </span>
      )

    case 'divider':
      return <hr className='my-4 border-gray-200' style={style} />

    case 'spacer':
      return <div style={{ height: props.height || 16, ...style }} />

    case 'metric':
      return (
        <div className='flex flex-col' style={style}>
          <span className='text-4xl font-bold text-gray-900'>
            {props.value}
          </span>
          <span className='text-sm text-gray-500 mt-1'>{props.label}</span>
        </div>
      )

    case 'progress':
      return (
        <div className='w-full' style={style}>
          {props.label && (
            <div className='flex justify-between mb-2'>
              <span className='text-sm font-medium text-gray-700'>
                {props.label}
              </span>
              <span className='text-sm text-gray-500'>{props.value}%</span>
            </div>
          )}
          <div className='w-full bg-gray-200 rounded-full h-2.5'>
            <div
              className={`h-2.5 rounded-full ${getProgressColor(props.color)}`}
              style={{ width: `${props.value}%` }}
            ></div>
          </div>
        </div>
      )

    case 'link':
      return (
        <a
          href={props.url}
          className='text-blue-600 hover:text-blue-800 hover:underline'
          target={props.newTab ? '_blank' : undefined}
          rel={props.newTab ? 'noopener noreferrer' : undefined}
          style={style}
        >
          {props.text}
        </a>
      )

    case 'alert':
      return (
        <div
          className={`rounded-lg p-4 border ${getAlertStyles(props.type)}`}
          style={style}
        >
          <div className='flex gap-3'>
            <span className='text-xl'>{getAlertIcon(props.type)}</span>
            <div className='flex-1'>
              {props.title && (
                <h4 className='font-semibold mb-1'>{props.title}</h4>
              )}
              {props.message && <p className='text-sm'>{props.message}</p>}
            </div>
          </div>
        </div>
      )

    case 'code':
      return (
        <pre
          className='bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono'
          style={style}
        >
          <code>{props.content}</code>
        </pre>
      )

    case 'table':
      return (
        <div className='overflow-x-auto' style={style}>
          <table className='min-w-full divide-y divide-gray-200'>
            {props.headers && (
              <thead className='bg-gray-50'>
                <tr>
                  {props.headers.map((header: string, idx: number) => (
                    <th
                      key={idx}
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className='bg-white divide-y divide-gray-200'>
              {(props.rows || []).map((row: string[], rowIdx: number) => (
                <tr key={rowIdx}>
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    // Fallback for unknown components
    default:
      console.warn(`Unknown A2UI component: ${component}`)
      return (
        <div
          className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'
          style={style}
        >
          <p className='text-yellow-800 font-semibold mb-2'>
            ⚠️ Unknown component: {component}
          </p>
          <details className='text-xs'>
            <summary className='cursor-pointer text-yellow-700'>
              View specification
            </summary>
            <pre className='mt-2 overflow-auto bg-yellow-100 p-2 rounded'>
              {JSON.stringify(spec, null, 2)}
            </pre>
          </details>
        </div>
      )
  }
}

// Helper functions

function getLayoutClasses(layout?: string): string {
  switch (layout) {
    case 'vertical':
      return 'flex flex-col gap-4'
    case 'horizontal':
      return 'flex flex-row gap-4 items-center'
    case 'grid':
      return 'grid grid-cols-2 gap-4'
    default:
      return 'flex flex-col gap-4'
  }
}

function getGridCols(columns?: number): string {
  const cols = columns || 2
  const colMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }
  return colMap[cols] || 'grid-cols-2'
}

function getBadgeColor(color?: string): string {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-gray-100 text-gray-800',
    orange: 'bg-orange-100 text-orange-800',
  }
  return colors[color || 'gray'] || colors.gray
}

function getProgressColor(color?: string): string {
  const colors: Record<string, string> = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
  }
  return colors[color || 'blue'] || colors.blue
}

function getHeadingSize(level: number): string {
  const sizes: Record<number, string> = {
    1: 'text-4xl',
    2: 'text-3xl',
    3: 'text-2xl',
    4: 'text-xl',
    5: 'text-lg',
    6: 'text-base',
  }
  return sizes[level] || sizes[2]
}

function getAlertStyles(type?: string): string {
  const styles: Record<string, string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }
  return styles[type || 'info'] || styles.info
}

function getAlertIcon(type?: string): string {
  const icons: Record<string, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  }
  return icons[type || 'info'] || icons.info
}

export default A2UIRenderer
