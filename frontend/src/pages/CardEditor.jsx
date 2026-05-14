import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useModal } from '../context/ModalContext';
import { useCards } from '../hooks/useCards';
import { useDarkMode } from '../context/DarkModeContext';
import { ArrowLeft, Save, Check, RefreshCw, Plus, X, GripVertical, ChevronUp, ChevronDown, Lock, Mail, Globe, Linkedin, Twitter, Instagram, Github, Edit3 } from 'lucide-react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import flags from 'country-flag-icons/react/3x2';
import CardDisplay from '../components/CardDisplay';
import Input from '../components/Input';
import TextArea from '../components/TextArea';
import Toggle from '../components/Toggle';
import ImageUpload from '../components/ImageUpload';
import ColorSelector from '../components/editor/ColorSelector';  // fixed
import LinkList from '../components/editor/LinkList';            // fixed
import LockedOption from '../components/common/LockedOption';   // added

const ICON_MAP = {
    link: (props) => <LinkIcon {...props} />,
    download: (props) => <Download {...props} />,
    file: (props) => <FileText {...props} />,
    calendar: (props) => <Calendar {...props} />,
    video: (props) => <Video {...props} />,
    music: (props) => <Music {...props} />,
    shop: (props) => <ShoppingCart {...props} />,
    youtube: (props) => <Youtube {...props} />,
    facebook: (props) => <Facebook {...props} />,
    whatsapp: (props) => <MessageCircle {...props} />,
    globe: (props) => <Globe {...props} />
};

function SortableLinkItem({ link, children }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: link.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return children({ setNodeRef, style, attributes, listeners });
}

export default function CardEditor() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { settings } = useSettings();
    const { showAlert, showConfirm } = useModal();
    const { darkMode, toggleDarkMode } = useDarkMode();
    const { saveCard, deleteCard, fetchCards } = useCards();
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState('details');
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [targetUserId, setTargetUserId] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => {
        // Fetch card data from API
        const fetchCard = async () => {
            try {
                const queryParams = new URLSearchParams(location.search);
                const userIdParam = queryParams.get('userId');
                if (userIdParam) setTargetUserId(userIdParam);
                const url = userIdParam ? `/api/admin/cards/${userIdParam}/${slug}` : `/api/cards/${slug}`;
                const res = await fetch(url, { credentials: 'include' });
                if (res.ok) {
                    const cardData = await res.json();
                    const defaultTemplate = {
                        personal: { firstName: '', lastName: '', middleName: '', prefix: '', suffix: '', title: '', company: settings.default_organisation || '', bio: '', location: '' },
                        contact: { email: '', phone: '', website: '' },
                        social: { linkedin: '', twitter: '', instagram: '', github: '' },
                        theme: { color: 'indigo' },
                        images: { avatar: null, banner: null },
                        links: [],
                        privacy: { requireInteraction: true, clientSideObfuscation: false, blockRobots: false }
                    };
                    setData({ ...defaultTemplate, ...cardData, links: cardData.links || [] });
                } else {
                    showAlert('Card not found', 'error');
                    navigate('/people');
                }
            } catch (err) {
                showAlert('Failed to load card', 'error');
                navigate('/people');
            }
        };
        fetchCard();
    }, [slug, location.search, settings.default_organisation, navigate, showAlert]);

    const handleInputChange = (section, field, value) => {
        setData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    };

    const handleImageUpload = async (type, e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                credentials: 'include',
                headers: { 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content },
                body: formData
            });
            if (res.ok) {
                const { url } = await res.json();
                setData(prev => ({ ...prev, images: { ...prev.images, [type]: url } }));
            } else {
                showAlert('Upload failed', 'error');
            }
        } catch (err) {
            showAlert('Upload error', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const addLink = () => {
        setData(prev => ({ ...prev, links: [...prev.links, { id: Date.now(), title: '', url: '', icon: 'link' }] }));
    };
    const removeLink = (id) => {
        setData(prev => ({ ...prev, links: prev.links.filter(l => l.id !== id) }));
    };
    const updateLink = (id, field, value) => {
        setData(prev => ({ ...prev, links: prev.links.map(l => l.id === id ? { ...l, [field]: value } : l) }));
    };
    const reorderLinks = (oldIndex, newIndex) => {
        setData(prev => ({ ...prev, links: arrayMove(prev.links, oldIndex, newIndex) }));
    };
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = data.links.findIndex(l => l.id === active.id);
        const newIndex = data.links.findIndex(l => l.id === over.id);
        reorderLinks(oldIndex, newIndex);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const start = Date.now();
        try {
            await saveCard(slug, data, targetUserId);
            const elapsed = Date.now() - start;
            if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 2000);
            fetchCards();
        } catch (err) {
            showAlert('Save failed', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        showConfirm('Delete this card?', async () => {
            await deleteCard(slug, targetUserId);
            navigate('/people');
        }, 'Delete Card', 'Delete', 'Cancel');
    };

    if (!data) return <div className="flex items-center justify-center h-screen">Loading...</div>;

    return (
        <div className="min-h-screen bg-main dark:bg-main-dark flex flex-col lg:flex-row">
            {/* Left Panel - Editor */}
            <div className="w-full lg:w-1/2 bg-card dark:bg-card-dark border-r border-border h-auto lg:h-screen overflow-y-auto">
                <div className="p-6 border-b border-border-subtle sticky top-0 bg-card z-10 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/people')} className="p-2 hover:bg-surface rounded-full"><ArrowLeft size={20} /></button>
                        <h1 className="text-xl font-bold">Editing: {slug}</h1>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={toggleDarkMode} className="px-3 py-2 rounded-full bg-surface border border-border">{darkMode ? '☀️' : '🌙'}</button>
                        <button onClick={handleDelete} className="px-3 py-2 rounded-full bg-error-bg text-error">Delete</button>
                        <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 bg-confirm text-confirm-text rounded-full font-bold flex items-center gap-2">
                            {isSaving ? <RefreshCw className="w-4 animate-spin" /> : isSuccess ? <Check className="w-4 text-green-500" /> : <Save className="w-4" />}
                            Save
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Tabs */}
                    <div className="flex p-1 bg-surface rounded-input">
                        {['details', 'links', 'images', 'style', 'privacy'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-sm font-medium capitalize rounded-button transition-all ${activeTab === tab ? 'bg-card shadow text-text-primary' : 'text-text-muted hover:text-text-primary'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Prefix" value={data.personal.prefix} onChange={v => handleInputChange('personal', 'prefix', v)} />
                                <Input label="Suffix" value={data.personal.suffix} onChange={v => handleInputChange('personal', 'suffix', v)} />
                                <Input label="First Name" value={data.personal.firstName} onChange={v => handleInputChange('personal', 'firstName', v)} />
                                <Input label="Middle Name" value={data.personal.middleName} onChange={v => handleInputChange('personal', 'middleName', v)} />
                                <Input label="Last Name" value={data.personal.lastName} onChange={v => handleInputChange('personal', 'lastName', v)} />
                                <Input label="Job Title" value={data.personal.title} onChange={v => handleInputChange('personal', 'title', v)} />
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Organisation</label>
                                    <input type="text" value={settings.default_organisation} disabled className="w-full px-4 py-2.5 rounded-input bg-surface text-text-secondary cursor-not-allowed" />
                                    <p className="text-xs text-text-muted">Set by organisation</p>
                                </div>
                            </div>
                            <Input label="Location" value={data.personal.location} onChange={v => handleInputChange('personal', 'location', v)} />
                            <TextArea label="Bio" value={data.personal.bio} onChange={v => handleInputChange('personal', 'bio', v)} />
                            <div className="h-px bg-surface" />
                            <div className="space-y-4">
                                <Input icon={Mail} placeholder="Email" value={data.contact.email} onChange={v => handleInputChange('contact', 'email', v)} type="email" />
                                <PhoneInput international defaultCountry="GB" value={data.contact.phone || ''} onChange={v => handleInputChange('contact', 'phone', v || '')} placeholder="Phone" flags={flags} />
                                <Input icon={Globe} placeholder="Website" value={data.contact.website} onChange={v => handleInputChange('contact', 'website', v)} />
                                <Input icon={Linkedin} placeholder="LinkedIn" value={data.social.linkedin} onChange={v => handleInputChange('social', 'linkedin', v)} />
                                <Input icon={Twitter} placeholder="Twitter" value={data.social.twitter} onChange={v => handleInputChange('social', 'twitter', v)} />
                                <Input icon={Instagram} placeholder="Instagram" value={data.social.instagram} onChange={v => handleInputChange('social', 'instagram', v)} />
                                <Input icon={Github} placeholder="Github" value={data.social.github} onChange={v => handleInputChange('social', 'github', v)} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'links' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-medium">Custom Links</h3>
                                {settings.allow_links_customisation !== false ? (
                                    <button onClick={addLink} className="text-sm font-bold text-indigo-600 flex items-center gap-1"><Plus size={16} /> Add Link</button>
                                ) : (
                                    <LockedOption message="Your organisation has disabled custom links." />
                                )}
                            </div>
                            {settings.allow_links_customisation === false ? (
                                <div className="text-center py-8 text-text-muted">Custom links are disabled by your organisation.</div>
                            ) : (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={data.links.map(l => l.id)} strategy={verticalListSortingStrategy}>
                                        {data.links.map((link, idx) => (
                                            <SortableLinkItem key={link.id} link={link}>
                                                {({ setNodeRef, style, attributes, listeners }) => (
                                                    <div ref={setNodeRef} style={style} className="bg-surface p-4 rounded-input border border-border relative">
                                                        <div className="absolute top-2 left-2 flex gap-1">
                                                            <button {...attributes} {...listeners} className="p-1 rounded border"><GripVertical size={14} /></button>
                                                            <button onClick={() => reorderLinks(idx, idx-1)} disabled={idx===0}><ChevronUp size={14} /></button>
                                                            <button onClick={() => reorderLinks(idx, idx+1)} disabled={idx===data.links.length-1}><ChevronDown size={14} /></button>
                                                        </div>
                                                        <button onClick={() => removeLink(link.id)} className="absolute top-2 right-2"><X size={16} /></button>
                                                        <div className="grid gap-3 pt-6">
                                                            <div className="flex gap-3">
                                                                <div className="w-10 h-10 rounded bg-card border flex items-center justify-center">
                                                                    {React.createElement(ICON_MAP[link.icon] || (() => <Globe size={20} />))}
                                                                </div>
                                                                <input type="text" placeholder="Title" value={link.title} onChange={e => updateLink(link.id, 'title', e.target.value)} className="flex-1 px-3 py-2 rounded-input border" />
                                                            </div>
                                                            <input type="text" placeholder="URL" value={link.url} onChange={e => updateLink(link.id, 'url', e.target.value)} className="w-full px-3 py-2 rounded-input border" />
                                                            <div className="flex gap-2 overflow-x-auto">
                                                                {Object.keys(ICON_MAP).map(iconKey => (
                                                                    <button key={iconKey} onClick={() => updateLink(link.id, 'icon', iconKey)} className={`p-2 rounded border ${link.icon === iconKey ? 'bg-indigo-50 border-indigo-500' : ''}`}>
                                                                        {React.createElement(ICON_MAP[iconKey], { size: 16 })}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </SortableLinkItem>
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    )}

                    {activeTab === 'images' && (
                        <div className="space-y-8">
                            {settings.allow_image_customisation === false ? (
                                <LockedOption message="Image uploads are disabled by your organisation." />
                            ) : (
                                <>
                                    <ImageUpload label="Profile Picture" image={data.images.avatar} onUpload={e => handleImageUpload('avatar', e)} onRemove={() => handleInputChange('images', 'avatar', null)} />
                                    <ImageUpload label="Header Banner" image={data.images.banner} onUpload={e => handleImageUpload('banner', e)} onRemove={() => handleInputChange('images', 'banner', null)} isBanner />
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'style' && (
                        <div className="space-y-6">
                            {settings.allow_theme_customisation === false ? (
                                <LockedOption message="Theme colour customisation is disabled by your organisation." />
                            ) : (
                                <div className="flex flex-wrap gap-4">
                                    {settings.theme_colors?.map(color => (
                                        <button key={color.name} onClick={() => handleInputChange('theme', 'color', color.name)} className={`w-12 h-12 rounded-full relative ${data.theme.color === color.name ? 'ring-4 ring-slate-200 scale-110' : ''}`} style={{ background: color.gradientStyle }}>
                                            {data.theme.color === color.name && <Check className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="space-y-6">
                            {settings.allow_privacy_customisation === false ? (
                                <LockedOption message="Privacy settings are controlled by your organisation." />
                            ) : (
                                <>
                                    <Toggle label="Require Interaction" description="Users must click to reveal email/phone" checked={data.privacy.requireInteraction} onChange={val => handleInputChange('privacy', 'requireInteraction', val)} />
                                    <Toggle label="Client-Side Obfuscation" description="Encode contact info in HTML" checked={data.privacy.clientSideObfuscation} onChange={val => handleInputChange('privacy', 'clientSideObfuscation', val)} />
                                    <Toggle label="Block Search Engines" description="Add noindex meta tag" checked={data.privacy.blockRobots} onChange={val => handleInputChange('privacy', 'blockRobots', val)} />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Preview */}
            <div className="hidden lg:flex w-1/2 bg-border-subtle items-center justify-center p-10">
                <div className="w-[375px] h-[750px] bg-card rounded-[3rem] shadow-2xl border-8 border-card overflow-hidden">
                    <CardDisplay data={data} settings={settings} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
                </div>
            </div>
        </div>
    );
}