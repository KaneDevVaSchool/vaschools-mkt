import "./GoalProgress.css";

type GoalProgressProps = {
    value: number;
    goal: number;
    label: string;
    /** Dòng phụ dưới thanh — ví dụ còn thiếu bao nhiêu để đạt mục tiêu. */
    hint?: string;
    /** Đơn vị đếm dùng trong dòng phụ tự sinh (mặc định: "từ khóa"). */
    unit?: string;
};

export default function GoalProgress({
    value,
    goal,
    label,
    hint,
    unit = "từ khóa",
}: GoalProgressProps) {
    const ratio = goal > 0 ? value / goal : 0;
    const pct = Math.min(100, Math.round(ratio * 100));
    const met = value >= goal;
    const remaining = Math.max(0, goal - value);

    const autoHint = met
        ? "Đã đạt mục tiêu"
        : `Còn thiếu ${remaining.toLocaleString("vi-VN")} ${unit} để đạt mục tiêu`;

    return (
        <div className={`goal-progress${met ? " goal-progress--done" : ""}`}>
            <div className="goal-progress__row">
                <span className="goal-progress__label">{label}</span>
                <span className="goal-progress__figures">
                    <span className="goal-progress__value">{value.toLocaleString("vi-VN")}</span>
                    <span className="goal-progress__goal">/ {goal.toLocaleString("vi-VN")}</span>
                    <span className="goal-progress__pct">{pct}%</span>
                </span>
            </div>
            <div
                className="goal-progress__track"
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={goal}
                aria-label={label}
            >
                <div className="goal-progress__fill" style={{ width: `${pct}%` }} />
                <div className="goal-progress__ticks" aria-hidden="true">
                    <span className="goal-progress__tick" />
                    <span className="goal-progress__tick" />
                    <span className="goal-progress__tick" />
                    <span className="goal-progress__tick" />
                </div>
            </div>
            <p className="goal-progress__hint">{hint ?? autoHint}</p>
        </div>
    );
}
