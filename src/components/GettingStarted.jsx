import React from 'react';
import { Lightbulb, CheckCircle2, Users, BarChart, Rocket, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const GettingStarted = () => {
    const { t } = useTranslation();

    const steps = [
        {
            icon: <Rocket className="text-blue-500" />,
            title: t("Launch Your Workspace"),
            description: t("Start by creating a workspace for your department or team. This is your command center.")
        },
        {
            icon: <Users className="text-purple-500" />,
            title: t("Build Your Dream Team"),
            description: t("Invite members to your project. Assign roles and start collaborating in real-time.")
        },
        {
            icon: <CheckCircle2 className="text-emerald-500" />,
            title: t("Break It Down"),
            description: t("Create projects and break them into manageable tasks. Set deadlines and track progress.")
        },
        {
            icon: <BarChart className="text-amber-500" />,
            title: t("Analyze & Optimize"),
            description: t("Use the Analytics tab to see project health and team productivity at a glance.")
        }
    ];

    return (
        <div className="mt-10 p-8 rounded-3xl bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-900/30 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden relative group">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-700"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <Lightbulb className="size-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("Master Your Projects")}</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">{t("Expert tips to get the most out of this system")}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {steps.map((step, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                            <div className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-4 shadow-inner">
                                {step.icon}
                            </div>
                            <h3 className="font-bold text-zinc-800 dark:text-zinc-100 mb-2">{step.title}</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{step.description}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                    <div className="flex-1 p-5 rounded-2xl bg-blue-600/5 border border-blue-200/20 flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex-1">
                            <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-1">{t("Pro Tip: Global Search")}</h4>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">{t("Use CMD/CTRL + K to quickly find tasks, projects, or team members from anywhere.")}</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
                            {t("Try it now")} <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GettingStarted;
