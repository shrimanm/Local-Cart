// Theme configuration - easily switch between themes
export const THEME_CONFIG = {
  // Change this to switch themes: 'pink' | 'green-red'
  current: 'green-red' as 'pink' | 'green-red'
}

export const themes = {
  pink: {
    primary: {
      50: 'rgb(253 242 248)',
      100: 'rgb(252 231 243)', 
      200: 'rgb(251 207 232)',
      300: 'rgb(249 168 212)',
      400: 'rgb(244 114 182)',
      500: 'rgb(236 72 153)', // main pink
      600: 'rgb(219 39 119)',
      700: 'rgb(190 24 93)',
      800: 'rgb(157 23 77)',
      900: 'rgb(131 24 67)'
    },
    secondary: {
      50: 'rgb(250 245 255)',
      100: 'rgb(243 232 255)',
      200: 'rgb(233 213 255)',
      300: 'rgb(196 181 253)',
      400: 'rgb(168 162 247)',
      500: 'rgb(139 92 246)',
      600: 'rgb(124 58 237)',
      700: 'rgb(109 40 217)',
      800: 'rgb(91 33 182)',
      900: 'rgb(76 29 149)'
    }
  },
  'green-red': {
    primary: {
      50: 'rgb(240 253 244)',
      100: 'rgb(220 252 231)',
      200: 'rgb(187 247 208)',
      300: 'rgb(134 239 172)',
      400: 'rgb(74 222 128)',
      500: 'rgb(34 197 94)', // main green
      600: 'rgb(22 163 74)',
      700: 'rgb(21 128 61)',
      800: 'rgb(22 101 52)',
      900: 'rgb(20 83 45)'
    },
    secondary: {
      50: 'rgb(254 242 242)',
      100: 'rgb(254 226 226)',
      200: 'rgb(254 202 202)',
      300: 'rgb(252 165 165)',
      400: 'rgb(248 113 113)',
      500: 'rgb(239 68 68)', // accent red
      600: 'rgb(220 38 38)',
      700: 'rgb(185 28 28)',
      800: 'rgb(153 27 27)',
      900: 'rgb(127 29 29)'
    }
  }
}

export const getThemeColors = () => {
  return themes[THEME_CONFIG.current]
}

// Helper function to get theme classes
export const getThemeClass = (type: 'primary' | 'secondary', shade: keyof typeof themes.pink.primary = 600) => {
  const colors = getThemeColors()
  const colorMap = type === 'primary' ? colors.primary : colors.secondary
  
  // Convert RGB to Tailwind class names
  const rgbToTailwind = (rgb: string, type: 'primary' | 'secondary', shade: string) => {
    if (THEME_CONFIG.current === 'pink') {
      return type === 'primary' ? `pink-${shade}` : `purple-${shade}`
    } else {
      return type === 'primary' ? `green-${shade}` : `red-${shade}`
    }
  }
  
  return rgbToTailwind(colorMap[shade], type, shade.toString())
}