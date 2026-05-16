import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../services/api";
import { dummyWorkspaces } from "../assets/assets";


const safeParse = (key, fallback = null) => {
    const item = localStorage.getItem(key);
    if (!item || item === "undefined") return fallback;
    try {
        return JSON.parse(item);
    } catch (e) {
        console.error(`Error parsing localStorage key "${key}":`, e);
        return fallback;
    }
};

const initialWorkspaces = safeParse("workspaces", dummyWorkspaces);
const savedCurrentWorkspaceId = localStorage.getItem("currentWorkspaceId");
let initialCurrentWorkspace = null;

if (savedCurrentWorkspaceId && savedCurrentWorkspaceId !== "undefined") {
    initialCurrentWorkspace = initialWorkspaces.find(w => w.id === savedCurrentWorkspaceId);
}

if (!initialCurrentWorkspace) {
    initialCurrentWorkspace = initialWorkspaces[0];
}

const initialState = {
    workspaces: initialWorkspaces || [],
    currentWorkspace: initialCurrentWorkspace,
    loading: false,
};

const persistState = (state) => {
    localStorage.setItem("workspaces", JSON.stringify(state.workspaces));
};

export const fetchWorkspaces = createAsyncThunk(
    "workspace/fetchWorkspaces",
    async (_, { rejectWithValue }) => {
        try {
            const response = await API.get("/workspaces");
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);


export const createWorkspaceFromServer = createAsyncThunk(
    "workspace/createWorkspaceFromServer",
    async (workspaceData, { rejectWithValue }) => {
        try {
            const response = await API.post("/workspaces", workspaceData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);


export const fetchProjects = createAsyncThunk(
    "workspace/fetchProjects",
    async (_, { rejectWithValue }) => {
        try {
            const response = await API.get("/projects");
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);


export const createProject = createAsyncThunk(
    "workspace/createProject",
    async (projectData, { rejectWithValue }) => {
        try {
            const response = await API.post("/projects", projectData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);


export const fetchTasks = createAsyncThunk(
    "workspace/fetchTasks",
    async (projectId, { rejectWithValue }) => {
        try {
            const url = projectId ? `/projects/${projectId}/tasks` : "/tasks";
            const response = await API.get(url);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || error.message);
        }
    }
);


export const createTaskFromServer = createAsyncThunk(
    "workspace/createTaskFromServer",
    async (taskData, { rejectWithValue }) => {
        try {
            const projectId = taskData.projectId || taskData.project;
            const url = projectId ? `/projects/${projectId}/tasks` : "/tasks";
            const response = await API.post(url, taskData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || error.message);
        }
    }
);


export const fetchTaskById = createAsyncThunk(
    "workspace/fetchTaskById",
    async ({ projectId, taskId }, { rejectWithValue }) => {
        try {
            const response = await API.get(`/tasks/${taskId}`);
            const data = response.data;
            const task = data.data;
            const resolvedProjectId = (projectId && projectId !== "undefined")
                ? projectId
                : (task.project?._id || task.project?.id || task.project);

            return { task, projectId: resolvedProjectId };
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || error.message);
        }
    }
);




const workspaceSlice = createSlice({
    name: "workspace",
    initialState,
    reducers: {
        setWorkspaces: (state, action) => {
            state.workspaces = action.payload;
            persistState(state);
        },
        setCurrentWorkspace: (state, action) => {
            localStorage.setItem("currentWorkspaceId", action.payload);
            state.currentWorkspace = state.workspaces.find((w) => w.id === action.payload);
        },
        addWorkspace: (state, action) => {
            state.workspaces.push(action.payload);

            // set current workspace to the new workspace
            if (state.currentWorkspace?.id !== action.payload.id) {
                state.currentWorkspace = action.payload;
                localStorage.setItem("currentWorkspaceId", action.payload.id);
            }
            persistState(state);
        },
        updateWorkspace: (state, action) => {
            state.workspaces = state.workspaces.map((w) =>
                w.id === action.payload.id ? action.payload : w
            );

            // if current workspace is updated, set it to the updated workspace
            if (state.currentWorkspace?.id === action.payload.id) {
                state.currentWorkspace = action.payload;
            }
            persistState(state);
        },
        deleteWorkspace: (state, action) => {
            state.workspaces = state.workspaces.filter((w) => w.id !== action.payload);
            if (state.currentWorkspace?.id === action.payload) {
                state.currentWorkspace = state.workspaces[0] || null;
                if (state.currentWorkspace) {
                    localStorage.setItem("currentWorkspaceId", state.currentWorkspace.id);
                } else {
                    localStorage.removeItem("currentWorkspaceId");
                }
            }
            persistState(state);
        },
        addProject: (state, action) => {
            if (!state.currentWorkspace) return;
            state.currentWorkspace.projects.push(action.payload);
            // find workspace by id and add project to it
            state.workspaces = state.workspaces.map((w) =>
                w.id === state.currentWorkspace.id ? { ...w, projects: [...w.projects, action.payload] } : w
            );
            persistState(state);
        },
        addTask: (state, action) => {
            if (!state.currentWorkspace) return;
            state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) => {
                if (p.id === action.payload.projectId) {
                    return { ...p, tasks: [...p.tasks, action.payload] };
                }
                return p;
            });

            // find workspace and project by id and add task to it
            state.workspaces = state.workspaces.map((w) =>
                w.id === state.currentWorkspace.id ? {
                    ...w, projects: w.projects.map((p) =>
                        p.id === action.payload.projectId ? { ...p, tasks: [...p.tasks, action.payload] } : p
                    )
                } : w
            );
            persistState(state);
        },
        updateTask: (state, action) => {
            if (!state.currentWorkspace) return;
            state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) => {
                if (p.id === action.payload.projectId) {
                    return {
                        ...p, tasks: p.tasks.map((t) =>
                            t.id === action.payload.id ? action.payload : t
                        )
                    };
                }
                return p;
            });
            // find workspace and project by id and update task in it
            state.workspaces = state.workspaces.map((w) =>
                w.id === state.currentWorkspace.id ? {
                    ...w, projects: w.projects.map((p) =>
                        p.id === action.payload.projectId ? {
                            ...p, tasks: p.tasks.map((t) =>
                                t.id === action.payload.id ? action.payload : t
                            )
                        } : p
                    )
                } : w
            );
            persistState(state);
        },
        deleteTask: (state, action) => {
            if (!state.currentWorkspace) return;
            const { projectId, taskIds } = action.payload;
            state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) => {
                if (p.id === projectId) {
                    return { ...p, tasks: p.tasks.filter((t) => !taskIds.includes(t.id)) };
                }
                return p;
            });
            // find workspace and project by id and delete task from it
            state.workspaces = state.workspaces.map((w) =>
                w.id === state.currentWorkspace.id ? {
                    ...w, projects: w.projects.map((p) =>
                        p.id === projectId ? {
                            ...p, tasks: p.tasks.filter((t) => !taskIds.includes(t.id))
                        } : p
                    )
                } : w
            );
            persistState(state);
        },
        updateProject: (state, action) => {
            if (!state.currentWorkspace) return;
            state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) =>
                p.id === action.payload.id ? action.payload : p
            );
            state.workspaces = state.workspaces.map((w) =>
                w.id === state.currentWorkspace.id ? {
                    ...w, projects: w.projects.map((p) =>
                        p.id === action.payload.id ? action.payload : p
                    )
                } : w
            );
            persistState(state);
        }

    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkspaces.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchWorkspaces.fulfilled, (state, action) => {
                state.loading = false;
                // Handle various payload structures (direct array, .workspaces, or .data)
                let fetchedWorkspaces = Array.isArray(action.payload)
                    ? action.payload
                    : (action.payload?.workspaces && Array.isArray(action.payload.workspaces))
                        ? action.payload.workspaces
                        : (action.payload?.data && Array.isArray(action.payload.data))
                            ? action.payload.data
                            : [];

                if (fetchedWorkspaces.length > 0) {
                    state.workspaces = fetchedWorkspaces.map(w => ({
                        ...w,
                        id: w.id || w._id,
                        projects: (w.projects || []).map(p => ({
                            ...p,
                            id: p.id || p._id,
                            members: p.members || [],
                            tasks: (p.tasks || []).map(t => ({
                                ...t,
                                id: t.id || t._id,
                                projectId: p.id || p._id,
                                assignee: t.assignee ? (typeof t.assignee === 'object' ? { ...t.assignee, id: t.assignee.id || t.assignee._id } : t.assignee) : null
                            }))
                        }))
                    }));

                    // If no current workspace is set, or current is dummy, set first fetched one
                    if (!state.currentWorkspace || String(state.currentWorkspace.id).startsWith("org_")) {
                        state.currentWorkspace = state.workspaces[0];
                        localStorage.setItem("currentWorkspaceId", state.currentWorkspace.id);
                    }
                }
                persistState(state);
            })
            .addCase(createWorkspaceFromServer.fulfilled, (state, action) => {
                const workspace = action.payload?.data || action.payload;
                if (workspace) {
                    const normalizedWS = {
                        ...workspace,
                        id: workspace.id || workspace._id,
                        projects: []
                    };
                    state.workspaces.push(normalizedWS);
                    state.currentWorkspace = normalizedWS;
                    localStorage.setItem("currentWorkspaceId", normalizedWS.id);
                }
                persistState(state);
            })
            .addCase(fetchWorkspaces.rejected, (state) => {
                state.loading = false;
            })
            .addCase(fetchProjects.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchProjects.fulfilled, (state, action) => {
                state.loading = false;

                // Ensure payload is an array or contains a projects array or data array
                let fetchedProjects = Array.isArray(action.payload)
                    ? action.payload
                    : (action.payload?.projects && Array.isArray(action.payload.projects))
                        ? action.payload.projects
                        : (action.payload?.data && Array.isArray(action.payload.data))
                            ? action.payload.data
                            : [];

                // Map _id to id if necessary
                fetchedProjects = fetchedProjects.map(p => ({
                    ...p,
                    id: p.id || p._id,
                    name: p.name || "Untitled Project",
                    status: p.status ? (p.status.charAt(0).toUpperCase() + p.status.slice(1).toLowerCase().replace('_', ' ')) : "Planning",
                    priority: p.priority ? (p.priority.charAt(0).toUpperCase() + p.priority.slice(1).toLowerCase()) : "Medium",
                    members: p.members || [],
                    tasks: (p.tasks || []).map(t => ({
                        ...t,
                        id: t.id || t._id,
                        projectId: p.id || p._id,
                        assignee: t.assignee ? (typeof t.assignee === 'object' ? { ...t.assignee, id: t.assignee.id || t.assignee._id } : t.assignee) : null
                    }))
                }));

                if (state.currentWorkspace) {
                    state.currentWorkspace.projects = fetchedProjects;
                    state.workspaces = state.workspaces.map(w =>
                        w.id === state.currentWorkspace.id ? { ...w, projects: fetchedProjects } : w
                    );
                }
                persistState(state);
            })
            .addCase(fetchProjects.rejected, (state) => {
                state.loading = false;
            })
            .addCase(createProject.pending, (state) => {
                state.loading = true;
            })
            .addCase(createProject.fulfilled, (state, action) => {
                state.loading = false;

                // Normalize payload - either the project itself or action.payload.project or action.payload.data
                let projectPayload = (action.payload?.project)
                    ? action.payload.project
                    : (action.payload?.data)
                        ? action.payload.data
                        : action.payload;

                // Map _id to id and normalize case for frontend
                if (projectPayload) {
                    projectPayload = {
                        ...projectPayload,
                        id: projectPayload.id || projectPayload._id,
                        status: projectPayload.status ? (projectPayload.status.charAt(0).toUpperCase() + projectPayload.status.slice(1).toLowerCase().replace('_', ' ')) : "Planning",
                        priority: projectPayload.priority ? (projectPayload.priority.charAt(0).toUpperCase() + projectPayload.priority.slice(1).toLowerCase()) : "Medium",
                        members: projectPayload.members || [],
                        tasks: (projectPayload.tasks || []).map(t => ({
                            ...t,
                            id: t.id || t._id,
                            assignee: t.assignee ? (typeof t.assignee === 'object' ? { ...t.assignee, id: t.assignee.id || t.assignee._id } : t.assignee) : null
                        }))
                    };
                }

                if (state.currentWorkspace && projectPayload && projectPayload.id) {
                    state.currentWorkspace.projects.push(projectPayload);
                    state.workspaces = state.workspaces.map(w =>
                        w.id === state.currentWorkspace.id ? { ...w, projects: [...w.projects, projectPayload] } : w
                    );
                }
                persistState(state);
            })
            .addCase(createProject.rejected, (state) => {
                state.loading = false;
            })
            .addCase(fetchTasks.fulfilled, (state, action) => {
                // Normalize tasks and add to state
                const tasks = (action.payload?.data || action.payload || []).map(t => {
                    const projectData = t.project;
                    const pId = typeof projectData === 'object' ? (projectData._id || projectData.id) : projectData;
                    return {
                        ...t,
                        id: t.id || t._id,
                        projectId: pId,
                        assignee: t.assignee ? (typeof t.assignee === 'object' ? { ...t.assignee, id: t.assignee.id || t.assignee._id } : t.assignee) : null
                    };
                });

                if (tasks.length > 0 && state.currentWorkspace) {
                    // Group tasks by projectId
                    const tasksByProject = {};
                    tasks.forEach(t => {
                        if (!tasksByProject[t.projectId]) tasksByProject[t.projectId] = [];
                        tasksByProject[t.projectId].push(t);
                    });

                    state.currentWorkspace.projects = state.currentWorkspace.projects.map(p => {
                        // If we fetched a specific project's tasks, we overwrite them.
                        // If we fetched all tasks, we might want to also overwrite p.tasks if tasksByProject has them.
                        if (action.meta.arg) {
                            // Single project fetch
                            return p.id === action.meta.arg ? { ...p, tasks: tasksByProject[p.id] || [] } : p;
                        } else {
                            // All tasks fetch
                            return { ...p, tasks: tasksByProject[p.id] || [] };
                        }
                    });

                    state.workspaces = state.workspaces.map(w =>
                        w.id === state.currentWorkspace.id ? {
                            ...w, projects: w.projects.map(p => {
                                if (action.meta.arg) {
                                    return p.id === action.meta.arg ? { ...p, tasks: tasksByProject[p.id] || [] } : p;
                                } else {
                                    return { ...p, tasks: tasksByProject[p.id] || [] };
                                }
                            })
                        } : w
                    );
                }
                persistState(state);
            })
            .addCase(createTaskFromServer.fulfilled, (state, action) => {
                const task = action.payload?.data || action.payload;
                if (task) {
                    const projectData = task.project;
                    const pId = typeof projectData === 'object' ? (projectData._id || projectData.id) : projectData;
                    const normalizedTask = {
                        ...task,
                        id: task.id || task._id,
                        projectId: pId,
                        assignee: task.assignee ? (typeof task.assignee === 'object' ? { ...task.assignee, id: task.assignee.id || task.assignee._id } : task.assignee) : null
                    };
                    const projectId = typeof task.project === 'string' ? task.project : task.project._id || task.project.id;

                    if (state.currentWorkspace) {
                        state.currentWorkspace.projects = state.currentWorkspace.projects.map(p =>
                            p.id === projectId ? { ...p, tasks: [...(p.tasks || []), normalizedTask] } : p
                        );
                        state.workspaces = state.workspaces.map(w =>
                            w.id === state.currentWorkspace.id ? {
                                ...w, projects: w.projects.map(p =>
                                    p.id === projectId ? { ...p, tasks: [...(p.tasks || []), normalizedTask] } : p
                                )
                            } : w
                        );
                    }
                }
                persistState(state);
            })
            .addCase(fetchTaskById.fulfilled, (state, action) => {
                const { task, projectId } = action.payload;
                if (task) {
                    const normalizedTask = {
                        ...task,
                        id: task.id || task._id,
                        projectId: projectId || (task.project?._id || task.project?.id || task.project)
                    };
                    if (state.currentWorkspace && normalizedTask.projectId) {
                        state.currentWorkspace.projects = state.currentWorkspace.projects.map(p =>
                            p.id === normalizedTask.projectId
                                ? { ...p, tasks: (p.tasks || []).some(t => t.id === normalizedTask.id) ? p.tasks.map(t => t.id === normalizedTask.id ? normalizedTask : t) : [...(p.tasks || []), normalizedTask] }
                                : p
                        );
                    }
                }
                persistState(state);
            });
    },
});


export const { setWorkspaces, setCurrentWorkspace, addWorkspace, updateWorkspace, deleteWorkspace, addProject, addTask, updateTask, deleteTask, updateProject } = workspaceSlice.actions;
export default workspaceSlice.reducer;