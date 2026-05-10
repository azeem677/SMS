import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSelector = () => {
    const { i18n } = useTranslation();

    useEffect(() => {
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    }, [i18n.language]);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="relative group flex items-center">
            <button className="flex items-center gap-1 size-8 md:flex hidden justify-center bg-white dark:bg-zinc-800 shadow rounded-lg transition hover:scale-105 active:scale-95 text-gray-700 dark:text-gray-200">
                <Globe size={16} />
                <span className="text-xs uppercase font-medium">{i18n.language}</span>
            </button>
            <div className="absolute right-0 top-full hidden group-hover:block pt-2 w-32 z-50">
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-lg overflow-hidden py-1">
                    <button onClick={() => changeLanguage('en')} className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 ${i18n.language === 'en' ? 'text-blue-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>English</button>
                    <button onClick={() => changeLanguage('es')} className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 ${i18n.language === 'es' ? 'text-blue-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>Español</button>
                    <button onClick={() => changeLanguage('fr')} className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 ${i18n.language === 'fr' ? 'text-blue-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>Français</button>
                    <button onClick={() => changeLanguage('ar')} className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 ${i18n.language === 'ar' ? 'text-blue-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>العربية</button>
                </div>
            </div>
        </div>
    );
};

export default LanguageSelector;
