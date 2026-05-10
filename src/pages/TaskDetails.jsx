import { format } from "date-fns";
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarIcon, MessageCircle, PenIcon } from "lucide-react";
import { fetchProjects, fetchTaskById } from "../features/workspaceSlice";
import { selectCurrentUser } from "../features/authSlice";
import { assets } from "../assets/assets";
import { useTranslation } from "react-i18next";

const TaskDetails = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");

    const user = useSelector(selectCurrentUser);
    const [task, setTask] = useState(null);
    const [project, setProject] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);

    const { currentWorkspace } = useSelector((state) => state.workspace);

    const fetchComments = async () => {

    };

    const fetchTaskDetails = async () => {
        if (!projectId || !taskId || projectId === "undefined" || taskId === "undefined") {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            // Try to get from local state first
            let proj = currentWorkspace?.projects?.find((p) => p.id === projectId);
            let tsk = proj?.tasks?.find((t) => t.id === taskId);

            // If not found in current project, search all projects in workspace
            if (!tsk && currentWorkspace?.projects) {
                for (const p of currentWorkspace.projects) {
                    const foundTask = p.tasks?.find(t => t.id === taskId);
                    if (foundTask) {
                        tsk = foundTask;
                        proj = p;
                        break;
                    }
                }
            }

            if (!tsk) {
                // If not in local state, fetch from server
                const result = await dispatch(fetchTaskById({ projectId, taskId }));
                if (fetchTaskById.fulfilled.match(result)) {
                    tsk = result.payload.task;
                    if (tsk) {
                        // Normalize task id
                        if (!tsk.id) tsk.id = tsk._id;

                        // If project info is missing or doesn't match, get it from task payload
                        if (tsk.project && typeof tsk.project === 'object') {
                            const tskProjId = tsk.project.id || tsk.project._id;
                            // Search again with the correct project ID if needed
                            if (!proj || proj.id !== tskProjId) {
                                proj = currentWorkspace?.projects?.find((p) => p.id === tskProjId) ||
                                    { ...tsk.project, id: tskProjId };
                            }
                        }
                    }
                }
            }

            if (tsk) setTask(tsk);
            if (proj) setProject(proj);

            // If project still not found and we are not in loading state of workspace, fetch projects
            if (!proj && currentWorkspace) {
                dispatch(fetchProjects());
            }
        } catch (error) {
            console.error("Error fetching task details:", error);
            toast.error("Failed to load task details");
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {

            toast.loading("Adding comment...");

            //  Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const dummyComment = { id: Date.now(), user: { id: 1, name: "User", image: assets.profile_img_a }, content: newComment, createdAt: new Date() };

            setComments((prev) => [...prev, dummyComment]);
            setNewComment("");
            toast.dismissAll();
            toast.success("Comment added.");
        } catch (error) {
            toast.dismissAll();
            toast.error(error?.response?.data?.message || error.message);
            console.error(error);
        }
    };

    useEffect(() => { fetchTaskDetails(); }, [taskId, projectId, currentWorkspace]);

    useEffect(() => {
        if (taskId && task) {
            fetchComments();
            const interval = setInterval(() => { fetchComments(); }, 10000);
            return () => clearInterval(interval);
        }
    }, [taskId, task]);

    if (loading) return (
        <div className="max-w-6xl mx-auto p-4 space-y-4 animate-pulse">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mb-8"></div>
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-2/3 h-[60vh] bg-zinc-100 dark:bg-zinc-900 rounded-md"></div>
                <div className="w-full lg:w-1/3 space-y-4">
                    <div className="h-40 bg-zinc-100 dark:bg-zinc-900 rounded-md"></div>
                    <div className="h-40 bg-zinc-100 dark:bg-zinc-900 rounded-md"></div>
                </div>
            </div>
        </div>
    );

    if (!task) return (
        <div className="max-w-6xl mx-auto p-4 text-center py-20">
            <div className="text-red-500 text-xl font-medium">{t("Task not found")}</div>
            <p className="text-zinc-500 mt-2">{t("The task you are looking for does not exist or has been moved.")}</p>
        </div>
    );

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-6 sm:p-4 text-gray-900 dark:text-zinc-100 max-w-6xl mx-auto min-h-screen">
            {/* Left: Comments / Chatbox */}
            <div className="w-full lg:w-2/3 flex flex-col">
                <div className="p-5 rounded-lg border border-gray-300 dark:border-zinc-800 flex flex-col h-[60vh] lg:h-[80vh] bg-white dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                            <MessageCircle className="size-5 text-blue-500" />
                            {t("Task Discussion")}
                            <span className="text-xs font-normal bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500">{comments.length}</span>
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
                        {comments.length > 0 ? (
                            <div className="flex flex-col gap-4 mb-6">
                                {comments.map((comment) => (
                                    <div key={comment.id} className={`max-w-[85%] p-3 rounded-2xl shadow-sm border ${comment.user.id === user?.id ? "ml-auto bg-blue-600 text-white border-blue-500" : "mr-auto bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200"}`} >
                                        <div className="flex items-center gap-2 mb-1.5 text-xs opacity-80">
                                            <img src={comment.user.image} alt="avatar" className="size-4 rounded-full border border-white/50" />
                                            <span className="font-semibold">{comment.user.id === user?.id ? t("You") : comment.user.name}</span>
                                            <span>
                                                • {format(new Date(comment.createdAt), "HH:mm")}
                                            </span>
                                        </div>
                                        <p className="text-sm leading-relaxed">{comment.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-50 grayscale">
                                <MessageCircle className="size-12 mb-2" />
                                <p className="text-sm">{t("No comments yet. Start the conversation!")}</p>
                            </div>
                        )}
                    </div>

                    {/* Add Comment */}
                    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="flex gap-2 items-end bg-zinc-100 dark:bg-zinc-800/50 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={t("Write a comment...")}
                                className="flex-1 bg-transparent border-none rounded-md p-2 text-sm text-gray-900 dark:text-zinc-200 resize-none focus:outline-none placeholder:text-zinc-500"
                                rows={2}
                            />
                            <button onClick={handleAddComment} className="bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm h-fit" >
                                {t("Post")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Task + Project Info */}
            <div className="w-full lg:w-1/3 flex flex-col gap-6">
                {/* Task Info */}
                <div className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 shadow-sm space-y-6">
                    <div>
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100 leading-tight">{task.title}</h1>
                            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500">
                                <PenIcon className="size-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700">
                                {task.status}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-900/50">
                                {task.type}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/50">
                                {task.priority}
                            </span>
                        </div>
                    </div>

                    {task.description && (
                        <div>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">{t("Description")}</p>
                            <p className="text-sm text-gray-600 dark:text-zinc-400 leading-[1.6]">{task.description}</p>
                        </div>
                    )}

                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">{t("Assignee")}</p>
                            <div className="flex items-center gap-2">
                                <div className="size-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                    {task.assignee?.name?.charAt(0) || "-"}
                                </div>
                                <span className="text-sm font-medium">{task.assignee?.name || t("Unassigned")}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">{t("Deadline")}</p>
                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                <CalendarIcon className="size-4 opacity-70" />
                                <span className="text-sm font-medium">{task.dueDate ? format(new Date(task.dueDate), "dd MMM yyyy") : "-"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project Info */}
                {project && (
                    <div className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 shadow-sm">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">{t("Project Context")}</p>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                                <PenIcon className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 leading-tight">{project.name}</h3>
                                <p className="text-xs text-zinc-500 mt-0.5">{t("Started")} {project.startDate ? format(new Date(project.startDate), "MMM yyyy") : "-"}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px] font-medium">
                                    <span className="text-zinc-500">{t("Completion")}</span>
                                    <span className="text-blue-500">{project.progress || 0}%</span>
                                </div>
                                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                    <div className="h-full bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${project.progress || 0}%` }} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <span className="text-xs font-medium text-zinc-500">{t("Priority Level")}</span>
                                <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 uppercase tracking-wider">
                                    {project.priority}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskDetails;
