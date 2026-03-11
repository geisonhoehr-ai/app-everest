import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ViewModeContextType {
  viewingAsStudent: boolean
  toggleViewAsStudent: () => void
  exitStudentView: () => void
}

const ViewModeContext = createContext<ViewModeContextType>({
  viewingAsStudent: false,
  toggleViewAsStudent: () => {},
  exitStudentView: () => {},
})

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewingAsStudent, setViewingAsStudent] = useState(false)

  const toggleViewAsStudent = useCallback(() => {
    setViewingAsStudent(prev => !prev)
  }, [])

  const exitStudentView = useCallback(() => {
    setViewingAsStudent(false)
  }, [])

  return (
    <ViewModeContext.Provider value={{ viewingAsStudent, toggleViewAsStudent, exitStudentView }}>
      {children}
    </ViewModeContext.Provider>
  )
}

export const useViewMode = () => useContext(ViewModeContext)
