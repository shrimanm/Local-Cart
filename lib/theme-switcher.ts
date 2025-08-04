// 🎨 THEME SWITCHER - Change your app theme instantly

export type ThemeType = 'pink' | 'blue' | 'green' | 'purple'

export const AVAILABLE_THEMES = {
  pink: {
    name: 'Pink',
    primary: 'pink-600',
    secondary: 'purple-600',
    gradient: 'from-pink-50 to-purple-50',
    description: 'Elegant pink theme (default)'
  },
  blue: {
    name: 'Blue',
    primary: 'blue-600', 
    secondary: 'indigo-600',
    gradient: 'from-blue-50 to-indigo-50',
    description: 'Professional blue theme'
  },
  green: {
    name: 'Green',
    primary: 'green-600',
    secondary: 'emerald-600', 
    gradient: 'from-green-50 to-emerald-50',
    description: 'Fresh green theme'
  },
  purple: {
    name: 'Purple',
    primary: 'purple-600',
    secondary: 'violet-600',
    gradient: 'from-purple-50 to-violet-50', 
    description: 'Royal purple theme'
  }
} as const

// Get theme classes for any theme
export const getThemeClasses = (theme: ThemeType) => {
  const config = AVAILABLE_THEMES[theme]
  
  return {
    primaryButton: `bg-${config.primary} hover:bg-${config.primary.replace('600', '700')} text-white`,
    primaryButtonOutline: `border-${config.primary} text-${config.primary} hover:bg-${config.primary.replace('600', '50')}`,
    secondaryButton: `bg-${config.secondary} hover:bg-${config.secondary.replace('600', '700')} text-white`,
    gradientBg: `bg-gradient-to-br ${config.gradient}`,
    spinner: `border-${config.primary}`,
    primaryIcon: `text-${config.primary}`,
    secondaryIcon: `text-${config.secondary}`
  }
}

// Instructions for changing theme:
/*
🎨 TO CHANGE THEME:

1. Open: lib/theme-constants.ts
2. Find: current: 'pink' 
3. Change to: current: 'blue' | 'green' | 'purple'
4. Save and refresh!

Available themes:
- 'pink' (default) - Elegant pink/purple
- 'blue' - Professional blue/indigo  
- 'green' - Fresh green/emerald
- 'purple' - Royal purple/violet
*/