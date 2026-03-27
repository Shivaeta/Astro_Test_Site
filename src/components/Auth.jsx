import { useState } from "react";
import { signIn } from "../lib/auth";

export default function Auth() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);

    const handleLogin = async () => {
        if (!email) return;
        await signIn(email);
        setSent(true);
    };

    return (
        <div style={{ marginBottom: "20px" }}>
            <input
                type="email"
                placeholder="Enter your email"
                onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={handleLogin}>Login</button>

            {sent && <p>Check your email for login link</p>}
        </div>
    );
}