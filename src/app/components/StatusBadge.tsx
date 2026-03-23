interface StatusBadgeProps {
  status: "ok" | "attention" | "high-risk";
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const colors = {
    ok: "bg-[#6EE7B7] text-green-900",
    attention: "bg-yellow-300 text-yellow-900",
    "high-risk": "bg-red-400 text-red-900",
  };

  const labels = {
    ok: "OK",
    attention: "Needs attention",
    "high-risk": "High risk",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span
      className={`inline-block rounded-full font-semibold ${colors[status]} ${sizeStyles[size]}`}
    >
      {labels[status]}
    </span>
  );
}
