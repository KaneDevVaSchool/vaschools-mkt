import "./GoalProgress.css";

type GoalProgressProps = {
    value: number;
    goal: number;
    label: string;
};

export default function GoalProgress({ value, goal, label }: GoalProgressProps) {
    const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
    const met = value >= goal;

    return (
        <div className="goal-progress">
            <div className="goal-progress__row">
                <span className="goal-progress__label">{label}</span>
                <span className="goal-progress__nums">
                    {value.toLocaleString("vi-VN")} / {goal.toLocaleString("vi-VN")}
                    {met ? " · đạt mục tiêu" : ""}
                </span>
            </div>
            <div
                className={`goal-progress__track${met ? " goal-progress__track--done" : ""}`}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={goal}
                aria-label={label}
            >
                <div className="goal-progress__fill" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}
