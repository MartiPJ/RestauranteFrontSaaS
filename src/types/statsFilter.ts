// Types for StatsFilterPanel component
export interface StatCard {
  icon: string
  value: number | string
  label: string
  /** Clave de color para el borde izquierdo */
  colorKey?: 'default' | 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'orange'
}

export interface FilterOption {
  value: string
  label: string
  /** Clave de color para el botón activo y el dot */
  colorKey?: 'default' | 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'orange'
  /** Mostrar punto de color junto a la etiqueta */
  dot?: boolean
}
