export default function Toggle({ label, description, checked, onChange }) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <div className="font-medium text-sm">{label}</div>
                {description && <div className="text-xs text-text-muted">{description}</div>}
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-action' : 'bg-border'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
}