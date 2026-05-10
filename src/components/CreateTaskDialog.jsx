import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { format } from "date-fns";
import { createTaskFromServer } from "../features/workspaceSlice";
import { fetchAllUsers } from "../features/chatSlice";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function CreateTaskDialog({ showCreateTask, setShowCreateTask, projectId }) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    const users = useSelector((state) => state.chat?.allUsers || []);

    // Fallback to project members if needed, but we prefer a global users list for assignment
    const project = currentWorkspace?.projects.find((p) => p.id === projectId);
    const teamMembers = project?.members || [];

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "Task",
        status: "To Do",
        priority: "Medium",
        assigneeId: "",
        dueDate: "",
    });

    useEffect(() => {
        if (showCreateTask) {
            dispatch(fetchAllUsers());
        }
    }, [showCreateTask, dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const taskData = {
                ...formData,
                project: projectId,
                assignee: formData.assigneeId || null,
            };

            // Remove internal UI state fields not needed by backend
            delete taskData.assigneeId;

            const resultAction = await dispatch(createTaskFromServer(taskData));

            if (createTaskFromServer.fulfilled.match(resultAction)) {
                toast.success("Task created successfully");
                setShowCreateTask(false);
                setFormData({
                    title: "",
                    description: "",
                    type: "Task",
                    status: "To Do",
                    priority: "Medium",
                    assigneeId: "",
                    dueDate: "",
                });
            } else {
                toast.error(resultAction.payload || "Failed to create task");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };


    return showCreateTask ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur p-4">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg shadow-lg w-full max-w-md p-6 text-zinc-900 dark:text-white max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{t("Create New Task")}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-1">
                        <label htmlFor="title" className="text-sm font-medium">{t("Title")}</label>
                        <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder={t("Task title")} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label htmlFor="description" className="text-sm font-medium">{t("Description")}</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder={t("Describe the task")} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    {/* Type & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">{t("Type")}</label>
                            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1" >
                                <option value="Bug">Bug</option>
                                <option value="Feature">Feature</option>
                                <option value="Task">Task</option>
                                <option value="Story">Story</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">{t("Priority")}</label>
                            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1"                             >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    {/* Assignee and Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">{t("Assignee")}</label>
                            <select value={formData.assigneeId} onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1" >
                                <option value="">{t("Unassigned")}</option>
                                {users
                                    .filter(u => !u.id.startsWith("user_") && !u.email.endsWith("@example.com"))
                                    .map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} ({u.email})
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">{t("Status")}</label>
                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1" >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                                <option value="Backlog">Backlog</option>
                            </select>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("Due Date")}</label>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="size-5 text-zinc-500 dark:text-zinc-400" />
                            <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} min={new Date().toISOString().split('T')[0]} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1" />
                        </div>
                        {formData.dueDate && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {format(new Date(formData.dueDate), "PPP")}
                            </p>
                        )}
                    </div>


                    {/* Footer */}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowCreateTask(false)} className="rounded border border-zinc-300 dark:border-zinc-700 px-5 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition" >
                            {t("Cancel")}
                        </button>
                        <button type="submit" disabled={isSubmitting} className="rounded px-5 py-2 text-sm bg-gradient-to-br from-blue-500 to-blue-600 hover:opacity-90 text-white dark:text-zinc-200 transition" >
                            {isSubmitting ? t("Creating...") : t("Create Task")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    ) : null;
}
