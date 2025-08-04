// 🎨 CHANGE THEME HERE - Update these values to change the entire app theme
const THEME_CONFIG = {
  // Choose your theme: 'pink' | 'blue' | 'green' | 'purple'
  current: 'green' as 'pink' | 'blue' | 'green' | 'purple'
}

const THEMES = {
  pink: {
    primary: 'pink',
    secondary: 'purple',
    gradient: 'from-pink-50 to-purple-50'
  },
  blue: {
    primary: 'blue',
    secondary: 'indigo', 
    gradient: 'from-blue-50 to-indigo-50'
  },
  green: {
    primary: 'green',
    secondary: 'emerald',
    gradient: 'from-green-50 to-emerald-50'
  },
  purple: {
    primary: 'purple',
    secondary: 'violet',
    gradient: 'from-purple-50 to-violet-50'
  }
}

const currentTheme = THEMES[THEME_CONFIG.current]

// Unified theme constants for consistent styling across all pages
export const THEME = {
  // Primary colors - dynamically set based on theme
  primary: {
    50: 'rgb(253, 242, 248)',
    100: 'rgb(252, 231, 243)',
    200: 'rgb(251, 207, 232)',
    300: 'rgb(249, 168, 212)',
    400: 'rgb(244, 114, 182)',
    500: 'rgb(236, 72, 153)',
    600: 'rgb(219, 39, 119)',
    700: 'rgb(190, 24, 93)',
    800: 'rgb(157, 23, 77)',
    900: 'rgb(131, 24, 67)'
  },
  
  // Secondary colors - dynamically set based on theme
  secondary: {
    50: 'rgb(250, 245, 255)',
    100: 'rgb(243, 232, 255)',
    200: 'rgb(233, 213, 255)',
    300: 'rgb(196, 181, 253)',
    400: 'rgb(168, 162, 247)',
    500: 'rgb(139, 92, 246)',
    600: 'rgb(124, 58, 237)',
    700: 'rgb(109, 40, 217)',
    800: 'rgb(91, 33, 182)',
    900: 'rgb(76, 29, 149)'
  },

  // Neutral colors
  gray: {
    50: 'rgb(249, 250, 251)',
    100: 'rgb(243, 244, 246)',
    200: 'rgb(229, 231, 235)',
    300: 'rgb(209, 213, 219)',
    400: 'rgb(156, 163, 175)',
    500: 'rgb(107, 114, 128)',
    600: 'rgb(75, 85, 99)',
    700: 'rgb(55, 65, 81)',
    800: 'rgb(31, 41, 55)',
    900: 'rgb(17, 24, 39)'
  }
} as const

// Tailwind class mappings for easy use - dynamically generated
export const THEME_CLASSES = {
  // Primary button styles
  primaryButton: `bg-${currentTheme.primary}-600 hover:bg-${currentTheme.primary}-700 text-white`,
  primaryButtonOutline: `border-${currentTheme.primary}-600 text-${currentTheme.primary}-600 hover:bg-${currentTheme.primary}-50`,
  
  // Secondary button styles
  secondaryButton: `bg-${currentTheme.secondary}-600 hover:bg-${currentTheme.secondary}-700 text-white`,
  secondaryButtonOutline: `border-${currentTheme.secondary}-600 text-${currentTheme.secondary}-600 hover:bg-${currentTheme.secondary}-50`,
  
  // Background gradients
  gradientBg: `bg-gradient-to-br ${currentTheme.gradient}`,
  
  // Loading spinner
  spinner: `border-${currentTheme.primary}-600`,
  
  // Icons and accents
  primaryIcon: `text-${currentTheme.primary}-600`,
  secondaryIcon: `text-${currentTheme.secondary}-600`,
  
  // Cards and surfaces
  cardBg: 'bg-white',
  surfaceBg: 'bg-gray-50',
  
  // Text colors
  primaryText: 'text-gray-900',
  secondaryText: 'text-gray-600',
  mutedText: 'text-gray-500',
  
  // Status colors
  success: 'text-green-600 bg-green-50 border-green-200',
  warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  error: 'text-red-600 bg-red-50 border-red-200',
  
  // Interactive states
  hover: 'hover:bg-gray-50',
  active: 'active:bg-gray-100',
  focus: 'focus:ring-2 focus:ring-pink-500 focus:ring-offset-2'
} as const

// Component-specific theme utilities
export const getButtonClasses = (variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary') => {
  switch (variant) {
    case 'primary':
      return THEME_CLASSES.primaryButton
    case 'secondary':
      return THEME_CLASSES.secondaryButton
    case 'outline':
      return THEME_CLASSES.primaryButtonOutline
    case 'ghost':
      return 'hover:bg-gray-100 text-gray-700'
    default:
      return THEME_CLASSES.primaryButton
  }
}

export const getIconClasses = (type: 'primary' | 'secondary' | 'neutral' = 'primary') => {
  switch (type) {
    case 'primary':
      return THEME_CLASSES.primaryIcon
    case 'secondary':
      return THEME_CLASSES.secondaryIcon
    case 'neutral':
      return 'text-gray-600'
    default:
      return THEME_CLASSES.primaryIcon
  }
}