"use client"

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();

    async function registerAction(formData: FormData) {

        const email = formData.get("email");
        const password = formData.get("password");
        const name = formData.get("name");
        const account = formData.get("account");

        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password, name, account }),
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error);
            return;
        }
        alert("註冊成功，請登入");
        router.push("/login");
    }
    return (
        <main className="container" style={{ maxWidth: "400px", marginTop: "10vh" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <Link href="/" style={{ fontSize: "1.5rem", fontWeight: "900", color: "var(--foreground)", textDecoration: "none", letterSpacing: "-0.05em" }}>
                    FLEX<span style={{ color: "var(--primary)" }}>TRACK</span>
                </Link>
            </div>
            <div className="card">
                <h1 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1.5rem", textAlign: "center" }}>註冊</h1>
                <form action={registerAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <input className="btn-secondary" style={{ textAlign: "left", cursor: "text" }} type="text" name="name" placeholder="請輸入您的暱稱" required />
                    <input className="btn-secondary" style={{ textAlign: "left", cursor: "text" }} type="text" name="account" placeholder="請輸入您的帳號名稱" required />
                    <input className="btn-secondary" style={{ textAlign: "left", cursor: "text" }} type="email" name="email" placeholder="請輸入你的 Email" required />
                    <input className="btn-secondary" style={{ textAlign: "left", cursor: "text" }} type="password" name="password" placeholder="請輸入您的密碼" required />
                    <button className="btn-primary" type="submit">註冊</button>
                </form>
                <p className="text-muted" style={{ marginTop: "1.5rem", textAlign: "center" }}>
                    已經有帳號了？ <a href="/login" style={{ color: "var(--primary)", textDecoration: "none" }}>立即登入</a>
                </p>
            </div>
        </main>
    );
}
