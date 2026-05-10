import { useEffect, useState } from "react";
import { ArrowRight, Clock, AlertTriangle, User } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectCurrentUser } from "../features/authSlice";
import { useTranslation } from "react-i18next";

export default function TasksSummary() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentWorkspace } = useSelector((state) => state.workspace);
    const user = useSelector(selectCurrentUser);
    const [tasks, setTasks] = useState([]);

    // Get all tasks for all projects in current workspace
    useEffect(() => {
        if (currentWorkspace) {
            setTasks(currentWorkspace.projects?.flatMap((project) => project.tasks || []) || []);
        }
    }, [currentWorkspace]);

    const myTasks = tasks.filter(t => {
        const assigneeId = t.assignee?.id || t.assignee?._id || t.assignee;
        return assigneeId === (user?.id || user?._id);
    });
    const overdueTasks = tasks.filter(t => {
        const dDate = t.dueDate || t.due_date;
        return dDate && new Date(dDate) < new Date() && t.status.toUpperCase() !== 'DONE';
    });
    const inProgressIssues = tasks.filter(i => i.status.toUpperCase() === 'IN_PROGRESS' || i.status.toUpperCase() === 'IN PROGRESS');

    const summaryCards = [
        {
            title: t("My Tasks"),
            count: myTasks.length,
            icon: User,
            color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
            items: myTasks.slice(0, 3)
        },
        {
            title: t("Overdue"),
            count: overdueTasks.length,
            icon: AlertTriangle,
            color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400",
            items: overdueTasks.slice(0, 3)
        },
        {
            title: t("In Progress"),
            count: inProgressIssues.length,
            icon: Clock,
            color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400",
            items: inProgressIssues.slice(0, 3)
        }
    ];

    return (
        <div className="space-y-6">
            {summaryCards.map((card) => (
                <div key={card.title} className="bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 rounded-lg overflow-hidden">
                    <div className="border-b border-zinc-200 dark:border-zinc-800 p-4 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                                <card.icon className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                            </div>
                            <div className="flex items-center justify-between flex-1">
                                <h3 className="text-sm font-medium text-gray-800 dark:text-white">{card.title}</h3>
                                <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${card.color}`}>
                                    {card.count}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4">
                        {card.items.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-4">
                                {t("No tasks found")}
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {card.items.map((issue) => (
                                    <div key={issue.id} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer" onClick={() => navigate(`/taskDetails?projectId=${issue.projectId || issue.project?.id || issue.project}&taskId=${issue.id}`)}>
                                        <h4 className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                            {issue.title}
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-zinc-400 capitalize mt-1">
                                            {t(issue.type)} • {t(issue.priority)} {t("priority")}
                                        </p>
                                    </div>
                                ))}
                                <button onClick={() => navigate('/my-tasks')} className="flex items-center justify-center w-full text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white mt-4 border-t border-zinc-100 dark:border-zinc-900 pt-3">
                                    {t("View all tasks")} <ArrowRight className="w-3 h-3 ml-2" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
