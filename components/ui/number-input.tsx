"use client";

import * as React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface NumberInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  suffix?: React.ReactNode;
  containerClassName?: string;
  hideSteppers?: boolean;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, suffix, containerClassName, hideSteppers = false, ...props }, ref) => {
    const localRef = React.useRef<HTMLInputElement | null>(null);

    // Merge forwarded ref and local ref
    React.useImperativeHandle(ref, () => localRef.current as HTMLInputElement);

    const handleStep = (direction: "up" | "down") => {
      const input = localRef.current;
      if (!input || input.disabled) return;

      try {
        if (direction === "up") {
          input.stepUp();
        } else {
          input.stepDown();
        }
      } catch (e) {
        // Fallback for stepUp/stepDown if type/step doesn't support it natively or throws
        const current = parseFloat(input.value) || 0;
        const stepVal = parseFloat(String(props.step || "1")) || 1;
        const minVal = props.min !== undefined ? parseFloat(String(props.min)) : -Infinity;
        const maxVal = props.max !== undefined ? parseFloat(String(props.max)) : Infinity;

        let nextVal = direction === "up" ? current + stepVal : current - stepVal;
        if (nextVal < minVal) nextVal = minVal;
        if (nextVal > maxVal) nextVal = maxVal;

        // Keep decimal precision matching step if step is decimal
        const stepProp = props.step;
        if (stepProp !== undefined) {
          const stepStr = String(stepProp);
          if (stepStr.includes(".")) {
            const decimalPart = stepStr.split(".")[1];
            const precision = decimalPart ? decimalPart.length : 0;
            input.value = nextVal.toFixed(precision);
          } else {
            input.value = String(nextVal);
          }
        } else {
          input.value = String(nextVal);
        }
      }

      // Trigger standard React change & input events so state updates correctly
      const changeEvent = new Event("change", { bubbles: true });
      input.dispatchEvent(changeEvent);

      const inputEvent = new Event("input", { bubbles: true });
      input.dispatchEvent(inputEvent);
    };

    return (
      <div className={cn("relative flex items-center w-full", containerClassName)}>
        <input
          ref={localRef}
          type="number"
          className={cn(
            "flex h-10 w-full rounded-md border border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text",
            "placeholder:text-ui-text-muted focus:border-ui-text-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            hideSteppers ? "pr-3" : "pr-14", // Make room for stepper buttons only if they are not hidden
            className
          )}
          {...props}
          onChange={(e) => {
            let val = e.target.value;
            const isNegative = val.startsWith("-");
            const normalized = isNegative ? val.slice(1) : val;
            if (/^0+[0-9]/.test(normalized) && !normalized.startsWith("0.")) {
              let stripped = normalized.replace(/^0+/, "");
              if (stripped === "") stripped = "0";
              val = isNegative && stripped !== "0" ? "-" + stripped : stripped;
              e.target.value = val;
            }
            props.onChange?.(e);
          }}
          onFocus={(e) => {
            if (e.target.value === "0") {
              e.target.select();
            }
            props.onFocus?.(e);
          }}
        />
        {/* Custom Stepper Buttons (hidden if hideSteppers is true) */}
        {!hideSteppers && (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pr-1">
            {suffix && <span className="text-xs text-ui-text-muted select-none mr-0.5">{suffix}</span>}
            <div className="flex flex-col border-l border-ui-border/60 pl-1.5">
              <button
                type="button"
                tabIndex={-1}
                onClick={() => handleStep("up")}
                disabled={props.disabled}
                className="flex items-center justify-center p-0.5 text-ui-text-muted hover:text-ui-text transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => handleStep("down")}
                disabled={props.disabled}
                className="flex items-center justify-center p-0.5 text-ui-text-muted hover:text-ui-text transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

NumberInput.displayName = "NumberInput";

export { NumberInput };
