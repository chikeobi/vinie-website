'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface CustomerModeContextValue {
  customerMode: boolean
  toggleCustomerMode: () => void
}

const CustomerModeContext = createContext<CustomerModeContextValue>({
  customerMode: false,
  toggleCustomerMode: () => {},
})

export function CustomerModeProvider({ children }: { children: ReactNode }) {
  const [customerMode, setCustomerMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('customerMode')
    if (saved === 'true') setCustomerMode(true)
  }, [])

  function toggleCustomerMode() {
    setCustomerMode((prev) => {
      const next = !prev
      localStorage.setItem('customerMode', String(next))
      return next
    })
  }

  return (
    <CustomerModeContext.Provider value={{ customerMode, toggleCustomerMode }}>
      {children}
    </CustomerModeContext.Provider>
  )
}

export function useCustomerMode() {
  return useContext(CustomerModeContext)
}
