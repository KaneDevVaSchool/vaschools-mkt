import { useCallback, useEffect, useState } from "react";

let openId: string | null = null;
const listeners = new Set<() => void>();

function notify() {
    for (const fn of listeners) fn();
}

export function closeHeaderPopovers() {
    openId = null;
    notify();
}

export function useHeaderPopover(id: string) {
    const [, tick] = useState(0);

    useEffect(() => {
        const bump = () => tick((n) => n + 1);
        listeners.add(bump);
        return () => {
            listeners.delete(bump);
        };
    }, []);

    const isOpen = openId === id;

    const toggle = useCallback(() => {
        openId = openId === id ? null : id;
        notify();
    }, [id]);

    const close = useCallback(() => {
        if (openId === id) {
            openId = null;
            notify();
        }
    }, [id]);

    return { isOpen, toggle, close };
}
