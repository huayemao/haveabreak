import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@haveabreak/utils/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full rounded-full" style={{
      background: '#E0E5EC',
      boxShadow: 'inset 6px 6px 10px rgba(163, 177, 198, 0.6), inset -6px -6px 10px rgba(255, 255, 255, 0.5)',
    }}>
      <SliderPrimitive.Range className="absolute h-full rounded-full" style={{
        background: '#6C63FF',
        boxShadow: '3px 3px 6px rgba(163, 177, 198, 0.4), -3px -3px 6px rgba(255, 255, 255, 0.3)',
      }} />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block w-5 h-5 rounded-full border-0 cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95" style={{
      background: '#E0E5EC',
      boxShadow: '5px 5px 10px rgba(163, 177, 198, 0.6), -5px -5px 10px rgba(255, 255, 255, 0.5)',
    }} />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
