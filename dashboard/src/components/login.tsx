import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { api } from "@/lib/api"

export default function LoginPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleEmailLogin = async (e: FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            // 1. Login to get token (using fetch directly for x-www-form-urlencoded)
            const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
            console.log("🔐 LOGIN ATTEMPT:", { email, API_URL });

            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ username: email, password: password })
            });

            console.log("📡 LOGIN RESPONSE:", {
                status: response.status,
                ok: response.ok,
                statusText: response.statusText
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("❌ LOGIN FAILED:", errorData);
                throw new Error(errorData.detail || "Invalid email or password");
            }

            const tokenData = await response.json();
            console.log("✅ LOGIN SUCCESS - Got token");
            localStorage.setItem("accessToken", tokenData.access_token);

            // 2. Get user details
            const user = await api.get<{ is_superuser: boolean, email: string, full_name: string }>("/users/me", {
                token: tokenData.access_token
            });

            console.log("👤 USER DATA:", { email: user.email, is_superuser: user.is_superuser });

            localStorage.setItem("userLoggedIn", "true")
            localStorage.setItem("userEmail", user.email)
            localStorage.setItem("userType", user.is_superuser ? "admin" : "user")

            // Redirect based on user role
            navigate(user.is_superuser ? "/admin" : "/")
        } catch (error) {
            console.error("🚨 LOGIN ERROR:", error)
            setError(error instanceof Error ? error.message : "Login failed. Please check your credentials.")
            // CRITICAL: Do NOT set localStorage on error!
            localStorage.removeItem("userLoggedIn")
            localStorage.removeItem("accessToken")
            localStorage.removeItem("userEmail")
            localStorage.removeItem("userType")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 grid-bg scanlines">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2">
                        <div className="text-4xl font-mono pulse-accent">▓▒░</div>
                        <h1 className="text-4xl font-bold text-accent font-mono">DOC.ROASTER</h1>
                    </div>
                    <p className="text-muted-foreground text-sm font-mono">&gt; AUTHENTICATION REQUIRED</p>
                </div>

                {/* Login Card */}
                <Card className="p-8 bg-card border-2 border-accent/50 card-glow">
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-accent font-mono mb-2">[LOGIN]</h2>
                            <p className="text-xs text-muted-foreground font-mono">
                                Enter your credentials to access the system
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-none">
                                <p className="text-xs text-red-500 font-mono">&gt; ERROR: {error}</p>
                            </div>
                        )}

                        {/* Email/Password Form */}
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-accent mb-2 font-mono">&gt; EMAIL:</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-3 text-accent/60" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-none border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-accent mb-2 font-mono">&gt; PASSWORD:</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3 top-3 text-accent/60" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-none border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || !email || !password}
                                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-3 h-auto font-mono rounded-none"
                            >
                                {isLoading ? "[AUTHENTICATING...]" : "[LOGIN]"}
                            </Button>

                            <div className="text-center text-xs text-muted-foreground font-mono space-y-1">
                                <p className="mt-4">▓ Test Accounts ▓</p>
                                <p>Admin: admin@example.com / admin123</p>
                                <p>User: user@example.com / user123</p>
                            </div>
                        </form>
                    </div>
                </Card>

                {/* Footer Message */}
                <div className="text-center space-y-2">
                    <p className="text-xs text-muted-foreground font-mono">&gt; secure access only</p>
                    <p className="text-xs text-accent/60 font-mono">v1.ROASTER // SYSTEM READY</p>
                </div>
            </div>
        </div>
    )
}
