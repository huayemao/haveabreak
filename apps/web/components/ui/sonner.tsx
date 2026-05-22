"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-[#38B2AC]" />,
        info: <InfoIcon className="size-4 text-[#6C63FF]" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-500" />,
        error: <OctagonXIcon className="size-4 text-red-400" />,
        loading: <Loader2Icon className="size-4 text-[#6B7280] animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: [
            "font-sans",
            "!bg-[#E0E5EC]",
            "!text-[#3D4852]",
            "!border-transparent",
            "!rounded-2xl",
            "!shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]",
            "!px-4 !py-3",
            "!gap-3",
          ].join(" "),
          title: "!font-display !font-bold !text-[#3D4852] !text-sm",
          description: "!text-[#6B7280] !text-xs",
          actionButton: [
            "!bg-[#6C63FF]",
            "!text-white",
            "!text-xs",
            "!font-bold",
            "!rounded-xl",
            "!px-3 !py-1.5",
            "!shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]",
            "hover:!scale-105",
            "active:!scale-95",
            "active:!shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]",
            "transition-all duration-300",
          ].join(" "),
          cancelButton: [
            "!bg-[#E0E5EC]",
            "!text-[#6B7280]",
            "!text-xs",
            "!font-medium",
            "!rounded-xl",
            "!px-3 !py-1.5",
            "!shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]",
            "hover:!scale-105",
            "active:!scale-95",
            "transition-all duration-300",
          ].join(" "),
          closeButton: [
            "!bg-[#E0E5EC]",
            "!text-[#6B7280]",
            "!border-transparent",
            "!shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.5)]",
            "hover:!text-[#3D4852]",
            "transition-colors duration-300",
          ].join(" "),
          icon: "!mt-0",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
