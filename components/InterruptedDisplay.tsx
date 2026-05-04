import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

export default function InterruptedDisplay() {
  const t = useTranslations();
  return (
    <motion.div
      key="interrupted"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="text-center space-y-6 absolute -bottom-64 w-xs"
    >
      <h2 className="font-display text-4xl font-extrabold">{t('moveWarning')}</h2>
      <p className="  text-lg max-w-xs mx-auto text-red-400">{t('moveWarningDesc')}</p>
    </motion.div>
  );
}