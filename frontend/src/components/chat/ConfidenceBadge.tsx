const COLORS: Record<string, string> = {
    green: 'bg-green-100  text-green-800  border-green-300',
    teal: 'bg-teal-100   text-teal-800   border-teal-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
};

export default function ConfidenceBadge({ score, label, color }: { score: number; label: string; color: string }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${COLORS[color] || COLORS.orange}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {label} · {score}%
        </span>
    );
}
