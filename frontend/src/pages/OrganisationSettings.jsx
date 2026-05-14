import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useModal } from '../context/ModalContext';
import { apiCall } from '../services/api';
import { ArrowLeft, Save, Check, RefreshCw, Plus, Edit3, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import Input from '../components/common/Input';
import Toggle from '../components/common/Toggle';
import ColorSelector from '../components/editor/ColorSelector';
import Logo from '../components/layout/Logo';

const TAILWIND_COLORS = ['indigo', 'blue', 'rose', 'emerald', 'slate', 'purple', 'cyan', 'teal', 'orange', 'pink', 'violet', 'fuchsia', 'amber', 'lime', 'green', 'yellow', 'red'];

function extractBaseColorFromGradient(gradient) {
    const match = gradient?.match(/from-(\w+)-(\d+)/);
    if (match) return { baseColor: match[1], shade: parseInt(match[2]) };
    return null;
}

function getTailwindColorHex(baseColor, shade = 600) {
    const colors = {
        indigo: { 600: '#4f46e5' }, blue: { 600: '#2563eb' }, rose: { 600: '#e11d48' }, emerald: { 600: '#059669' },
        slate: { 600: '#475569' }, purple: { 600: '#7c3aed' }, cyan: { 600: '#0891b2' }, teal: { 600: '#0d9488' },
        orange: { 600: '#ea580c' }, pink: { 600: '#db2777' }, violet: { 600: '#7c3aed' }, fuchsia: { 600: '#c026d3' },
        amber: { 600: '#d97706' }, lime: { 600: '#65a30d' }, green: { 600: '#16a34a' }, yellow: { 600: '#ca8a04' }, red: { 600: '#dc2626' }
    };
    return colors[baseColor]?.[shade] || '#4f46e5';
}

function getComplementaryColor(baseColor) {
    const map = { indigo: 'purple', blue: 'cyan', rose: 'orange', emerald: 'teal', slate: 'slate', purple: 'indigo', cyan: 'blue', teal: 'emerald', orange: 'rose', pink: 'fuchsia', violet: 'purple', fuchsia: 'pink', amber: 'orange', lime: 'green', green: 'emerald', yellow: 'amber', red: 'rose' };
    return map[baseColor] || 'purple';
}

export default function OrganisationSettings() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { settings, fetchAdminSettings } = useSettings();
    const { showAlert, showConfirm } = useModal();
    const [localSettings, setLocalSettings] = useState({
        default_organisation: '',
        theme_variant: 'swiish',
        theme_colors: [],
        allow_theme_customisation: true,
        allow_image_customisation: true,
        allow_links_customisation: true,
        allow_privacy_customisation: true
    });
    const [editingColorIndex, setEditingColorIndex] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isOrganisationNameOpen, setIsOrganisationNameOpen] = useState(true);
    const [isCustomizationControlsOpen, setIsCustomizationControlsOpen] = useState(true);
    const [isThemeColorsOpen, setIsThemeColorsOpen] = useState(true);
    const [isAppThemesOpen, setIsAppThemesOpen] = useState(true);

    useEffect(() => {
        if (settings) {
            setLocalSettings({
                default_organisation: settings.default_organisation || '',
                theme_variant: settings.theme_variant || 'swiish',
                theme_colors: settings.theme_colors || [],
                allow_theme_customisation: settings.allow_theme_customisation !== undefined ? settings.allow_theme_customisation : true,
                allow_image_customisation: settings.allow_image_customisation !== undefined ? settings.allow_image_customisation : true,
                allow_links_customisation: settings.allow_links_customisation !== undefined ? settings.allow_links_customisation : true,
                allow_privacy_customisation: settings.allow_privacy_customisation !== undefined ? settings.allow_privacy_customisation : true
            });
        }
    }, [settings]);

    const initializeColorData = (colors) => {
        if (!colors) return [];
        return colors.map(color => {
            let hexBase, baseColor, colorType;
            const hasValidTailwindGradient = color.gradient && color.gradient.startsWith('from-');
            const hasHexBase = color.hexBase && color.hexBase.startsWith('#');
            if (hasValidTailwindGradient) {
                const extracted = extractBaseColorFromGradient(color.gradient);
                if (extracted) {
                    baseColor = extracted.baseColor;
                    hexBase = getTailwindColorHex(extracted.baseColor, 600);
                    colorType = 'standard';
                } else {
                    baseColor = color.baseColor || 'indigo';
                    hexBase = hasHexBase ? color.hexBase : getTailwindColorHex(baseColor, 600);
                    colorType = color.colorType === 'custom' ? 'custom' : 'standard';
                }
            } else if (hasHexBase) {
                if (color.baseColor && color.colorType !== 'custom') {
                    baseColor = color.baseColor;
                    hexBase = color.hexBase;
                    colorType = 'standard';
                } else {
                    baseColor = null;
                    hexBase = color.hexBase;
                    colorType = 'custom';
                }
            } else {
                baseColor = color.baseColor || 'indigo';
                hexBase = getTailwindColorHex(baseColor, 600);
                colorType = color.colorType === 'custom' ? 'custom' : 'standard';
            }
            const complementaryColor = baseColor ? getComplementaryColor(baseColor) : null;
            const hexSecondary = color.hexSecondary || (complementaryColor ? getTailwindColorHex(complementaryColor, 600) : hexBase);
            const gradientStyle = `linear-gradient(135deg, ${hexBase}, ${hexSecondary})`;
            return {
                name: color.name,
                colorType,
                baseColor,
                hexBase,
                hexSecondary,
                gradientStyle,
                buttonStyle: hexBase,
                linkStyle: hexBase,
                textStyle: hexBase
            };
        });
    };

    const addColor = () => {
        const baseColor = 'indigo';
        const hexBase = getTailwindColorHex(baseColor, 600);
        const complementary = getComplementaryColor(baseColor);
        const hexSecondary = getTailwindColorHex(complementary, 600);
        const newColor = {
            name: `color${localSettings.theme_colors.length + 1}`,
            colorType: 'standard',
            baseColor,
            hexBase,
            hexSecondary,
            gradientStyle: `linear-gradient(135deg, ${hexBase}, ${hexSecondary})`,
            buttonStyle: hexBase,
            linkStyle: hexBase,
            textStyle: hexBase
        };
        setLocalSettings(prev => ({
            ...prev,
            theme_colors: [...prev.theme_colors, newColor],
            theme_variant: 'custom'
        }));
        setEditingColorIndex(localSettings.theme_colors.length);
    };

    const updateColor = (index, field, value) => {
        setLocalSettings(prev => {
            const colors = [...prev.theme_colors];
            const color = { ...colors[index], [field]: value };
            if (field === 'colorType') {
                if (value === 'standard' && !color.baseColor) color.baseColor = 'indigo';
                if (value === 'custom') color.baseColor = null;
            }
            if (color.colorType === 'standard' && field === 'baseColor') {
                color.hexBase = getTailwindColorHex(value, 600);
            }
            if (field === 'hexBase' && color.colorType !== 'custom') {
                color.colorType = 'custom';
                color.baseColor = null;
            }
            const hexBase = color.hexBase || getTailwindColorHex(color.baseColor || 'indigo', 600);
            let hexSecondary;
            if (color.colorType === 'standard') {
                const complementary = getComplementaryColor(color.baseColor);
                hexSecondary = complementary ? getTailwindColorHex(complementary, 600) : hexBase;
                color.hexSecondary = hexSecondary;
            } else if (color.colorType === 'custom') {
                if (field === 'hexSecondary') hexSecondary = value;
                else if (!color.hexSecondary) {
                    const complementary = color.baseColor ? getComplementaryColor(color.baseColor) : null;
                    hexSecondary = complementary ? getTailwindColorHex(complementary, 600) : hexBase;
                    color.hexSecondary = hexSecondary;
                } else hexSecondary = color.hexSecondary;
            } else hexSecondary = color.hexSecondary || hexBase;
            color.gradientStyle = `linear-gradient(135deg, ${hexBase}, ${hexSecondary})`;
            color.buttonStyle = hexBase;
            color.linkStyle = hexBase;
            color.textStyle = hexBase;
            colors[index] = color;
            return { ...prev, theme_colors: colors, theme_variant: 'custom' };
        });
    };

    const removeColor = (index) => {
        if (localSettings.theme_colors.length <= 1) {
            showAlert('You must have at least one color', 'error');
            return;
        }
        showConfirm(`Delete color "${localSettings.theme_colors[index].name}"?`, () => {
            setLocalSettings(prev => ({
                ...prev,
                theme_colors: prev.theme_colors.filter((_, i) => i !== index),
                theme_variant: 'custom'
            }));
            if (editingColorIndex === index) setEditingColorIndex(null);
            else if (editingColorIndex > index) setEditingColorIndex(editingColorIndex - 1);
        }, 'Delete Color', 'Delete', 'Cancel');
    };

    const handleSave = async () => {
        setIsSaving(true);
        const start = Date.now();
        try {
            const colorsToSave = localSettings.theme_colors.map(c => ({
                name: c.name,
                colorType: c.colorType,
                baseColor: c.baseColor,
                hexBase: c.hexBase,
                hexSecondary: c.hexSecondary,
                gradientStyle: c.gradientStyle,
                buttonStyle: c.buttonStyle,
                linkStyle: c.linkStyle,
                textStyle: c.textStyle
            }));
            const res = await apiCall('/api/admin/settings', {
                method: 'POST',
                body: JSON.stringify({
                    default_organisation: localSettings.default_organisation,
                    theme_colors: colorsToSave,
                    theme_variant: localSettings.theme_variant,
                    allow_theme_customisation: localSettings.allow_theme_customisation,
                    allow_image_customisation: localSettings.allow_image_customisation,
                    allow_links_customisation: localSettings.allow_links_customisation,
                    allow_privacy_customisation: localSettings.allow_privacy_customisation
                })
            });
            if (res.ok) {
                setIsSuccess(true);
                setTimeout(() => setIsSuccess(false), 2000);
                await fetchAdminSettings();
                showAlert('Settings saved', 'success');
            } else {
                showAlert('Save failed', 'error');
            }
        } catch (err) {
            showAlert('Error saving settings', 'error');
        } finally {
            const elapsed = Date.now() - start;
            if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));
            setIsSaving(false);
        }
    };

    if (user?.role !== 'owner') {
        return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;
    }

    return (
        <div className="min-h-screen bg-main dark:bg-main-dark flex flex-col lg:flex-row">
            <div className="w-full lg:w-1/2 bg-card dark:bg-card-dark border-r border-border h-auto lg:h-screen overflow-y-auto">
                <div className="p-6 border-b border-border-subtle sticky top-0 bg-card z-10 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/people')} className="p-2 hover:bg-surface rounded-full"><ArrowLeft size={20} /></button>
                        <h1 className="text-xl font-bold">Organisation Settings</h1>
                    </div>
                    <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 bg-confirm text-confirm-text rounded-full font-bold flex items-center gap-2">
                        {isSaving ? <RefreshCw className="w-4 animate-spin" /> : isSuccess ? <Check className="w-4 text-green-500" /> : <Save className="w-4" />}
                        Save
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    {/* Organisation Name */}
                    <div className="border rounded-input">
                        <button onClick={() => setIsOrganisationNameOpen(!isOrganisationNameOpen)} className="w-full flex justify-between items-center p-4">
                            <div className="text-left"><h2 className="font-semibold">Organisation Name</h2><p className="text-sm text-text-muted">Applied to all cards</p></div>
                            {isOrganisationNameOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                        {isOrganisationNameOpen && (
                            <div className="p-4 pt-0">
                                <input type="text" value={localSettings.default_organisation} onChange={e => setLocalSettings({...localSettings, default_organisation: e.target.value})} className="w-full p-2 rounded-input border" />
                            </div>
                        )}
                    </div>

                    {/* Customization Controls */}
                    <div className="border rounded-input">
                        <button onClick={() => setIsCustomizationControlsOpen(!isCustomizationControlsOpen)} className="w-full flex justify-between items-center p-4">
                            <div><h2 className="font-semibold">User Customisation Controls</h2><p className="text-sm text-text-muted">Control what users can customise</p></div>
                            {isCustomizationControlsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                        {isCustomizationControlsOpen && (
                            <div className="p-4 space-y-4">
                                <Toggle label="Allow users to choose theme colors" checked={localSettings.allow_theme_customisation} onChange={val => setLocalSettings({...localSettings, allow_theme_customisation: val})} />
                                <Toggle label="Allow users to upload custom images" checked={localSettings.allow_image_customisation} onChange={val => setLocalSettings({...localSettings, allow_image_customisation: val})} />
                                <Toggle label="Allow users to add custom links" checked={localSettings.allow_links_customisation} onChange={val => setLocalSettings({...localSettings, allow_links_customisation: val})} />
                                <Toggle label="Allow users to change privacy settings" checked={localSettings.allow_privacy_customisation} onChange={val => setLocalSettings({...localSettings, allow_privacy_customisation: val})} />
                            </div>
                        )}
                    </div>

                    {/* App Themes */}
                    <div className="border rounded-input">
                        <button onClick={() => setIsAppThemesOpen(!isAppThemesOpen)} className="w-full flex justify-between items-center p-4">
                            <div><h2 className="font-semibold">App Themes</h2><p className="text-sm text-text-muted">UI look and feel</p></div>
                            {isAppThemesOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                        {isAppThemesOpen && (
                            <div className="p-4 space-y-2">
                                {['swiish', 'minimal'].map(variant => (
                                    <label key={variant} className="flex items-center gap-3 p-2 rounded border cursor-pointer">
                                        <input type="radio" name="theme-variant" value={variant} checked={localSettings.theme_variant === variant} onChange={() => setLocalSettings({...localSettings, theme_variant: variant})} />
                                        <span className="capitalize">{variant}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Profile Colors */}
                    <div className="border rounded-input">
                        <button onClick={() => setIsThemeColorsOpen(!isThemeColorsOpen)} className="w-full flex justify-between items-center p-4">
                            <div><h2 className="font-semibold">Profile Colors</h2><p className="text-sm text-text-muted">Manage colour palette</p></div>
                            {isThemeColorsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                        {isThemeColorsOpen && (
                            <div className="p-4">
                                <div className="flex justify-end mb-4">
                                    <button onClick={addColor} className="text-sm font-bold text-indigo-600 flex items-center gap-1"><Plus size={16} /> Add Color</button>
                                </div>
                                <div className="space-y-4">
                                    {localSettings.theme_colors.map((color, idx) => (
                                        <div key={idx} className="bg-surface p-4 rounded-input">
                                            {editingColorIndex === idx ? (
                                                <div className="space-y-4">
                                                    <div className="flex justify-between">
                                                        <Input label="Name" value={color.name} onChange={v => updateColor(idx, 'name', v)} />
                                                        <button onClick={() => setEditingColorIndex(null)} className="px-3 py-1 bg-card rounded">Done</button>
                                                        <button onClick={() => removeColor(idx)} className="px-3 py-1 text-error">Delete</button>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => updateColor(idx, 'colorType', 'standard')} className={`flex-1 p-2 rounded border ${color.colorType === 'standard' ? 'bg-indigo-50 border-indigo-500' : ''}`}>Standard</button>
                                                        <button onClick={() => updateColor(idx, 'colorType', 'custom')} className={`flex-1 p-2 rounded border ${color.colorType === 'custom' ? 'bg-indigo-50 border-indigo-500' : ''}`}>Custom</button>
                                                    </div>
                                                    {color.colorType === 'standard' ? (
                                                        <ColorSelector selectedColor={color.baseColor} onSelect={val => updateColor(idx, 'baseColor', val)} />
                                                    ) : (
                                                        <>
                                                            <div><label>Base Color</label><input type="color" value={color.hexBase} onChange={e => updateColor(idx, 'hexBase', e.target.value)} className="w-full p-1" /></div>
                                                            <div><label>Secondary Color</label><input type="color" value={color.hexSecondary || ''} onChange={e => updateColor(idx, 'hexSecondary', e.target.value)} className="w-full p-1" /></div>
                                                        </>
                                                    )}
                                                    <div className="h-12 rounded" style={{ background: color.gradientStyle }} />
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-center">
                                                    <div className="flex gap-4">
                                                        <div className="w-12 h-12 rounded-full" style={{ background: color.gradientStyle }} />
                                                        <div><div className="font-medium">{color.name}</div><div className="text-xs text-text-muted">{color.colorType}</div></div>
                                                    </div>
                                                    <button onClick={() => setEditingColorIndex(idx)}><Edit3 size={16} /></button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-6 text-center"><Logo /></div>
            </div>
            <div className="hidden lg:flex w-1/2 bg-main items-center justify-center p-10">
                <div className="bg-card rounded-card p-8 max-w-md">
                    <h3 className="font-bold mb-4">Preview</h3>
                    <div className="space-y-2">
                        <div>Default Org: {localSettings.default_organisation}</div>
                        <div className="h-8 w-full rounded" style={{ background: localSettings.theme_colors[0]?.gradientStyle }} />
                    </div>
                </div>
            </div>
        </div>
    );
}