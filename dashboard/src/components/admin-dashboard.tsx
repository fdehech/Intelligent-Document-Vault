import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { LogOut, Users, FileText, BarChart3, Edit, Trash2, Plus, Upload, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { api } from "@/lib/api"

interface User {
    id: string
    full_name: string
    email: string
    created_at: string
    is_active: boolean
    is_superuser: boolean
    // documents: number // Not yet available from API
}

interface Document {
    id: string
    title: string
    filename: string
    owner_id: string
    created_at: string
    summary?: string
    tags?: string[]
}

export default function AdminDashboard() {
    const navigate = useNavigate()
    const [users, setUsers] = useState<User[]>([])
    const [documents, setDocuments] = useState<Document[]>([])
    const [showUserDialog, setShowUserDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [deletingUser, setDeletingUser] = useState<User | null>(null)
    const [formData, setFormData] = useState({ full_name: "", email: "", password: "", is_active: true, is_superuser: false })

    // Document State
    const [showDocumentDialog, setShowDocumentDialog] = useState(false)
    const [showDeleteDocumentDialog, setShowDeleteDocumentDialog] = useState(false)
    const [showUploadDialog, setShowUploadDialog] = useState(false)
    const [editingDocument, setEditingDocument] = useState<Document | null>(null)
    const [deletingDocument, setDeletingDocument] = useState<Document | null>(null)
    const [documentFormData, setDocumentFormData] = useState({ title: "", summary: "", tags: "" })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        fetchUsers()
        fetchDocuments()
    }, [])

    const fetchUsers = async () => {
        try {
            const data = await api.get<User[]>("/users/")
            setUsers(data)
        } catch (error) {
            console.error("Failed to fetch users:", error)
        }
    }

    const fetchDocuments = async () => {
        try {
            const data = await api.get<Document[]>("/documents/")
            setDocuments(data)
        } catch (error) {
            console.error("Failed to fetch documents:", error)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("userLoggedIn")
        localStorage.removeItem("userEmail")
        localStorage.removeItem("userProvider")
        localStorage.removeItem("userType")
        localStorage.removeItem("accessToken")
        navigate("/login")
    }

    const handleAddUser = () => {
        setEditingUser(null)
        setFormData({ full_name: "", email: "", password: "", is_active: true, is_superuser: false })
        setShowUserDialog(true)
    }

    const handleEditUser = (user: User) => {
        setEditingUser(user)
        setFormData({
            full_name: user.full_name,
            email: user.email,
            password: "", // Don't show password
            is_active: user.is_active,
            is_superuser: user.is_superuser
        })
        setShowUserDialog(true)
    }

    const handleDeleteUser = (user: User) => {
        setDeletingUser(user)
        setShowDeleteDialog(true)
    }

    const handleSaveUser = async () => {
        setIsLoading(true)
        try {
            if (editingUser) {
                // Update existing user
                const updateData: any = {
                    full_name: formData.full_name,
                    email: formData.email,
                    is_active: formData.is_active,
                    is_superuser: formData.is_superuser
                }
                if (formData.password) {
                    updateData.password = formData.password
                }

                await api.put<User>(`/users/${editingUser.id}`, updateData)
            } else {
                // Add new user
                await api.post<User>("/users/", {
                    full_name: formData.full_name,
                    email: formData.email,
                    password: formData.password,
                    is_active: formData.is_active,
                    is_superuser: formData.is_superuser
                })
            }
            await fetchUsers()
            setShowUserDialog(false)
        } catch (error) {
            console.error("Failed to save user:", error)
            alert("Failed to save user")
        } finally {
            setIsLoading(false)
        }
    }

    const confirmDelete = async () => {
        if (!deletingUser) return
        setIsLoading(true)
        try {
            await api.delete(`/users/${deletingUser.id}`)
            await fetchUsers()
            setShowDeleteDialog(false)
            setDeletingUser(null)
        } catch (error) {
            console.error("Failed to delete user:", error)
            alert("Failed to delete user")
        } finally {
            setIsLoading(false)
        }
    }

    // Document Handlers
    const handleEditDocument = (doc: Document) => {
        setEditingDocument(doc)
        setDocumentFormData({
            title: doc.title,
            summary: doc.summary || "",
            tags: doc.tags ? doc.tags.join(", ") : ""
        })
        setShowDocumentDialog(true)
    }

    const handleDeleteDocument = (doc: Document) => {
        setDeletingDocument(doc)
        setShowDeleteDocumentDialog(true)
    }

    const handleSaveDocument = async () => {
        if (!editingDocument) return
        setIsLoading(true)
        try {
            await api.put<Document>(`/documents/${editingDocument.id}`, {
                title: documentFormData.title,
                summary: documentFormData.summary,
                tags: documentFormData.tags.split(",").map(t => t.trim()).filter(t => t)
            })
            await fetchDocuments()
            setShowDocumentDialog(false)
        } catch (error) {
            console.error("Failed to save document:", error)
            alert("Failed to save document")
        } finally {
            setIsLoading(false)
        }
    }

    const confirmDeleteDocument = async () => {
        if (!deletingDocument) return
        setIsLoading(true)
        try {
            await api.delete(`/documents/${deletingDocument.id}`)
            await fetchDocuments()
            setShowDeleteDocumentDialog(false)
            setDeletingDocument(null)
        } catch (error) {
            console.error("Failed to delete document:", error)
            alert("Failed to delete document")
        } finally {
            setIsLoading(false)
        }
    }

    const handleUploadDocument = async () => {
        if (!selectedFile) return
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("file", selectedFile)

            await api.post<Document>("/documents/", formData)
            await fetchDocuments()
            setShowUploadDialog(false)
            setSelectedFile(null)
        } catch (error) {
            console.error("Failed to upload document:", error)
            alert("Failed to upload document")
        } finally {
            setIsLoading(false)
        }
    }

    // Calculate stats from API data
    const totalDocuments = documents.length
    const activeUsers = users.filter(u => u.is_active).length

    return (
        <div className="min-h-screen bg-background text-foreground grid-bg scanlines">
            {/* Header */}
            <header className="border-b-2 border-accent/50 bg-card/50 sticky top-0 z-50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl font-mono pulse-accent">▓▒░</div>
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-bold text-accent font-mono tracking-wider">ADMIN CONSOLE</h1>
                            <p className="text-xs text-muted-foreground font-mono">// System Management Terminal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-accent rounded-full pulse-accent" />
                            <span className="text-sm text-muted-foreground font-mono">Admin</span>
                        </div>
                        <Button
                            onClick={() => navigate("/admin/profile")}
                            className="bg-accent/20 hover:bg-accent/30 text-accent border-2 border-accent font-semibold py-2 h-auto font-mono rounded-none flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-accent/50"
                            variant="outline"
                        >
                            <User size={16} />
                            [PROFILE]
                        </Button>
                        <Button
                            onClick={handleLogout}
                            className="bg-accent/20 hover:bg-accent/30 text-accent border-2 border-accent font-semibold py-2 h-auto font-mono rounded-none flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-accent/50"
                            variant="outline"
                        >
                            <LogOut size={16} />
                            [LOGOUT]
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6">
                {/* System Overview */}
                <div className="mb-8 pb-6 retro-divider">
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="text-accent" size={20} />
                        <h2 className="text-xl font-mono text-accent font-bold">SYSTEM OVERVIEW</h2>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono leading-tight">
                        &gt; Real-time analytics and user management dashboard
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-card border-2 border-accent/30 p-6 card-glow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-xs font-mono text-accent font-bold">&gt; TOTAL USERS</div>
                            <Users className="text-accent" size={24} />
                        </div>
                        <div className="text-4xl font-bold text-accent font-mono">{users.length}</div>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-accent rounded-full" />
                            <span className="text-xs text-muted-foreground font-mono">Registered</span>
                        </div>
                    </Card>

                    <Card className="bg-card border-2 border-accent/30 p-6 card-glow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-xs font-mono text-accent font-bold">&gt; ACTIVE USERS</div>
                            <Users className="text-accent" size={24} />
                        </div>
                        <div className="text-4xl font-bold text-accent font-mono">{activeUsers}</div>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-accent rounded-full" />
                            <span className="text-xs text-muted-foreground font-mono">Active</span>
                        </div>
                    </Card>

                    <Card className="bg-card border-2 border-accent/30 p-6 card-glow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-xs font-mono text-accent font-bold">&gt; ACTIVE DOCUMENTS</div>
                            <FileText className="text-accent" size={24} />
                        </div>
                        <div className="text-4xl font-bold text-accent font-mono">{totalDocuments}</div>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-accent rounded-full" />
                            <span className="text-xs text-muted-foreground font-mono">In System</span>
                        </div>
                    </Card>

                    <Card className="bg-card border-2 border-accent/30 p-6 card-glow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-xs font-mono text-accent font-bold">&gt; SYSTEM STATUS</div>
                        </div>
                        <div className="text-2xl font-bold text-accent font-mono">OPTIMAL</div>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-accent rounded-full pulse-accent" />
                            <span className="text-xs text-muted-foreground font-mono">All Systems Green</span>
                        </div>
                    </Card>
                </div>

                {/* User Management */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-mono font-bold text-accent">≡ USER MANAGEMENT</h3>
                            <p className="text-xs text-muted-foreground font-mono mt-1">&gt; View and manage registered users</p>
                        </div>
                        <Button
                            onClick={handleAddUser}
                            className="bg-accent/20 hover:bg-accent/30 text-accent border-2 border-accent font-semibold py-2 h-auto font-mono rounded-none flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-accent/50"
                            variant="outline"
                        >
                            <Plus size={16} />
                            [ADD USER]
                        </Button>
                    </div>

                    <Card className="bg-card border-2 border-accent/30 overflow-hidden card-glow">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-accent/30 bg-accent/5">
                                        <th className="text-left p-4 text-xs font-mono text-accent font-bold">&gt; NAME</th>
                                        <th className="text-left p-4 text-xs font-mono text-accent font-bold">&gt; EMAIL</th>
                                        <th className="text-left p-4 text-xs font-mono text-accent font-bold">&gt; JOINED</th>
                                        <th className="text-left p-4 text-xs font-mono text-accent font-bold">&gt; ROLE</th>
                                        <th className="text-left p-4 text-xs font-mono text-accent font-bold">&gt; STATUS</th>
                                        <th className="text-left p-4 text-xs font-mono text-accent font-bold">&gt; ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b border-border hover:bg-accent/5 transition-colors">
                                            <td className="p-4 font-mono text-sm">{user.full_name}</td>
                                            <td className="p-4 font-mono text-sm text-muted-foreground">{user.email}</td>
                                            <td className="p-4 font-mono text-sm text-muted-foreground">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}
                                            </td>
                                            <td className="p-4 font-mono text-sm text-accent">
                                                {user.is_superuser ? "ADMIN" : "USER"}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs font-mono font-bold border-2 ${user.is_active
                                                    ? "text-accent border-accent bg-accent/10"
                                                    : "text-muted-foreground border-border bg-muted/20"
                                                    }`}>
                                                    [{user.is_active ? "ACTIVE" : "INACTIVE"}]
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="p-2 text-accent hover:bg-accent/20 border border-accent/30 hover:border-accent transition-all"
                                                        title="Edit user"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="p-2 text-destructive hover:bg-destructive/20 border border-destructive/30 hover:border-destructive transition-all"
                                                        title="Delete user"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
                {/* File Management */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-mono font-bold text-accent">≡ FILE MANAGEMENT</h3>
                            <p className="text-xs text-muted-foreground font-mono mt-1">&gt; View and manage system files</p>
                        </div>
                        <Button
                            onClick={() => setShowUploadDialog(true)}
                            className="bg-accent/20 hover:bg-accent/30 text-accent border-2 border-accent font-semibold py-2 h-auto font-mono rounded-none flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-accent/50"
                            variant="outline"
                        >
                            <Upload size={16} />
                            [UPLOAD FILE]
                        </Button>
                    </div>

                    <Card className="bg-card border-2 border-accent/30 overflow-hidden card-glow">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-accent/30 bg-accent/5">
                                        <th className="text-left p-4 text-xs font-mono text-accent font-bold">&gt; TITLE</th>
                                        <th className="text-left p-4 text-xs font-mono text-accent font-bold">&gt; FILENAME</th>
                                        <th className="text-left p-4 text-xs font-mono text-accent font-bold">&gt; OWNER ID</th>
                                        <th className="text-left p-4 text-xs font-mono text-accent font-bold">&gt; CREATED</th>
                                        <th className="text-left p-4 text-xs font-mono text-accent font-bold">&gt; ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documents.map((doc) => (
                                        <tr key={doc.id} className="border-b border-border hover:bg-accent/5 transition-colors">
                                            <td className="p-4 font-mono text-sm">{doc.title}</td>
                                            <td className="p-4 font-mono text-sm text-muted-foreground">{doc.filename}</td>
                                            <td className="p-4 font-mono text-sm text-muted-foreground font-xs">{doc.owner_id}</td>
                                            <td className="p-4 font-mono text-sm text-muted-foreground">
                                                {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "Unknown"}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditDocument(doc)}
                                                        className="p-2 text-accent hover:bg-accent/20 border border-accent/30 hover:border-accent transition-all"
                                                        title="Edit document"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteDocument(doc)}
                                                        className="p-2 text-destructive hover:bg-destructive/20 border border-destructive/30 hover:border-destructive transition-all"
                                                        title="Delete document"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {documents.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-muted-foreground font-mono">
                                                [NO FILES FOUND]
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </main>

            {/* User Dialog */}
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                <DialogContent className="bg-card border-2 border-accent/50 rounded-none max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-accent font-mono text-lg">
                            [{editingUser ? "EDIT USER" : "ADD USER"}]
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground font-mono text-xs">
                            &gt; {editingUser ? "Modify user information" : "Create a new user account"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="block text-xs font-medium text-accent mb-2 font-mono">&gt; NAME:</label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="John Doe"
                                className="w-full px-3 py-2 rounded-none border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-accent mb-2 font-mono">&gt; EMAIL:</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@example.com"
                                className="w-full px-3 py-2 rounded-none border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-accent mb-2 font-mono">&gt; PASSWORD:</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder={editingUser ? "(Leave blank to keep current)" : "Password"}
                                className="w-full px-3 py-2 rounded-none border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="accent-accent"
                                />
                                <label htmlFor="is_active" className="text-xs font-mono text-accent">&gt; ACTIVE</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_superuser"
                                    checked={formData.is_superuser}
                                    onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                                    className="accent-accent"
                                />
                                <label htmlFor="is_superuser" className="text-xs font-mono text-accent">&gt; ADMIN</label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button
                            onClick={() => setShowUserDialog(false)}
                            className="bg-muted hover:bg-muted/80 text-foreground font-semibold py-2 h-auto font-mono rounded-none flex-1 transition-all"
                            variant="outline"
                        >
                            [CANCEL]
                        </Button>
                        <Button
                            onClick={handleSaveUser}
                            disabled={!formData.full_name || !formData.email || (!editingUser && !formData.password) || isLoading}
                            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-2 h-auto font-mono rounded-none flex-1 transition-all hover:shadow-lg hover:shadow-accent/50 disabled:opacity-50"
                        >
                            {isLoading ? "[SAVING...]" : "[SAVE]"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="bg-card border-2 border-destructive/50 rounded-none max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-destructive font-mono text-lg">[DELETE USER]</DialogTitle>
                        <DialogDescription className="text-muted-foreground font-mono text-xs">
                            &gt; This action cannot be undone
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm font-mono text-foreground">
                            Are you sure you want to delete user <span className="text-accent font-bold">{deletingUser?.full_name}</span>?
                        </p>
                        <p className="text-xs font-mono text-muted-foreground mt-2">
                            This will permanently remove their account and all associated data.
                        </p>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button
                            onClick={() => setShowDeleteDialog(false)}
                            className="bg-muted hover:bg-muted/80 text-foreground font-semibold py-2 h-auto font-mono rounded-none flex-1 transition-all"
                            variant="outline"
                        >
                            [CANCEL]
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            disabled={isLoading}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold py-2 h-auto font-mono rounded-none flex-1 transition-all hover:shadow-lg hover:shadow-destructive/50"
                        >
                            {isLoading ? "[DELETING...]" : "[DELETE]"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Document Dialog */}
            <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
                <DialogContent className="bg-card border-2 border-accent/50 rounded-none max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-accent font-mono text-lg">
                            [EDIT DOCUMENT]
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground font-mono text-xs">
                            &gt; Modify document metadata
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="block text-xs font-medium text-accent mb-2 font-mono">&gt; TITLE:</label>
                            <input
                                type="text"
                                value={documentFormData.title}
                                onChange={(e) => setDocumentFormData({ ...documentFormData, title: e.target.value })}
                                className="w-full px-3 py-2 rounded-none border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-accent mb-2 font-mono">&gt; SUMMARY:</label>
                            <textarea
                                value={documentFormData.summary}
                                onChange={(e) => setDocumentFormData({ ...documentFormData, summary: e.target.value })}
                                className="w-full px-3 py-2 rounded-none border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm min-h-[100px]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-accent mb-2 font-mono">&gt; TAGS (comma separated):</label>
                            <input
                                type="text"
                                value={documentFormData.tags}
                                onChange={(e) => setDocumentFormData({ ...documentFormData, tags: e.target.value })}
                                placeholder="tag1, tag2, tag3"
                                className="w-full px-3 py-2 rounded-none border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm"
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button
                            onClick={() => setShowDocumentDialog(false)}
                            className="bg-muted hover:bg-muted/80 text-foreground font-semibold py-2 h-auto font-mono rounded-none flex-1 transition-all"
                            variant="outline"
                        >
                            [CANCEL]
                        </Button>
                        <Button
                            onClick={handleSaveDocument}
                            disabled={!documentFormData.title || isLoading}
                            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-2 h-auto font-mono rounded-none flex-1 transition-all hover:shadow-lg hover:shadow-accent/50 disabled:opacity-50"
                        >
                            {isLoading ? "[SAVING...]" : "[SAVE]"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Document Delete Confirmation Dialog */}
            <Dialog open={showDeleteDocumentDialog} onOpenChange={setShowDeleteDocumentDialog}>
                <DialogContent className="bg-card border-2 border-destructive/50 rounded-none max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-destructive font-mono text-lg">[DELETE DOCUMENT]</DialogTitle>
                        <DialogDescription className="text-muted-foreground font-mono text-xs">
                            &gt; This action cannot be undone
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm font-mono text-foreground">
                            Are you sure you want to delete document <span className="text-accent font-bold">{deletingDocument?.title}</span>?
                        </p>
                        <p className="text-xs font-mono text-muted-foreground mt-2">
                            This will permanently remove the file and all associated data.
                        </p>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button
                            onClick={() => setShowDeleteDocumentDialog(false)}
                            className="bg-muted hover:bg-muted/80 text-foreground font-semibold py-2 h-auto font-mono rounded-none flex-1 transition-all"
                            variant="outline"
                        >
                            [CANCEL]
                        </Button>
                        <Button
                            onClick={confirmDeleteDocument}
                            disabled={isLoading}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold py-2 h-auto font-mono rounded-none flex-1 transition-all hover:shadow-lg hover:shadow-destructive/50"
                        >
                            {isLoading ? "[DELETING...]" : "[DELETE]"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upload Dialog */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent className="bg-card border-2 border-accent/50 rounded-none max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-accent font-mono text-lg">[UPLOAD DOCUMENT]</DialogTitle>
                        <DialogDescription className="text-muted-foreground font-mono text-xs">
                            &gt; Select a file to upload to the system
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="border-2 border-dashed border-accent/30 rounded-none p-8 text-center hover:bg-accent/5 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Upload className="mx-auto text-accent mb-2" size={32} />
                            <p className="text-sm font-mono text-accent font-bold">
                                {selectedFile ? selectedFile.name : "CLICK TO SELECT FILE"}
                            </p>
                            <p className="text-xs font-mono text-muted-foreground mt-1">
                                {selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB` : "Supports PDF, TXT, MD"}
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button
                            onClick={() => {
                                setShowUploadDialog(false)
                                setSelectedFile(null)
                            }}
                            className="bg-muted hover:bg-muted/80 text-foreground font-semibold py-2 h-auto font-mono rounded-none flex-1 transition-all"
                            variant="outline"
                        >
                            [CANCEL]
                        </Button>
                        <Button
                            onClick={handleUploadDocument}
                            disabled={!selectedFile || isLoading}
                            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-2 h-auto font-mono rounded-none flex-1 transition-all hover:shadow-lg hover:shadow-accent/50 disabled:opacity-50"
                        >
                            {isLoading ? "[UPLOADING...]" : "[UPLOAD]"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
