import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCurrentWorkspace } from "../features/workspaceSlice";
import CreateWorkspaceDialog from "./CreateWorkspaceDialog";



function WorkspaceDropdown() {
    const { workspaces } = useSelector((state) => state.workspace);
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    const [isOpen, setIsOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const dropdownRef = useRef(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const onSelectWorkspace = (workspaceId) => {
        dispatch(setCurrentWorkspace(workspaceId))
        setIsOpen(false);
        navigate('/')
    }

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative m-4" ref={dropdownRef}>
            <button onClick={() => setIsOpen(prev => !prev)} className="w-full flex items-center justify-between p-3 h-auto text-left rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors" >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img 
                            src={currentWorkspace?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentWorkspace?.name || "W")}&background=random`} 
                            alt={currentWorkspace?.name} 
                            className="w-8 h-8 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 object-cover" 
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                        <p className="font-bold text-gray-800 dark:text-white text-sm truncate">
                            {currentWorkspace?.name || "Select Workspace"}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium uppercase tracking-wider">
                            {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-72 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-2xl top-full left-0 mt-2 p-1.5 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2 px-2">
                            Your Workspaces
                        </p>
                        <div className="space-y-1 max-h-64 overflow-y-auto no-scrollbar">
                            {workspaces.map((ws) => (
                                <div 
                                    key={ws.id} 
                                    onClick={() => onSelectWorkspace(ws.id)} 
                                    className={`flex items-center gap-3 p-2 cursor-pointer rounded-lg transition-all ${
                                        currentWorkspace?.id === ws.id 
                                            ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400' 
                                            : 'hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                                    }`} 
                                >
                                    <img 
                                        src={ws.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(ws.name)}&background=random`} 
                                        alt={ws.name} 
                                        className="w-8 h-8 rounded shadow-sm object-cover" 
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">
                                            {ws.name}
                                        </p>
                                        <p className="text-[10px] opacity-70 truncate">
                                            {ws.membersCount || ws.members?.length || 1} members
                                        </p>
                                    </div>
                                    {currentWorkspace?.id === ws.id && (
                                        <Check className="w-4 h-4 flex-shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-1 pt-1 border-t border-gray-100 dark:border-zinc-800">
                        <button 
                            onClick={() => {
                                setIsCreateDialogOpen(true);
                                setIsOpen(false);
                            }}
                            className="flex items-center gap-2 w-full p-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-all"
                        >
                            <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                                <Plus className="w-3.5 h-3.5" />
                            </div>
                            Create New Workspace
                        </button>
                    </div>
                </div>
            )}

            <CreateWorkspaceDialog 
                isOpen={isCreateDialogOpen} 
                onClose={() => setIsCreateDialogOpen(false)} 
            />
        </div>
    );
}


export default WorkspaceDropdown;
