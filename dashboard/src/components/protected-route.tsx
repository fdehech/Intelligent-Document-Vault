import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import DocumentAnalyzer from "@/components/document-analyzer"

interface ProtectedRouteProps {
    children?: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const navigate = useNavigate()
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Check if user is logged in
        const loggedIn = localStorage.getItem("userLoggedIn") === "true"
        setIsLoggedIn(loggedIn)
        setIsLoading(false)

        if (!loggedIn) {
            navigate("/login")
        }
    }, [navigate])

    if (isLoading) return null

    return isLoggedIn ? (children || <DocumentAnalyzer />) : null
}
