
export default function ValueWidget({ title, value, unit, color = "#2ecc71", icon: Icon }) {
    return (
        <div className="blynk-card flex flex-col items-center justify-center h-full min-h-[140px] relative overflow-hidden group">
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity"
                style={{ backgroundColor: color }}
            />

            <div className="mb-2 text-[#8e8e93] text-xs font-semibold uppercase tracking-wider">
                {title}
            </div>

            <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-bold text-white" style={{ color: color }}>
                    {value}
                </span>
                <span className="text-sm text-[#8e8e93] mb-1">{unit}</span>
            </div>

            {Icon && (
                <div className="absolute top-3 right-3 text-[#333]">
                    <Icon size={16} />
                </div>
            )}
        </div>
    );
}
