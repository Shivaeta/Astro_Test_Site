import { supabase } from "./supabase";

// Send magic link (WITH redirect)
export async function signIn(email) {
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${window.location.origin}/timer`,
        },
    });

    if (error) {
        console.error("Login error:", error);
    }
}

// Get current user
export async function getUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
        console.error("Get user error:", error);
        return null;
    }

    return data?.user || null;
}

// Logout
export async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Logout error:", error);
    }
}