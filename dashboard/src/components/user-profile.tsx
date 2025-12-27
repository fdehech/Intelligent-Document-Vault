import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { User, Mail, Lock, Calendar, Save, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { api } from "@/lib/api"

interface UserData {
    id: string
    email: string
    full_name: string
    is_superuser: boolean
    is_active: boolean
    created_at: string
}

export default function UserProfile() {
    const navigate = useNavigate()
    const [user, setUser] = useState<UserData | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const [fullName, setFullName] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    useEffect(() => {
        loadUserData()
    }, [])

    const loadUserData = async () => {
        try {
            const token = localStorage.getItem("accessToken")
            if (!token) {
                navigate("/login")
                return
            }

            const userData = await api.get<UserData>("/users/me", { token })
            setUser(userData)
            setFullName(userData.full_name || "")
        } catch (error) {
            console.error("Failed to load user data:", error)
            setError("Failed to load user data")
        }
    }

    const handleSave = async () => {
        setError("")
        setSuccess("")

        // Validate passwords match if changing password
        if (newPassword && newPassword !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        setIsLoading(true)

        try {
            const token = localStorage.getItem("accessToken")
            if (!token) {
                navigate("/login")
                return
            }

            const updateData: any = {
                full_name: fullName
            }

            if (newPassword) {
                updateData.password = newPassword
            }

            const updatedUser = await api.put<UserData>("/users/me", updateData, { token })
            setUser(updatedUser)
            setFullName(updatedUser.full_name || "")
            setNewPassword("")
            setConfirmPassword("")
            setIsEditing(false)
            setSuccess("Profile updated successfully!")
        } catch (error) {
            console.error("Failed to update profile:", error)
            setError("Failed to update profile")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        setFullName(user?.full_name || "")
        setNewPassword("")
        setConfirmPassword("")
        setIsEditing(false)
        setError("")
        setSuccess("")
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-accent font-mono">[LOADING...]</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-6 grid-bg scanlines">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-accent font-mono">[USER PROFILE]</h1>
                        <p className="text-sm text-muted-foreground font-mono mt-1">
                            &gt; Manage your account settings
                        </p>
                    </div>
                    <Button
                        onClick={() => navigate("/")}
                        variant="outline"
                        className="border-accent/50 text-accent hover:bg-accent/10 font-mono"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        [BACK]
                    </Button>
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-none">
                        <p className="text-xs text-red-500 font-mono">&gt; ERROR: {error}</p>
                    </div>
                )}
                {success && (
                    <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-none">
                        <p className="text-xs text-green-500 font-mono">&gt; SUCCESS: {success}</p>
                    </div>
                )}

                {/* Profile Card */}
                <Card className="p-6 bg-card border-2 border-accent/50 card-glow">
                    <div className="space-y-6">
                        {/* Account Info */}
                        <div>
                            <h2 className="text-lg font-bold text-accent font-mono mb-4">[ACCOUNT INFORMATION]</h2>

                            <div className="space-y-4">
                                {/* Email (Read-only) */}
                                <div>
                                    <label className="block text-xs font-medium text-accent mb-2 font-mono">
                                        &gt; EMAIL:
                                    </label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-3 top-3 text-accent/60" />
                                        <input
                                            type="email"
                                            value={user.email}
                                            disabled
                                            className="w-full pl-10 pr-4 py-3 rounded-none border border-border bg-muted/50 text-muted-foreground font-mono text-sm cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground font-mono mt-1">
                                        ▓ Email cannot be changed
                                    </p>
                                </div>

                                {/* Full Name */}
                                <div>
                                    <label className="block text-xs font-medium text-accent mb-2 font-mono">
                                        &gt; FULL NAME:
                                    </label>
                                    <div className="relative">
                                        <User size={18} className="absolute left-3 top-3 text-accent/60" />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            disabled={!isEditing}
                                            className={`w-full pl-10 pr-4 py-3 rounded-none border border-border font-mono text-sm ${isEditing
                                                    ? "bg-muted text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                                                    : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                                                }`}
                                        />
                                    </div>
                                </div>

                                {/* Role Badge */}
                                <div>
                                    <label className="block text-xs font-medium text-accent mb-2 font-mono">
                                        &gt; ROLE:
                                    </label>
                                    <div className="inline-block px-3 py-2 bg-accent/20 border border-accent/50 rounded-none">
                                        <span className="text-sm font-mono text-accent">
                                            {user.is_superuser ? "[ADMIN]" : "[USER]"}
                                        </span>
                                    </div>
                                </div>

                                {/* Created Date */}
                                <div>
                                    <label className="block text-xs font-medium text-accent mb-2 font-mono">
                                        &gt; MEMBER SINCE:
                                    </label>
                                    <div className="relative">
                                        <Calendar size={18} className="absolute left-3 top-3 text-accent/60" />
                                        <input
                                            type="text"
                                            value={new Date(user.created_at).toLocaleDateString()}
                                            disabled
                                            className="w-full pl-10 pr-4 py-3 rounded-none border border-border bg-muted/50 text-muted-foreground font-mono text-sm cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Password Change Section (only when editing) */}
                        {isEditing && (
                            <div>
                                <h2 className="text-lg font-bold text-accent font-mono mb-4">[CHANGE PASSWORD]</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-accent mb-2 font-mono">
                                            &gt; NEW PASSWORD:
                                        </label>
                                        <div className="relative">
                                            <Lock size={18} className="absolute left-3 top-3 text-accent/60" />
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Leave blank to keep current"
                                                className="w-full pl-10 pr-4 py-3 rounded-none border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-accent mb-2 font-mono">
                                            &gt; CONFIRM PASSWORD:
                                        </label>
                                        <div className="relative">
                                            <Lock size={18} className="absolute left-3 top-3 text-accent/60" />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password"
                                                className="w-full pl-10 pr-4 py-3 rounded-none border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-accent/30">
                            {!isEditing ? (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-mono"
                                >
                                    [EDIT PROFILE]
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        onClick={handleSave}
                                        disabled={isLoading}
                                        className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-mono"
                                    >
                                        <Save size={16} className="mr-2" />
                                        {isLoading ? "[SAVING...]" : "[SAVE CHANGES]"}
                                    </Button>
                                    <Button
                                        onClick={handleCancel}
                                        disabled={isLoading}
                                        variant="outline"
                                        className="flex-1 border-accent/50 text-accent hover:bg-accent/10 font-mono"
                                    >
                                        [CANCEL]
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
