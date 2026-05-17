"use client"

import { createContext, useContext, useState, useCallback } from "react"

interface AuthModalContextType {
  isOpen: boolean
  open: () => void
  close: () => void
}

const AuthModalContext = createContext<AuthModalContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
})

export function useAuthModal() {
  return useContext(AuthModalContext)
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  return (
    <AuthModalContext.Provider value={{ isOpen, open, close }}>
      {children}
    </AuthModalContext.Provider>
  )
}
