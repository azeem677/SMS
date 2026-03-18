import { Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Team from "./pages/Team";
import ProjectDetails from "./pages/ProjectDetails";
import TaskDetails from "./pages/TaskDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import MyTasks from "./pages/MyTasks";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchProjects, fetchWorkspaces, updateTask } from "./features/workspaceSlice";
import { selectIsAuthenticated } from "./features/authSlice";
import ProtectedRoute from "./components/ProtectedRoute";
import { io } from "socket.io-client";

// Main Application Component
const App = () => {
    const dispatch = useDispatch();
    const isAuthenticated = useSelector(selectIsAuthenticated);

    useEffect(() => {
        let socket;
        if (isAuthenticated) {
            dispatch(fetchWorkspaces());
            dispatch(fetchProjects());

            socket = io("http://localhost:5000");

            socket.on("taskUpdated", (updatedTask) => {
                const normalizedTask = {
                    ...updatedTask,
                    id: updatedTask.id || updatedTask._id,
                    projectId: updatedTask.projectId || updatedTask.project?._id || updatedTask.project?.id || updatedTask.project,
                    assignee: updatedTask.assignee ? (typeof updatedTask.assignee === 'object' ? { ...updatedTask.assignee, id: updatedTask.assignee._id || updatedTask.assignee.id } : updatedTask.assignee) : null
                };
                dispatch(updateTask(normalizedTask));
            });
        }

        return () => {
            if (socket) socket.disconnect();
        };
    }, [isAuthenticated, dispatch]);

    return (
        <>
            <Toaster />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Dashboard />} />
                    <Route path="team" element={<Team />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="projects/:id" element={<ProjectDetails />} />
                    <Route path="taskDetails" element={<TaskDetails />} />
                    <Route path="chat" element={<Chat />} />
                    <Route path="my-tasks" element={<MyTasks />} />
                </Route>
            </Routes>
        </>
    );
};

export default App;
