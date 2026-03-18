import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

export const passwordRules: PasswordRule[] = [
  { label: "Mínimo de 8 caracteres", test: (p) => p.length >= 8 },
  { label: "Pelo menos 1 letra maiúscula", test: (p) => /[A-Z]/.test(p) },
  { label: "Pelo menos 1 número", test: (p) => /[0-9]/.test(p) },
  { label: "Pelo menos 1 caractere especial (!@#$%&*)", test: (p) => /[!@#$%&*]/.test(p) },
];

export function allPasswordRulesMet(password: string): boolean {
  return passwordRules.every((rule) => rule.test(password));
}

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  if (!password) return null;

  return (
    <ul className="space-y-1 mt-2">
      {passwordRules.map((rule, i) => {
        const met = rule.test(password);
        return (
          <li
            key={i}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}
          >
            {met ? (
              <Check className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 shrink-0" />
            )}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
