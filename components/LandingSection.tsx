import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

interface LandingSectionProps {}

export default function LandingSection() {
  const t = useTranslations();
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-5xl mx-auto mt-20 mb-20 space-y-16 px-4 z-10 relative"
    >
      <div className="text-center space-y-6">
        <h2 className="font-display text-4xl font-extrabold  text-fg-primary tracking-tight">{t('landingH2')}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Feature 1 */}
        <div className="p-8 rounded-[32px] shadow-extruded bg-bg-base space-y-6">
          <div className="w-16 h-16 rounded-full shadow-inset flex items-center justify-center">
            <svg className="w-8 h-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </div>
          <h3 className="font-display font-bold text-xl">{t('landingF1Title')}</h3>
          <p className="  leading-relaxed">{t('landingF1Desc')}</p>
        </div>

        {/* Feature 2 */}
        <div className="p-8 rounded-[32px] shadow-extruded bg-bg-base space-y-6">
          <div className="w-16 h-16 rounded-full shadow-inset flex items-center justify-center">
            <svg className="w-8 h-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <h3 className="font-display font-bold text-xl">{t('landingF2Title')}</h3>
          <p className="  leading-relaxed">{t('landingF2Desc')}</p>
        </div>

        {/* Feature 3 */}
        <div className="p-8 rounded-[32px] shadow-extruded bg-bg-base space-y-6">
          <div className="w-16 h-16 rounded-full shadow-inset flex items-center justify-center">
            <svg className="w-8 h-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h3 className="font-display font-bold text-xl">{t('landingF3Title')}</h3>
          <p className="  leading-relaxed">{t('landingF3Desc')}</p>
        </div>
      </div>
    </motion.section>
  );
}