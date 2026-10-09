import { useEffect, useRef, useState } from 'react';

export default function Reveal({ children, delay = 0, className = '' }) {
    const ref = useRef(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const node = ref.current;

        // Without an observer the content must not stay hidden.
        if (!node || typeof IntersectionObserver === 'undefined') {
            setShown(true);

            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShown(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, []);

    // The hidden state is motion-safe only, so a visitor who prefers reduced
    // motion gets the content immediately instead of an invisible page.
    const state = shown ? 'opacity-100 translate-y-0' : 'motion-safe:translate-y-5 motion-safe:opacity-0';

    return (
        <div
            ref={ref}
            style={shown && delay ? { transitionDelay: `${delay}ms` } : undefined}
            className={`motion-safe:transition motion-safe:duration-700 motion-safe:ease-out ${state} ${className}`}
        >
            {children}
        </div>
    );
}
