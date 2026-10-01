import "./StatusPill.css";

type StatusPillProps = {
    ok: boolean;
    labelOk?: string;
    labelBad?: string;
};

export default function StatusPill({
    ok,
    labelOk = "OK",
    labelBad = "Lỗi",
}: StatusPillProps) {
    return (
        <span className={`status-pill${ok ? " status-pill--ok" : " status-pill--bad"}`}>
            {ok ? labelOk : labelBad}
        </span>
    );
}
