import React, { useState } from 'react';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import Toggle from '../common/Toggle';
import ImageUpload from '../common/ImageUpload';
import ColorSelector from '../common/ColorSelector';
import LinkList from './LinkList';
import LockedOption from '../common/LockedOption';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import flags from 'country-flag-icons/react/3x2';
import { Mail, Globe, Linkedin, Twitter, Instagram, Github } from 'lucide-react';

export default function EditorForm({ data, setData, settings, onImageUpload, isUploading }) {
    const [activeTab, setActiveTab] = useState('details');

    const handleInputChange = (section, field, value) => {
        setData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    };

    const renderDetailsTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Prefix (e.g., Dr.)" value={data.personal.prefix} onChange={v => handleInputChange('personal', 'prefix', v)} />
                <Input label="Suffix (e.g., PhD)" value={data.personal.suffix} onChange={v => handleInputChange('personal', 'suffix', v)} />
                <Input label="First Name" value={data.personal.firstName} onChange={v => handleInputChange('personal', 'firstName', v)} />
                <Input label="Middle Name" value={data.personal.middleName} onChange={v => handleInputChange('personal', 'middleName', v)} />
                <Input label="Last Name" value={data.personal.lastName} onChange={v => handleInputChange('personal', 'lastName', v)} />
                <Input label="Job Title" value={data.personal.title} onChange={v => handleInputChange('personal', 'title', v)} />
                <div className="space-y-1">
                    <label className="text-sm font-medium text-text-primary dark:text-text-secondary-dark">Organisation</label>
                    <input type="text" value={settings.default_organisation || ''} disabled className="w-full px-4 py-2.5 rounded-input border bg-surface cursor-not-allowed" />
                    <p className="text-xs text-text-muted">Set by organisation</p>
                </div>
            </div>
            <Input label="Location" value={data.personal.location} onChange={v => handleInputChange('personal', 'location', v)} />
            <TextArea label="Bio" value={data.personal.bio} onChange={v => handleInputChange('personal', 'bio', v)} />
            <div className="h-px bg-surface" />
            <div className="space-y-4">
                <Input icon={Mail} placeholder="Email" value={data.contact.email} onChange={v => handleInputChange('contact', 'email', v)} type="email" />
                <PhoneInput international defaultCountry="GB" value={data.contact.phone || ''} onChange={v => handleInputChange('contact', 'phone', v || '')} placeholder="Phone" flags={flags} />
                <Input icon={Globe} placeholder="Website" value={data.contact.website} onChange={v => handleInputChange('contact', 'website', v)} type="url" />
                <Input icon={Linkedin} placeholder="LinkedIn" value={data.social.linkedin} onChange={v => handleInputChange('social', 'linkedin', v)} type="url" />
                <Input icon={Twitter} placeholder="Twitter / X" value={data.social.twitter} onChange={v => handleInputChange('social', 'twitter', v)} type="url" />
                <Input icon={Instagram} placeholder="Instagram" value={data.social.instagram} onChange={v => handleInputChange('social', 'instagram', v)} type="url" />
                <Input icon={Github} placeholder="Github" value={data.social.github} onChange={v => handleInputChange('social', 'github', v)} type="url" />
            </div>
        </div>
    );

    const renderLinksTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Custom Links</h3>
                {settings?.allow_links_customisation !== false ? (
                    <button onClick={() => setData(prev => ({ ...prev, links: [...prev.links, { id: Date.now(), title: '', url: '', icon: 'link' }] }))} className="text-sm font-bold text-indigo-600 flex items-center gap-1">+ Add Link</button>
                ) : (
                    <LockedOption message="Your organisation has disabled custom links." />
                )}
            </div>
            {settings?.allow_links_customisation === false ? (
                <div className="text-center py-8 text-text-muted">Custom links are disabled by your organisation.</div>
            ) : (
                <LinkList links={data.links} setLinks={newLinks => setData(prev => ({ ...prev, links: newLinks }))} />
            )}
        </div>
    );

    const renderImagesTab = () => (
        <div className="space-y-8">
            {settings?.allow_image_customisation === false ? (
                <LockedOption message="Image uploads are disabled by your organisation." />
            ) : (
                <>
                    {isUploading && <div className="text-center text-sm text-indigo-600 animate-pulse">Uploading image...</div>}
                    <ImageUpload label="Profile Picture" image={data.images.avatar} onUpload={e => onImageUpload('avatar', e)} onRemove={() => handleInputChange('images', 'avatar', null)} />
                    <ImageUpload label="Header Banner" image={data.images.banner} onUpload={e => onImageUpload('banner', e)} onRemove={() => handleInputChange('images', 'banner', null)} isBanner />
                </>
            )}
        </div>
    );

    const renderStyleTab = () => (
        <div className="space-y-6">
            {settings?.allow_theme_customisation === false ? (
                <LockedOption message="Theme colour customisation is disabled by your organisation." />
            ) : (
                <div className="flex flex-wrap gap-4">
                    {(settings?.theme_colors || []).map(color => (
                        <button key={color.name} onClick={() => handleInputChange('theme', 'color', color.name)} className={`w-12 h-12 rounded-full relative ${data.theme.color === color.name ? 'ring-4 ring-slate-200 scale-110' : ''}`} style={{ background: color.gradientStyle }}>
                            {data.theme.color === color.name && <Check className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const renderPrivacyTab = () => (
        <div className="space-y-6">
            {settings?.allow_privacy_customisation === false ? (
                <LockedOption message="Privacy settings are controlled by your organisation." />
            ) : (
                <>
                    <Toggle label="Require Interaction" description="Requires users to click a button to reveal email and phone." checked={data.privacy?.requireInteraction ?? true} onChange={val => handleInputChange('privacy', 'requireInteraction', val)} />
                    <div className="h-px bg-border-subtle" />
                    <Toggle label="Client-Side Obfuscation" description="Encodes email and phone in HTML to make scraping harder." checked={data.privacy?.clientSideObfuscation ?? false} onChange={val => handleInputChange('privacy', 'clientSideObfuscation', val)} />
                    <div className="h-px bg-border-subtle" />
                    <Toggle label="Block Search Engines" description="Adds meta robots tag to prevent indexing." checked={data.privacy?.blockRobots ?? false} onChange={val => handleInputChange('privacy', 'blockRobots', val)} />
                </>
            )}
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Tab navigation */}
            <div className="flex p-1 bg-surface dark:bg-surface-dark rounded-input">
                {['details', 'links', 'images', 'style', 'privacy'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-sm font-medium rounded-button capitalize transition-all ${activeTab === tab ? 'bg-card dark:bg-surface-dark shadow text-text-primary dark:text-text-primary-dark' : 'text-text-muted dark:text-text-muted-dark hover:text-text-primary'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === 'details' && renderDetailsTab()}
            {activeTab === 'links' && renderLinksTab()}
            {activeTab === 'images' && renderImagesTab()}
            {activeTab === 'style' && renderStyleTab()}
            {activeTab === 'privacy' && renderPrivacyTab()}
        </div>
    );
}

// Import Check icon
import { Check } from 'lucide-react';