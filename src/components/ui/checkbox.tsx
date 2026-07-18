"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean
  disabled?: boolean
  className?: string
  onCheckedChange?: (checked: boolean) => void
}

const checkmarkVariants = {
  initial: {
    pathLength: 0,
    opacity: 0
  },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { type: "spring", stiffness: 300, damping: 20 },
      opacity: { duration: 0.1 }
    }
  },
  exit: {
    pathLength: 0,
    opacity: 0,
    transition: {
      duration: 0.15
    }
  }
} as const

export const Checkbox = React.forwardRef<HTMLDivElement, CheckboxProps>(
  ({ className, checked = false, disabled = false, onCheckedChange, ...props }, ref) => {
    
    const handleToggle = () => {
      if (disabled) return
      onCheckedChange?.(!checked)
    }

    return (
      <div
        ref={ref}
        onClick={handleToggle}
        className={cn(
          "relative flex items-center justify-center h-5 w-5 rounded-none border-2 cursor-pointer transition-all duration-200 select-none shadow-sm active:scale-90",
          checked
            ? "bg-primary border-primary text-primary-foreground"
            : "bg-white border-slate-200 hover:border-slate-400",
          disabled && "cursor-not-allowed opacity-40 active:scale-100",
          className
        )}
        {...props}
      >
        <AnimatePresence initial={false}>
          {checked && (
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.75, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <svg
                width="12"
                height="10"
                viewBox="0 0 12 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-white stroke-[2.5] stroke-linecap-round stroke-linejoin-round"
              >
                <motion.path
                  d="M1.5 5L4.5 8L10.5 1.5"
                  variants={checkmarkVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

Checkbox.displayName = "Checkbox"
