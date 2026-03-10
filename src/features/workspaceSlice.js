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
            const response = await fetch("http://localhost:5000z-10 bg-white dark:bg-zinc-900 min-w-68 flex flex-col h-screen border-r border-gray-200 dark:border-zinc-800 max-sm:absolute transition-all -left-full z-10 bg-white dark:bg-zinc-900 min-w-68 flex flex-col h-screen border-r border-gray-200 dark:border-zinc-800 max-sm:absolute transition-all -left-full /api/projects", {
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
                            tasks: (p.tasks || []).map(t => ({ ...t, id: t.id || t._id }))
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
                    status: (p.status || "Planning").toUpperCase().replace(" ", "_"),
                    priority: (p.priority || "Medium").toUpperCase(),
                    tasks: (p.tasks || []).map(t => ({ ...t, id: t.id || t._id }))
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
                        status: (projectPayload.status || "Planning").toUpperCase().replace(" ", "_"),
                        priority: (projectPayload.priority || "Medium").toUpperCase(),
                        tasks: (projectPayload.tasks || []).map(t => ({ ...t, id: t.id || t._id }))
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
            });
    },
});

export const { setWorkspaces, setCurrentWorkspace, addWorkspace, updateWorkspace, deleteWorkspace, addProject, addTask, updateTask, deleteTask, updateProject } = workspaceSlice.actions;
export default workspaceSlice.reducer;