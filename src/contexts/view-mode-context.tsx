import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ViewModeContextType {
  viewingAsStudent: boolean
  toggleViewAsStudent: () => void
  exitStudentView: () => void
}

const STORAGE_KEY = 'everest-view-as-student'

const ViewModeContext = createContext<ViewModeContextType>({
  viewingAsStudent: false,
  toggleViewAsStudent: () => {},
  exitStudentView: () => {},
})

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewingAsStudent, setViewingAsStudent] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const toggleViewAsStudent = useCallback(() => {
    setViewingAsStudent(prev => {
      const next = !prev
      try { sessionStorage.setItem(STORAGE_KEY, String(next)) } catch {}
      return next
    })
  }, [])

  const exitStudentView = useCallback(() => {
    setViewingAsStudent(false)
    try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
  }, [])

  return (
    <ViewModeContext.Provider value={{ viewingAsStudent, toggleViewAsStudent, exitStudentView }}>
      {children}
    </ViewModeContext.Provider>
  )
}

export const useViewMode = () => useContext(ViewModeContext)
