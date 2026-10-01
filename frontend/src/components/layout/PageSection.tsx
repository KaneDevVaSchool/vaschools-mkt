import type { ReactNode } from "react";
import "./PageSection.css";

type PageSectionProps = {
    title: string;
    id?: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    variant?: "default" | "plain";
};

export default function PageSection({
    title,
    id,
    description,
    actions,
    children,
    variant = "default",
}: PageSectionProps) {
    const headingId = id ?? `${title.replace(/\s+/g, "-").toLowerCase()}-heading`;

    return (
        <section
            className={`page-section${variant === "plain" ? " page-section--plain" : ""}`}
            aria-labelledby={headingId}
        >
            <div className="page-section__head">
                <div className="page-section__titles">
                    <h2 id={headingId} className="page-section__title">
                        {title}
                    </h2>
                    {description ? <p className="page-section__desc">{description}</p> : null}
                </div>
                {actions ? <div className="page-section__actions">{actions}</div> : null}
            </div>
            <div className="page-section__content">{children}</div>
        </section>
    );
}
