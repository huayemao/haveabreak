
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DialogContent, DialogHeader, Dialog, DialogTrigger, DialogTitle } from './ui/dialog';
import { useTimerStore } from '@/store/timerStore';
import { toast } from 'sonner';

interface SettingsProps {
  customTips: string[];
  onTipsChange: (tips: string[]) => void;
  disabledPresetTips: string[];
  onDisabledPresetTipsChange: (tips: string[]) => void;
}

export default function Settings({
  customTips,
  onTipsChange,
  disabledPresetTips,
  onDisabledPresetTipsChange,
}: SettingsProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [newTip, setNewTip] = useState('');
  
  const { settings, setTipIntervalSeconds } = useTimerStore();
  const [localInterval, setLocalInterval] = useState(settings.tipIntervalSeconds);

  const handleAddTip = () => {
    if (newTip.trim() && newTip.trim().length <= 100) {
      const updatedTips = [...customTips, newTip.trim()];
      onTipsChange(updatedTips);
      setNewTip('');
      toast.success(t('timer.tipAdded'));
    }
  };

  const handleDeleteCustomTip = (tip: string) => {
    const updatedTips = customTips.filter(t => t !== tip);
    onTipsChange(updatedTips);
    toast.success(t('timer.tipDeleted'));
  };

  const togglePresetTip = (tip: string) => {
    const updatedDisabled = disabledPresetTips.includes(tip)
      ? disabledPresetTips.filter(t => t !== tip)
      : [...disabledPresetTips, tip];
    onDisabledPresetTipsChange(updatedDisabled);
    const isDisabled = updatedDisabled.includes(tip);
    toast.success(isDisabled ? t('timer.presetTipDisabled') : t('timer.presetTipEnabled'));
  };

  const handleIntervalChange = () => {
    if (localInterval >= 3 && localInterval <= 60) {
      setTipIntervalSeconds(localInterval);
      toast.success(t('timer.settingsApplied'), {
        description: t('timer.tipIntervalDescription', { seconds: localInterval }),
      });
      setOpen(false);
    }
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
            {t('common.settingsBtn')}
          </button>
        </DialogTrigger>
        <DialogContent className="neumorphic-dialog border-none bg-transparent p-0 overflow-hidden max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh]">
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-2rem)]">
            <DialogHeader className="text-center pb-4">
              <DialogTitle className="text-2xl font-bold text-fg-primary">
                {t('common.settingsTitle')}
              </DialogTitle>
            </DialogHeader>

            {/* Tips Section */}
            <div className="space-y-4">
              <h3 className="font-bold text-fg-primary text-lg">{t('timer.tipsSection')}</h3>

              {/* Add new custom tip */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTip}
                  onChange={(e) => setNewTip(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('timer.addNewTip')}
                  maxLength={100}
                  className="neumorphic-input flex-1 text-fg-primary placeholder-fg-muted"
                />
                <button
                  onClick={handleAddTip}
                  className="neumorphic-button-primary px-6 py-2 font-medium text-white min-w-[60px]"
                >
                  {t('common.addBtn')}
                </button>
              </div>

              {/* Preset tips */}
              <div className="space-y-2">
                <h4 className="font-semibold text-fg-muted text-sm">{t('timer.presetTips')}</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {(t.raw('timer.timerTips') as string[]).map((tip, index) => (
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
                  <h4 className="font-semibold text-fg-muted text-sm">{t('timer.customTips')}</h4>
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
                          {t('common.delete')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-fg-muted text-sm text-center py-2">
                  {t('timer.noCustomTips')}
                </p>
              )}
            </div>

            {/* Tip Interval Settings */}
            <div className="border-t border-fg-muted/20 pt-4 space-y-4">
              <h3 className="font-bold text-fg-primary text-lg">{t('timer.tipIntervalSection')}</h3>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="3"
                  max="60"
                  value={localInterval}
                  onChange={(e) => setLocalInterval(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-fg-primary w-12 text-right">
                    {localInterval}
                  </span>
                  <span className="text-sm text-fg-muted">{t('timer.tipIntervalSeconds')}</span>
                </div>
              </div>
              <button
                onClick={handleIntervalChange}
                className="neumorphic-button-primary px-6 py-2 font-medium text-white w-full"
              >
                {t('timer.applySettings')}
              </button>
              <p className="text-xs text-fg-muted text-center">
                {t('timer.tipIntervalDescription', { seconds: localInterval })}
              </p>
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
