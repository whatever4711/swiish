export default function TextArea({ label, value, onChange }) {
    return (
        <div className="space-y-1">
            <label className="text-sm font-medium">{label}</label>
            <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={3} className="w-full px-4 py-2 rounded-input border resize-none" />
        </div>
    );
}