import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

/* Digit */
function Digit({ value }) {
    const [prev, setPrev] = useState(value);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (value !== prev) {
            setAnimating(true);
            const t = setTimeout(() => {
                setPrev(value);
                setAnimating(false);
            }, 200);
            return () => clearTimeout(t);
        }
    }, [value, prev]);

    return (
        <span className="digit-wrapper">
            <span className={`digit-slide old ${animating ? "out" : ""}`}>
                {prev}
            </span>
            <span className={`digit-slide new ${animating ? "in" : ""}`}>
                {value}
            </span>
        </span>
    );
}

export default function Timer() {
    const [time, setTime] = useState(1500);
    const [initialTime, setInitialTime] = useState(1500);
    const [isRunning, setIsRunning] = useState(false);
    const [endTime, setEndTime] = useState(null);

    const [totalTime, setTotalTime] = useState(0);
    const [todayTime, setTodayTime] = useState(0);
    const [user, setUser] = useState(null);

    const intervalRef = useRef(null);

    /* 🔥 AUTH FIX (this was your main issue) */
    useEffect(() => {
        const loadUser = async () => {
            const { data } = await supabase.auth.getUser();
            const u = data?.user;

            if (u) {
                setUser(u);
                fetchTotalTime(u.id);
                fetchTodayTime(u.id);
            }
        };

        loadUser();

        const { data: listener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                const u = session?.user;

                if (u) {
                    setUser(u);
                    fetchTotalTime(u.id);
                    fetchTodayTime(u.id);
                }
            }
        );

        return () => listener.subscription.unsubscribe();
    }, []);

    /* Save session */
    const saveSession = async (duration) => {
        if (!user) return;

        const { error } = await supabase
            .from("sessions")
            .insert([{ duration, user_id: user.id }]);

        if (error) console.error(error);
    };

    /* Fetch total */
    const fetchTotalTime = async (uid) => {
        const { data } = await supabase
            .from("sessions")
            .select("duration")
            .eq("user_id", uid);

        const total = (data || []).reduce(
            (sum, r) => sum + (r.duration || 0),
            0
        );

        setTotalTime(total);
    };

    /* Fetch today */
    const fetchTodayTime = async (uid) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data } = await supabase
            .from("sessions")
            .select("duration")
            .eq("user_id", uid)
            .gte("created_at", today.toISOString());

        const total = (data || []).reduce(
            (sum, r) => sum + (r.duration || 0),
            0
        );

        setTodayTime(total);
    };

    /* Timer logic */
    useEffect(() => {
        if (!isRunning || !endTime) return;

        intervalRef.current = setInterval(async () => {
            const remaining = Math.max(
                0,
                Math.floor((endTime - Date.now()) / 1000)
            );

            setTime(remaining);

            if (remaining === 0) {
                clearInterval(intervalRef.current);
                setIsRunning(false);

                await saveSession(initialTime);

                if (user) {
                    await fetchTotalTime(user.id);
                    await fetchTodayTime(user.id);
                }

                setTime(initialTime);
            }
        }, 250);

        return () => clearInterval(intervalRef.current);
    }, [isRunning, endTime, user]);

    const start = () => {
        setInitialTime(time);
        setEndTime(Date.now() + time * 1000);
        setIsRunning(true);
    };

    const formatTime = () => {
        const m = Math.floor(time / 60);
        const s = time % 60;

        return `${m.toString().padStart(2, "0")}:${s
            .toString()
            .padStart(2, "0")}`;
    };

    return (
        <div className="timer">
            {!user && <p style={{ marginBottom: "10px" }}>Please login first</p>}

            <div className="time">
                {formatTime().split("").map((c, i) => (
                    <Digit key={i} value={c} />
                ))}
            </div>

            <div className="controls">
                <button onClick={() => setTime((t) => Math.max(0, t - 60))}>
                    -1
                </button>
                <button onClick={() => setTime((t) => t + 60)}>
                    +1
                </button>
            </div>

            <div className="controls">
                <button onClick={start}>Start</button>
                <button onClick={() => setIsRunning(false)}>Pause</button>
            </div>

            <div className="stats">
                <div>Total: {Math.floor(totalTime / 60)} min</div>
                <div>Today: {Math.floor(todayTime / 60)} min</div>
            </div>
        </div>
    );
}