import React from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';
import { GripVertical, ChevronUp, ChevronDown, X, Link as LinkIcon, Globe, Download, FileText, Calendar, Video, Music, ShoppingCart, Youtube, Facebook, MessageCircle } from 'lucide-react';

const ICON_MAP = {
    link: LinkIcon,
    download: Download,
    file: FileText,
    calendar: Calendar,
    video: Video,
    music: Music,
    shop: ShoppingCart,
    youtube: Youtube,
    facebook: Facebook,
    whatsapp: MessageCircle,
    globe: Globe
};

function SortableLinkItem({ link, index, updateLink, removeLink, moveUp, moveDown, totalLength }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: link.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="bg-surface dark:bg-surface-dark p-4 rounded-input border border-border dark:border-border-dark relative">
            <div className="absolute top-2 left-2 flex items-center gap-2">
                <button {...attributes} {...listeners} className="p-1 rounded border border-border bg-card text-text-muted hover:border-action-dark">
                    <GripVertical className="w-4 h-4" />
                </button>
                <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1 rounded border disabled:opacity-40">
                    <ChevronUp className="w-4 h-4" />
                </button>
                <button onClick={() => moveDown(index)} disabled={index === totalLength - 1} className="p-1 rounded border disabled:opacity-40">
                    <ChevronDown className="w-4 h-4" />
                </button>
            </div>
            <button onClick={() => removeLink(link.id)} className="absolute top-2 right-2 p-1 text-text-muted hover:text-error">
                <X className="w-4 h-4" />
            </button>
            <div className="grid gap-3 pt-6">
                <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-container bg-card dark:bg-surface-dark border border-border flex items-center justify-center shrink-0">
                        {React.createElement(ICON_MAP[link.icon] || LinkIcon, { className: "w-5 h-5" })}
                    </div>
                    <input type="text" placeholder="Link Title" value={link.title} onChange={e => updateLink(link.id, 'title', e.target.value)} className="flex-1 bg-card border border-border rounded-input px-3 py-2 text-sm" />
                </div>
                <input type="text" placeholder="https://..." value={link.url} onChange={e => updateLink(link.id, 'url', e.target.value)} className="w-full bg-card border border-border rounded-input px-3 py-2 text-sm" />
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {Object.keys(ICON_MAP).map(iconKey => (
                        <button key={iconKey} onClick={() => updateLink(link.id, 'icon', iconKey)} className={`p-2 rounded border flex-shrink-0 transition-all ${link.icon === iconKey ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-card border-border text-text-muted'}`}>
                            {React.createElement(ICON_MAP[iconKey], { className: "w-4 h-4" })}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function LinkList({ links, setLinks }) {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const updateLink = (id, field, value) => {
        setLinks(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const removeLink = (id) => {
        setLinks(prev => prev.filter(l => l.id !== id));
    };

    const moveUp = (index) => {
        if (index === 0) return;
        setLinks(prev => arrayMove(prev, index, index - 1));
    };

    const moveDown = (index) => {
        if (index === links.length - 1) return;
        setLinks(prev => arrayMove(prev, index, index + 1));
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = links.findIndex(l => l.id === active.id);
        const newIndex = links.findIndex(l => l.id === over.id);
        setLinks(prev => arrayMove(prev, oldIndex, newIndex));
    };

    if (links.length === 0) {
        return <div className="text-center py-8 text-text-muted border-thick border-dashed rounded-input">No custom links yet.</div>;
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                    {links.map((link, idx) => (
                        <SortableLinkItem key={link.id} link={link} index={idx} updateLink={updateLink} removeLink={removeLink} moveUp={moveUp} moveDown={moveDown} totalLength={links.length} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}