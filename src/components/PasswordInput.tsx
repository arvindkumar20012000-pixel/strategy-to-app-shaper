import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  iconPosition?: "left" | "right";
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ iconPosition = "left", className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative">
        {iconPosition === "left" && (
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          type={showPassword ? "text" : "password"}
          ref={ref}
          className={iconPosition === "left" ? "pl-10 pr-10" : "pr-10"}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

// Import Lock icon
import { Lock } from "lucide-react";
