import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Trash2, Upload, LogOut, Zap, User } from "lucide-react"
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

interface Document {
    id: string
    title: string
    filename: string
    created_at: string
    summary?: string
    tags?: string[]
}

export default function DocumentAnalyzer() {
    const navigate = useNavigate()
    const [documents, setDocuments] = useState<Document[]>([])
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
    const [queryInput, setQueryInput] = useState("")
    const [results, setResults] = useState<string>("")
    const [showQADialog, setShowQADialog] = useState(false)
    const [qaQuestion, setQaQuestion] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchDocuments()
    }, [])

    const fetchDocuments = async () => {
        try {
            const docs = await api.get<Document[]>("/documents/")
            setDocuments(docs)
            if (docs.length > 0 && !selectedDoc) {
                setSelectedDoc(docs[0])
            }
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

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsLoading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
            const token = localStorage.getItem("accessToken");

            console.log("📤 Uploading file:", file.name, "Size:", file.size, "bytes");

            const response = await fetch(`${API_URL}/documents/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            console.log("📡 Upload response:", response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("❌ Upload failed:", errorText);
                throw new Error(`Upload failed: ${response.status} - ${errorText.substring(0, 100)}`);
            }

            const newDoc = await response.json();
            console.log("✅ Upload successful:", newDoc);

            // Update list immediately for instant feedback
            setDocuments(prev => [...prev, newDoc]);

            // Select the newly uploaded document
            setSelectedDoc(newDoc)
            setResults(`Document uploaded and analyzed!\nSummary: ${newDoc.summary || "No summary available."}`)
        } catch (error) {
            console.error("🚨 Upload error:", error)
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            setResults(`Error uploading document: ${errorMessage}`)
            alert(`Upload failed: ${errorMessage}`)
        } finally {
            setIsLoading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleQuery = async () => {
        if (!queryInput.trim() || !selectedDoc) return
        setIsLoading(true)

        try {
            const response = await api.post<{ response: string }>("/chat/", {
                message: queryInput,
                document_ids: [selectedDoc.id]
            })
            setResults(`Query Response: ${response.response}`)
        } catch (error) {
            console.error("Query error:", error)
            setResults("Error processing query.")
        } finally {
            setQueryInput("")
            setIsLoading(false)
        }
    }

    const handleSummary = async () => {
        if (!selectedDoc) return
        setResults(`📄 SUMMARY: ${selectedDoc.summary || "No summary available."}`)
    }

    const handleExtractEntities = async () => {
        if (!selectedDoc) return
        // In a real app, this might be a separate API call or part of metadata
        // Show tags if available, otherwise use chat API to extract entities
        if (selectedDoc.tags && selectedDoc.tags.length > 0) {
            setResults(`🏷️ TAGS: ${selectedDoc.tags.join(", ")}`)
        } else {
            // Fallback to asking chat
            setIsLoading(true)
            try {
                const response = await api.post<{ response: string }>("/chat/", {
                    message: "Extract entities from this document",
                    document_ids: [selectedDoc.id]
                })
                setResults(`🏷️ ENTITIES: ${response.response}`)
            } catch (error) {
                setResults("Could not extract entities.")
            } finally {
                setIsLoading(false)
            }
        }
    }

    const handleQASubmit = async () => {
        if (!qaQuestion.trim() || !selectedDoc) return
        setIsLoading(true)

        try {
            const response = await api.post<{ response: string }>("/chat/", {
                message: qaQuestion,
                document_ids: [selectedDoc.id]
            })
            setResults(`Q&A Response: ${response.response}`)
            setQaQuestion("")
            setShowQADialog(false)
        } catch (error) {
            console.error("QA error:", error)
            setResults("Error processing question.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteDocument = async (id: string) => {
        if (!confirm("Are you sure you want to delete this document?")) return

        try {
            await api.delete(`/documents/${id}`)
            const newDocs = documents.filter((doc) => doc.id !== id)
            setDocuments(newDocs)
            if (selectedDoc?.id === id) {
                setSelectedDoc(newDocs[0] || null)
                setResults("")
            }
        } catch (error) {
            console.error("Delete error:", error)
            alert("Failed to delete document")
        }
    }

    const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : ""
    const userProvider = typeof window !== "undefined" ? localStorage.getItem("userProvider") : ""
    const userDisplay = userEmail || (userProvider ? `Logged in via ${userProvider}` : "User")

    return (
        <div className="min-h-screen bg-background text-foreground grid-bg scanlines">
            <header className="border-b-2 border-accent/50 bg-card/50 sticky top-0 z-50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl font-mono pulse-accent">▓▒░</div>
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-bold text-accent font-mono tracking-wider">DOC.ROASTER 3000</h1>
                            <p className="text-xs text-muted-foreground font-mono">// AI Powered Document Analysis Terminal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-accent rounded-full pulse-accent" />
                            <span className="text-sm text-muted-foreground font-mono">{userDisplay}</span>
                        </div>
                        <Button
                            onClick={() => navigate("/profile")}
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
                <div className="mb-8 pb-6 retro-divider">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="text-accent" size={20} />
                        <h2 className="text-xl font-mono text-accent font-bold">ANALYSIS STATION</h2>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono leading-tight">
                        &gt; Load documents, deploy AI analysis, witness the roasting
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-mono font-bold text-accent">≡ DOCUMENTS VAULT</h3>
                                <p className="text-xs text-muted-foreground font-mono mt-1">({documents.length} files loaded)</p>
                            </div>
                            <div className="relative">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-accent/20 hover:bg-accent/30 text-accent border-2 border-accent font-semibold py-2 h-auto font-mono rounded-none flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-accent/50"
                                    variant="outline"
                                    disabled={isLoading}
                                >
                                    <Upload size={16} />
                                    [UPLOAD]
                                </Button>
                            </div>
                        </div>

                        <Card className="bg-card border-2 border-accent/30 overflow-hidden max-h-96 overflow-y-auto card-glow">
                            {documents.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground font-mono text-sm">
                                    No documents found. Upload one to start.
                                </div>
                            ) : (
                                documents.map((doc, idx) => (
                                    <div
                                        key={doc.id}
                                        onClick={() => setSelectedDoc(doc)}
                                        className={`p-4 border-b-2 cursor-pointer transition-all ${selectedDoc?.id === doc.id
                                            ? "bg-accent/15 border-l-4 border-l-accent border-b-accent"
                                            : "border-b-border hover:bg-card/80 hover:border-b-accent/50"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-accent font-mono text-xs">[{idx + 1}]</span>
                                                    <p className="font-mono font-semibold text-foreground truncate text-sm">{doc.filename || doc.title}</p>
                                                </div>
                                                <p className="text-xs text-muted-foreground font-mono ml-6">
                                                    {new Date(doc.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteDocument(doc.id)
                                                }}
                                                className="text-muted-foreground hover:text-accent transition-colors flex-shrink-0 hover:scale-110"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-mono line-clamp-2 ml-6">{doc.summary || "No summary"}</p>
                                    </div>
                                ))
                            )}
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-mono font-bold text-accent">≡ AI QUERY ENGINE</h3>
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                                &gt; Real-time analysis powered by roaster AI
                            </p>
                        </div>

                        <Card className="bg-card border-2 border-accent/30 p-5 space-y-5 card-glow">
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-accent font-bold">QUICK ACTIONS:</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <Button
                                        onClick={handleSummary}
                                        disabled={!selectedDoc || isLoading}
                                        className="bg-accent/20 hover:bg-accent/30 text-accent border-2 border-accent font-semibold py-2 h-auto font-mono rounded-none text-xs transition-all hover:shadow-lg hover:shadow-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        variant="outline"
                                    >
                                        [SUMMARIZE]
                                    </Button>
                                    <Button
                                        onClick={handleExtractEntities}
                                        disabled={!selectedDoc || isLoading}
                                        className="bg-accent/20 hover:bg-accent/30 text-accent border-2 border-accent font-semibold py-2 h-auto font-mono rounded-none text-xs transition-all hover:shadow-lg hover:shadow-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        variant="outline"
                                    >
                                        [ENTITIES]
                                    </Button>
                                    <Button
                                        onClick={() => setShowQADialog(true)}
                                        disabled={!selectedDoc || isLoading}
                                        className="bg-accent/20 hover:bg-accent/30 text-accent border-2 border-accent font-semibold py-2 h-auto font-mono rounded-none text-xs transition-all hover:shadow-lg hover:shadow-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        variant="outline"
                                    >
                                        [Q&A]
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t-2 border-dashed border-border">
                                <label className="text-xs font-mono text-accent font-bold">&gt; CUSTOM QUERY:</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={queryInput}
                                        onChange={(e) => setQueryInput(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && handleQuery()}
                                        placeholder="ask something ridiculous..."
                                        className="terminal-input flex-1 px-3 py-2 text-sm"
                                        disabled={!selectedDoc || isLoading}
                                    />
                                    <Button
                                        onClick={handleQuery}
                                        disabled={!selectedDoc || isLoading || !queryInput.trim()}
                                        className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-2 h-auto font-mono rounded-none px-4 transition-all hover:shadow-lg hover:shadow-accent/50 disabled:opacity-50"
                                    >
                                        {isLoading ? "[...]" : "[SEND]"}
                                    </Button>
                                </div>
                            </div>

                            {results && (
                                <div className="bg-muted/60 border-l-4 border-l-accent p-4 rounded-none space-y-2">
                                    <p className="text-xs font-mono text-accent font-bold">&gt; RESULT:</p>
                                    <p className="text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed">{results}</p>
                                </div>
                            )}

                            {!results && selectedDoc && (
                                <div className="bg-muted/30 border-2 border-dashed border-border p-4 rounded-none text-center">
                                    <p className="text-xs font-mono text-muted-foreground">&gt; select an action or query to begin</p>
                                </div>
                            )}

                            {!selectedDoc && (
                                <div className="bg-muted/30 border-2 border-dashed border-border p-4 rounded-none text-center">
                                    <p className="text-xs font-mono text-muted-foreground">&gt; load a document from the vault first</p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </main>

            <Dialog open={showQADialog} onOpenChange={setShowQADialog}>
                <DialogContent className="bg-card border-2 border-accent/50 rounded-none max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-accent font-mono text-lg">[QUESTION & ANSWER MODE]</DialogTitle>
                        <DialogDescription className="text-muted-foreground font-mono text-xs">
                            &gt; query the knowledge within {selectedDoc?.filename || selectedDoc?.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <textarea
                            value={qaQuestion}
                            onChange={(e) => setQaQuestion(e.target.value)}
                            placeholder="what do you want to know?"
                            className="terminal-input w-full px-3 py-2 text-sm min-h-24 resize-none"
                        />
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button
                            onClick={() => setShowQADialog(false)}
                            className="bg-muted hover:bg-muted/80 text-foreground font-semibold py-2 h-auto font-mono rounded-none flex-1 transition-all"
                            variant="outline"
                        >
                            [CANCEL]
                        </Button>
                        <Button
                            onClick={handleQASubmit}
                            disabled={isLoading || !qaQuestion.trim()}
                            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-2 h-auto font-mono rounded-none flex-1 transition-all hover:shadow-lg hover:shadow-accent/50 disabled:opacity-50"
                        >
                            {isLoading ? "[THINKING...]" : "[SUBMIT]"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
