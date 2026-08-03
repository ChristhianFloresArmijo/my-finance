import { ref } from 'vue'

// Singleton state — shared across all composable calls
const isDark = ref(false)

function applyTheme(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

/** Initialize from localStorage, falling back to OS preference. Call once on app mount. */
export function initTheme() {
  const saved = localStorage.getItem('theme')
  if (saved) {
    isDark.value = saved === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme(isDark.value)
}

export function useTheme() {
  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    applyTheme(isDark.value)
  }

  function setDark(value: boolean) {
    isDark.value = value
    localStorage.setItem('theme', value ? 'dark' : 'light')
    applyTheme(isDark.value)
  }

  return { isDark, toggle, setDark }
}
