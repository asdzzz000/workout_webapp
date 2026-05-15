import { signIn } from "@/auth"
import { AuthError } from "next-auth";
import Link from "next/link";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const error = (await searchParams).error;

    async function loginAction(formData: FormData) {
        "use server";
        try {
            await signIn("credentials", {
                email: formData.get("email"),
                password: formData.get("password"),
                redirectTo: "/",
            });
        } catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw error;
        }
    }

    return (
        <main className="container" style={{ maxWidth: "400px", marginTop: "10vh" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <Link href="/" style={{ fontSize: "1.5rem", fontWeight: "900", color: "var(--foreground)", textDecoration: "none", letterSpacing: "-0.05em" }}>
                    FLEX<span style={{ color: "var(--primary)" }}>TRACK</span>
                </Link>
            </div>
            <div className="card">
                <h1 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1.5rem", textAlign: "center" }}>歡迎回來</h1>

                {error && <p style={{ color: "red", fontSize: "0.875rem", marginBottom: "1rem", textAlign: "center" }}>登入失敗，請檢查帳號密碼</p>}
                <form action={loginAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <input className="btn-secondary" style={{ textAlign: "left", cursor: "text" }} type="email" name="email" placeholder="Email" required />
                    <input className="btn-secondary" style={{ textAlign: "left", cursor: "text" }} type="password" name="password" placeholder="密碼" required />
                    <button className="btn-primary" type="submit">登入</button>
                </form>

                <p className="text-muted" style={{ marginTop: "1.5rem", textAlign: "center" }}>
                    還沒有帳號？ <a href="/register" style={{ color: "var(--primary)", textDecoration: "none" }}>立即註冊</a>
                </p>
            </div>
        </main>
    );
}