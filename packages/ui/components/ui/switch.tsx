"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@haveabreak/utils/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border-2 border-transparent transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        size === "default" && "h-[18.4px] w-[32px]",
        size === "sm" && "h-[14px] w-[24px]",
        className
      )}
      style={{
        background: '#E0E5EC',
        boxShadow: 'inset 6px 6px 10px rgba(163, 177, 198, 0.6), inset -6px -6px 10px rgba(255, 255, 255, 0.5)',
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full ring-0 transition-all duration-200",
          size === "default" && "size-4 data-checked:translate-x-[calc(100%-2px)] data-unchecked:translate-x-0",
          size === "sm" && "size-3 data-checked:translate-x-[calc(100%-2px)] data-unchecked:translate-x-0",
          "data-unchecked:bg-[#E0E5EC] data-checked:bg-primary"
        )}
        style={{
          boxShadow: '5px 5px 10px rgba(163, 177, 198, 0.6), -5px -5px 10px rgba(255, 255, 255, 0.5)',
        }}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
