import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
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
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            console.log("Fetching workspaces...");
            const response = await fetch("http://localhost:5000/api/workspaces", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Fetch workspaces failed:", response.status, errorData);
                return rejectWithValue(errorData.message || "Failed to fetch workspaces");
            }

            const data = await response.json();
            console.log("Workspaces fetched successfully:", data);
            return data;
        } catch (error) {
            console.error("Network error during fetchWorkspaces:", error);
            return rejectWithValue(error.message);
        }
    }
);

export const fetchProjects = createAsyncThunk(
    "workspace/fetchProjects",
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            console.log("Fetching projects...");
            const response = await fetch("http://localhost:5000/api/projects", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Fetch projects failed:", response.status, errorData);
                return rejectWithValue(errorData.message || "Failed to fetch projects");
            }

            const data = await response.json();
            console.log("Projects fetched successfully:", data);
            return data;
        } catch (error) {
            console.error("Network error during fetchProjects:", error);
            return rejectWithValue(error.message);
        }
    }
);

export const createProject = createAsyncThunk(
    "workspace/createProject",
    async (projectData, { getState, rejectWithValue }) => {
        try {
            console.log("Creating project with payload:", projectData);
            const token = getState().auth.token;
            const response = await fetch("http://localhost:5000/api/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(projectData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Project creation failed. Status:", response.status, "Error:", errorData);
                return rejectWithValue(errorData.message || "Failed to create project");
            }

            const data = await response.json();
            console.log("Project created successfully:", data);
            return data;
        } catch (error) {
            console.error("Network or unexpected error during project creation:", error);
            return rejectWithValue(error.message);
        }
    }
);

export const fetchTasks = createAsyncThunk(
    "workspace/fetchTasks",
    async (projectId, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const url = projectId
                ? `http://localhost:5000/api/projects/${projectId}/tasks`
                : "http://localhost:5000/api/tasks";

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.error || errorData.message || "Failed to fetch tasks");
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const createTaskFromServer = createAsyncThunk(
    "workspace/createTaskFromServer",
    async (taskData, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const projectId = taskData.projectId || taskData.project;

            // Prefer project-specific URL if projectId is available
            const url = projectId
                ? `http://localhost:5000/api/projects/${projectId}/tasks`
                : "http://localhost:5000/api/tasks";

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(taskData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.error || errorData.message || "Failed to create task");
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchTaskById = createAsyncThunk(
    "workspace/fetchTaskById",
    async ({ projectId, taskId }, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.error || errorData.message || "Failed to fetch task");
            }

            const data = await response.json();
            const task = data.data;
            const resolvedProjectId = (projectId && projectId !== "undefined")
                ? projectId
                : (task.project?._id || task.project?.id || task.project);

            return { task, projectId: resolvedProjectId };
        } catch (error) {
            return rejectWithValue(error.message);
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