import { Lock } from 'lucide-react';

export default function LockedOption({ message }) {
    return (
        <div className="bg-surface/50 rounded-input p-4 text-center text-text-muted">
            <Lock className="w-5 h-5 mx-auto mb-2" />
            <p className="text-sm">{message}</p>
        </div>
    );
}