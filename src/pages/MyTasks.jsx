import { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
    CheckSquare,
    Clock,
    AlertTriangle,
    LayoutGrid,
    List,
    Search,
    Filter,
    Calendar,
    Bug,
    Zap,
    Square,
    GitCommit
} from "lucide-react";
import { selectCurrentUser } from "../features/authSlice";
import { fetchProjects, fetchTasks } from "../features/workspaceSlice";
import { useTranslation } from "react-i18next";

const typeIcons = {
    'Bug': { icon: Bug, color: "text-red-600 dark:text-red-400" },
    'Feature': { icon: Zap, color: "text-blue-600 dark:text-blue-400" },
    'Task': { icon: Square, color: "text-green-600 dark:text-green-400" },
    'Story': { icon: GitCommit, color: "text-purple-600 dark:text-purple-400" },
};

const priorityColors = {
    'Low': "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    'Medium': "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    'High': "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    'Urgent': "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function MyTasks() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(selectCurrentUser);
    const { currentWorkspace } = useSelector((state) => state.workspace);
    const { t } = useTranslation();

    const [view, setView] = useState("list"); // list or grid
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    useEffect(() => {
        dispatch(fetchProjects());
        dispatch(fetchTasks());
    }, [dispatch]);

    const allTasks = useMemo(() => {
        if (!currentWorkspace || !user) return [];
        const userId = user.id || user._id;

        return currentWorkspace.projects.flatMap(project =>
            (project.tasks || []).map(task => ({
                ...task,
                projectName: project.name,
                projectId: project.id || project._id
            }))
        ).filter(task => {
            const assigneeId = task.assignee?.id || task.assignee?._id || task.assignee;
            return assigneeId === userId;
        });
    }, [currentWorkspace, user]);

    const filteredTasks = useMemo(() => {
        return allTasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All" || task.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [allTasks, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const total = allTasks.length;
        const completed = allTasks.filter(t => t.status.toUpperCase() === 'DONE').length;
        const inProgress = allTasks.filter(t => ['IN PROGRESS', 'IN_PROGRESS', 'TO DO', 'TODO'].includes(t.status.toUpperCase())).length;
        const overdue = allTasks.filter(t => {
            const dDate = t.dueDate || t.due_date;
            return dDate && new Date(dDate) < new Date() && t.status.toUpperCase() !== 'DONE';
        }).length;

        return { total, completed, inProgress, overdue };
    }, [allTasks]);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <CheckSquare className="size-6 text-blue-500" />
                        {t("My Tasks")}
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {t("Manage and track all tasks assigned to you across your projects.")}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setView("list")}
                        className={`p-2 rounded border transition-colors ${view === "list" ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/50 dark:text-blue-400" : "bg-white border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
                    >
                        <List className="size-4" />
                    </button>
                    <button
                        onClick={() => setView("grid")}
                        className={`p-2 rounded border transition-colors ${view === "grid" ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/50 dark:text-blue-400" : "bg-white border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
                    >
                        <LayoutGrid className="size-4" />
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: t("Total Assignments"), value: stats.total, icon: CheckSquare, color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" },
                    { label: t("In Progress"), value: stats.inProgress, icon: Clock, color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
                    { label: t("Completed"), value: stats.completed, icon: CheckSquare, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
                    { label: t("Overdue"), value: stats.overdue, icon: AlertTriangle, color: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" },
                ].map((stat, i) => (
                    <div key={i} className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${stat.color}`}>
                            <stat.icon className="size-5" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">{stat.label}</p>
                            <p className="text-xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder={t("Search tasks...")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="size-4 text-zinc-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="All">{t("All Statuses")}</option>
                        <option value="To Do">{t("To Do")}</option>
                        <option value="In Progress">{t("In Progress")}</option>
                        <option value="Done">{t("Done")}</option>
                        <option value="Backlog">{t("Backlog")}</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-zinc-50 dark:bg-zinc-900/20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-full shadow-sm mb-4">
                        <CheckSquare className="size-8 text-zinc-300 dark:text-zinc-700" />
                    </div>
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-white">{t("No tasks found")}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs text-center mt-1">
                        {searchTerm || statusFilter !== "All"
                            ? t("Try adjusting your filters or search term.")
                            : t("You don't have any tasks assigned to you in this workspace.")}
                    </p>
                </div>
            ) : view === "list" ? (
                /* List View */
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-zinc-900 dark:text-white">{t("Title")}</th>
                                    <th className="px-6 py-4 font-semibold text-zinc-900 dark:text-white">{t("Project")}</th>
                                    <th className="px-6 py-4 font-semibold text-zinc-900 dark:text-white">{t("Priority")}</th>
                                    <th className="px-6 py-4 font-semibold text-zinc-900 dark:text-white">{t("Due Date")}</th>
                                    <th className="px-6 py-4 font-semibold text-zinc-900 dark:text-white text-right">{t("Status")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {filteredTasks.map((task) => {
                                    const { icon: Icon, color } = typeIcons[task.type] || typeIcons['Task'];
                                    return (
                                        <tr
                                            key={task.id}
                                            onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)}
                                            className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Icon className={`size-4 ${color}`} />
                                                    <span className="font-medium text-zinc-900 dark:text-white truncate max-w-xs">{task.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-zinc-500 dark:text-zinc-400 truncate max-w-[150px] inline-block">{task.projectName}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityColors[task.priority] || "bg-zinc-100 dark:bg-zinc-800"}`}>
                                                    {task.priority || "Medium"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                                                    <Calendar className="size-3.5" />
                                                    {task.dueDate && !isNaN(new Date(task.dueDate).getTime())
                                                        ? format(new Date(task.dueDate), "MMM d, yyyy")
                                                        : "No date"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${task.status === "Done" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400" :
                                                    task.status === "In Progress" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400" :
                                                        "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                                                    }`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTasks.map((task) => {
                        const { icon: Icon, color } = typeIcons[task.type] || typeIcons['Task'];
                        return (
                            <div
                                key={task.id}
                                onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)}
                                className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-blue-500/50 dark:hover:border-blue-500/30 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Icon className={`size-4 ${color}`} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{task.type}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityColors[task.priority] || "bg-zinc-100 dark:bg-zinc-800"}`}>
                                        {task.priority || "Medium"}
                                    </span>
                                </div>

                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-500 transition-colors">
                                    {task.title}
                                </h3>

                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 italic">
                                    In {task.projectName}
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-900">
                                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-500">
                                        <Calendar className="size-3" />
                                        {task.dueDate && !isNaN(new Date(task.dueDate).getTime())
                                            ? format(new Date(task.dueDate), "MMM d, yy")
                                            : "No date"}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${task.status === "Done" ? "text-emerald-500" :
                                        task.status === "In Progress" ? "text-amber-500" :
                                            "text-zinc-400"
                                        }`}>
                                        {task.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
