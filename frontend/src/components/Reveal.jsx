import { useEffect, useRef, useState } from 'react';

function Reveal({ children, className = '', as: Component = 'div', delay = 0, style, ...rest }) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.2 }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    const combinedClassName = ['reveal', isVisible ? 'reveal--visible' : '', className]
        .filter(Boolean)
        .join(' ');

    const combinedStyle = { transitionDelay: `${delay}ms`, ...style };

    return (
        <Component ref={ref} className={combinedClassName} style={combinedStyle} {...rest}>
            {children}
        </Component>
    );
}

export default Reveal;
