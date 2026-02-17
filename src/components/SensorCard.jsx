

export default function SensorCard({ title, value, unit, icon: Icon, color, status, subtext }) {
    // Dynamic color classes for light theme
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        sky: "bg-sky-50 text-sky-600",
        red: "bg-red-50 text-red-600",
        emerald: "bg-emerald-50 text-emerald-600",
        indigo: "bg-indigo-50 text-indigo-600"
    };

    // Fallback if raw RGB was passed, hack for now or just treat as default
    const iconBgClass = color.includes(',') ? "bg-slate-100 text-slate-600" : (colorClasses[color] || "bg-slate-100 text-slate-600");

    const statusColors = {
        'Normal': 'bg-emerald-100 text-emerald-700',
        'Warning': 'bg-amber-100 text-amber-700',
        'Critical': 'bg-red-100 text-red-700'
    };

    return (
        <div className="card-standard flex flex-col justify-between h-full relative overflow-hidden group">
            {/* Top Row */}
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-lg transition-transform group-hover:scale-110 ${iconBgClass}`}>
                    <Icon size={22} />
                </div>
                {status && (
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${statusColors[status] || 'bg-slate-100 text-slate-600'}`}>
                        {status}
                    </span>
                )}
            </div>

            {/* Value Row */}
            <div>
                <div className="text-3xl font-bold text-slate-900 mb-1 flex items-baseline gap-1 font-outfit">
                    {value} <span className="text-sm font-medium text-slate-500">{unit}</span>
                </div>
                <div className="text-sm font-medium text-slate-500">{title}</div>
            </div>

            {subtext && <div className="mt-3 text-xs text-slate-400 border-t border-slate-100 pt-2">{subtext}</div>}
        </div>
    );
}
