export default function GaugeWidget({ title, value, min = 0, max = 100, unit, color = "#2ecc71" }) {
    // Calculate percentage and arc
    const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    // We want a 240 degree gauge (leaving 120 open at bottom)
    // 240/360 = 2/3. So dash array is (2/3 * circ) filled
    const arcLength = circumference * 0.75;
    const dashOffset = arcLength - (arcLength * percentage);

    return (
        <div className="blynk-card flex flex-col items-center justify-center h-full min-h-[160px]">
            <div className="mb-2 text-[#8e8e93] text-xs font-semibold uppercase tracking-wider">
                {title}
            </div>

            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Background Circle */}
                <svg className="w-full h-full transform rotate-135" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke="#161616"
                        strokeWidth="8"
                        strokeDasharray={arcLength}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                    />
                    {/* Value Circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeDasharray={arcLength}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out" // Animate changes
                    />
                </svg>

                {/* Center Value */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                    <span className="text-2xl font-bold text-white">{value}</span>
                    <span className="text-xs text-[#555]">{unit}</span>
                </div>
            </div>
        </div>
    );
}
