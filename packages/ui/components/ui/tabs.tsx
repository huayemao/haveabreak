import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@haveabreak/utils/lib/utils"

const tabsListVariants = cva(
  "inline-flex h-12 items-center justify-center rounded-2xl p-1.5",
  {
    variants: {
      variant: {
        default: "",
        outline: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-8 px-4",
        sm: "h-7 px-3 text-xs",
        xs: "h-6 px-2 text-xs",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

interface TabsProps extends React.ComponentProps<"div"> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof tabsListVariants> {
  children: React.ReactNode
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof tabsTriggerVariants> {
  value: string
  children: React.ReactNode
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  children: React.ReactNode
}

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({
  value: "",
  onValueChange: () => {},
})

function Tabs({ defaultValue, value, onValueChange, children, className, ...props }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  
  const currentValue = value !== undefined ? value : internalValue
  const handleValueChange = onValueChange || setInternalValue

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, variant, children, ...props }: TabsListProps) {
  return (
    <div 
      className={cn(tabsListVariants({ variant }), className)} 
      style={{
        background: '#E0E5EC',
        boxShadow: '9px 9px 16px rgba(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5)',
      }}
      {...props}
    >
      {children}
    </div>
  )
}

function TabsTrigger({ className, size, value, children, ...props }: TabsTriggerProps) {
  const context = React.useContext(TabsContext)
  const isActive = context.value === value

  return (
    <button
      type="button"
      className={cn(
        tabsTriggerVariants({ size }),
        className
      )}
      onClick={() => context.onValueChange(value)}
      data-state={isActive ? "active" : "inactive"}
      style={{
        background: isActive ? '#6C63FF' : 'transparent',
        color: isActive ? '#FFFFFF' : '#3D4852',
        boxShadow: isActive 
          ? 'inset 3px 3px 6px rgba(163, 177, 198, 0.6), inset -3px -3px 6px rgba(255, 255, 255, 0.3)' 
          : 'none',
      }}
      {...props}
    >
      {children}
    </button>
  )
}

function TabsContent({ className, value, children, ...props }: TabsContentProps) {
  const context = React.useContext(TabsContext)
  const isActive = context.value === value

  if (!isActive) return null

  return (
    <div className={cn("mt-4", className)} {...props}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants }
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps }
