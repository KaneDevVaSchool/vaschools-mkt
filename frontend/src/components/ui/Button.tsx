import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./Button.css";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: "sm" | "md";
    children: ReactNode;
};

export default function Button({
    variant = "secondary",
    size = "md",
    className = "",
    type = "button",
    children,
    ...rest
}: ButtonProps) {
    return (
        <button
            type={type}
            className={["ui-btn", `ui-btn--${variant}`, `ui-btn--${size}`, className]
                .filter(Boolean)
                .join(" ")}
            {...rest}
        >
            {children}
        </button>
    );
}
