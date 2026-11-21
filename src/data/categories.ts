export const categories = [
  {
    id: 'developer',
    label: 'Developer',
    description: 'Small, dependable utilities for your everyday coding work.',
    icon: 'Code2',
  },
  {
    id: 'text',
    label: 'Text',
    description: 'Shape, inspect and transform words without leaving your browser.',
    icon: 'Type',
  },
  {
    id: 'web',
    label: 'Web',
    description: 'Practical helpers for building and publishing better web pages.',
    icon: 'Globe2',
  },
  {
    id: 'color',
    label: 'Color & CSS',
    description: 'Explore color, check contrast and compose CSS visually.',
    icon: 'Palette',
  },
  {
    id: 'generators',
    label: 'Generators',
    description: 'Create useful, random and secure values on your own device.',
    icon: 'WandSparkles',
  },
  {
    id: 'converters',
    label: 'Converters',
    description: 'Convert common units, formats and measurements in seconds.',
    icon: 'ArrowLeftRight',
  },
] as const

export type CategoryId = (typeof categories)[number]['id']
