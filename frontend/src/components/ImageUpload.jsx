import React from 'react';
import { Upload, X } from 'lucide-react';

export default function ImageUpload({ label, image, onUpload, onRemove, isBanner, disabled }) {
    return (
        <div>
            <h3 className="text-sm font-medium mb-2">{label}</h3>
            <div className={`relative ${isBanner ? 'w-full h-32' : 'w-24 h-24'} rounded-input border-2 border-dashed border-border bg-surface flex items-center justify-center overflow-hidden group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {image ? <img src={image} className="w-full h-full object-cover" alt="" /> : <div className="text-center text-text-muted"><Upload className="w-6 h-6 mx-auto mb-1" /><span className="text-xs">Upload</span></div>}
                {!disabled && <input type="file" accept="image/*" onChange={onUpload} className="absolute inset-0 opacity-0 cursor-pointer" />}
            </div>
            {image && !disabled && <button onClick={onRemove} className="mt-1 text-xs text-error">Remove</button>}
        </div>
    );
}