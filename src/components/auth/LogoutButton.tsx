import { signOut } from "@/auth";

export default function LogoutButton() {
    return (
        <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
        }}>
            <button type="submit" className="btn-primary">登出</button>
        </form>
    );
}