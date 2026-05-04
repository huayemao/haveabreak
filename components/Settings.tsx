
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DialogContent, DialogHeader, Dialog, DialogTrigger, DialogTitle } from './ui/dialog';

interface SettingsProps {
  customTips: string[];
  onTipsChange: (tips: string[]) => void;
  disabledPresetTips: string[];
  onDisabledPresetTipsChange: (tips: string[]) => void;
}

const STORAGE_KEY_CUSTOM = 'haveabreak_custom_tips';
const STORAGE_KEY_DISABLED_PRESETS = 'haveabreak_disabled_presets';

export const loadCustomTips = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CUSTOM);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const loadDisabledPresets = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DISABLED_PRESETS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export default function Settings({
  customTips,
  onTipsChange,
  disabledPresetTips,
  onDisabledPresetTipsChange,
}: SettingsProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [newTip, setNewTip] = useState('');

  const handleAddTip = () => {
    if (newTip.trim() && newTip.trim().length <= 100) {
      const updatedTips = [...customTips, newTip.trim()];
      onTipsChange(updatedTips);
      localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(updatedTips));
      setNewTip('');
    }
  };

  const handleDeleteCustomTip = (tip: string) => {
    const updatedTips = customTips.filter(t => t !== tip);
    onTipsChange(updatedTips);
    localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(updatedTips));
  };

  const togglePresetTip = (tip: string) => {
    const updatedDisabled = disabledPresetTips.includes(tip)
      ? disabledPresetTips.filter(t => t !== tip)
      : [...disabledPresetTips, tip];
    onDisabledPresetTipsChange(updatedDisabled);
    localStorage.setItem(STORAGE_KEY_DISABLED_PRESETS, JSON.stringify(updatedDisabled));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTip();
    }
  };

  return (
    <div className="relative">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <button
            className="neumorphic-button mt-4 px-6 py-3 text-base font-medium"
            onClick={() => setOpen(true)}
          >
            {t('settingsBtn')}
          </button>
        </DialogTrigger>
        <DialogContent className="neumorphic-dialog border-none bg-transparent p-0 overflow-hidden max-w-lg md:max-w-xl lg:max-w-2xl">
          <div className="p-6 space-y-6">
            <DialogHeader className="text-center pb-4">
              <DialogTitle className="text-2xl font-bold text-fg-primary">
                {t('settingsTitle')}
              </DialogTitle>
            </DialogHeader>

            {/* Tips Section */}
            <div className="space-y-4">
              <h3 className="font-bold text-fg-primary text-lg">{t('tipsSection')}</h3>

              {/* Add new custom tip */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTip}
                  onChange={(e) => setNewTip(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('addNewTip')}
                  maxLength={100}
                  className="neumorphic-input flex-1 text-fg-primary placeholder-fg-muted"
                />
                <button
                  onClick={handleAddTip}
                  className="neumorphic-button-primary px-6 py-2 font-medium text-white min-w-[60px]"
                >
                  {t('addBtn')}
                </button>
              </div>

              {/* Preset tips */}
              <div className="space-y-2">
                <h4 className="font-semibold text-fg-muted text-sm">{t('presetTips')}</h4>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                  {(t.raw('timerTips') as string[]).map((tip, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
                        disabledPresetTips.includes(tip) ? 'opacity-50' : ''
                      }`}
                      style={{
                        backgroundColor: '#E0E5EC',
                        boxShadow: '5px 5px 10px rgba(163, 177, 198, 0.6), -5px -5px 10px rgba(255, 255, 255, 0.5)',
                      }}
                    >
                      <span className="text-sm flex-1 text-fg-primary">{tip}</span>
                      <button
                        onClick={() => togglePresetTip(tip)}
                        className="neumorphic-button text-xs px-3 py-1"
                      >
                        {disabledPresetTips.includes(tip) ? (t('enable') || 'Enable') : (t('disable') || 'Disable')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom tips */}
              {customTips.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-semibold text-fg-muted text-sm">{t('customTips')}</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {customTips.map((tip, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{
                          backgroundColor: '#E0E5EC',
                          boxShadow: '5px 5px 10px rgba(163, 177, 198, 0.6), -5px -5px 10px rgba(255, 255, 255, 0.5)',
                        }}
                      >
                        <span className="text-sm flex-1 text-fg-primary">{tip}</span>
                        <button
                          onClick={() => handleDeleteCustomTip(tip)}
                          className="neumorphic-button-destructive neumorphic-button text-xs px-3 py-1"
                        >
                          {t('frame.delete')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-fg-muted text-sm text-center py-2">
                  {t('noCustomTips')}
                </p>
              )}
            </div>

            {/* Future configuration sections can be added here */}
            {/* Example: */}
            {/* <div className="border-t border-fg-muted/20 pt-4 space-y-4"> */}
            {/*   <h3 className="font-bold text-fg-primary">Language</h3> */}
            {/*   <p className="text-sm text-fg-muted">Select your preferred language.</p> */}
            {/* </div> */}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
