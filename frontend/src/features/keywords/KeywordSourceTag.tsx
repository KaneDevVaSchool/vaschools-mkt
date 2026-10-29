import {
    keywordSourceDef,
    keywordSourceLabel,
    trustLabel,
    type KeywordSourceTrust,
} from "@/lib/keywordSources";
import "./KeywordSourceTag.css";

type KeywordSourceTagProps = {
    source: string | null | undefined;
    showTrust?: boolean;
};

export default function KeywordSourceTag({ source, showTrust = false }: KeywordSourceTagProps) {
    const def = keywordSourceDef(source);
    const label = keywordSourceLabel(source);
    const tagClass = def?.tagClass ?? "data-tag--slate";
    const trust: KeywordSourceTrust = def?.trust ?? "medium";

    return (
        <span className="kw-source-tag">
            <span className={`data-tag ${tagClass}`}>{label}</span>
            {showTrust ? (
                <span className={`kw-source-tag__trust kw-source-tag__trust--${trust}`}>
                    {trustLabel(trust)}
                </span>
            ) : null}
        </span>
    );
}
