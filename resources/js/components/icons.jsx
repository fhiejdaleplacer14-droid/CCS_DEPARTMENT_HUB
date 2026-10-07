const Svg = ({ children, className = 'h-5 w-5' }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {children}
    </svg>
);

export const IconDashboard = (p) => (
    <Svg {...p}>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
    </Svg>
);

export const IconBook = (p) => (
    <Svg {...p}>
        <path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5z" />
        <path d="M4 5.5v15" />
    </Svg>
);

export const IconUpload = (p) => (
    <Svg {...p}>
        <path d="M12 16V4" />
        <path d="M7 9l5-5 5 5" />
        <path d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" />
    </Svg>
);

export const IconChat = (p) => (
    <Svg {...p}>
        <path d="M20 14a2 2 0 01-2 2H8l-4 4V6a2 2 0 012-2h12a2 2 0 012 2z" />
    </Svg>
);

export const IconMegaphone = (p) => (
    <Svg {...p}>
        <path d="M4 10v4a1 1 0 001 1h2l5 4V5L7 9H5a1 1 0 00-1 1z" />
        <path d="M16 9a3.5 3.5 0 010 6" />
        <path d="M19 6.5a7 7 0 010 11" />
    </Svg>
);

export const IconUser = (p) => (
    <Svg {...p}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0114 0" />
    </Svg>
);

export const IconUsers = (p) => (
    <Svg {...p}>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3 20a6 6 0 0112 0" />
        <path d="M16 5.2a3.2 3.2 0 010 5.6" />
        <path d="M18 14.5a6 6 0 013 5.5" />
    </Svg>
);

export const IconFlag = (p) => (
    <Svg {...p}>
        <path d="M5 21V4" />
        <path d="M5 4h11l-1.5 4L16 12H5" />
    </Svg>
);

export const IconSparkle = (p) => (
    <Svg {...p}>
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
        <path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </Svg>
);

export const IconSearch = (p) => (
    <Svg {...p}>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5L21 21" />
    </Svg>
);

export const IconDownload = (p) => (
    <Svg {...p}>
        <path d="M12 4v12" />
        <path d="M7 11l5 5 5-5" />
        <path d="M4 20h16" />
    </Svg>
);

export const IconDocument = (p) => (
    <Svg {...p}>
        <path d="M14 3H7a1 1 0 00-1 1v16a1 1 0 001 1h10a1 1 0 001-1V7z" />
        <path d="M14 3v4h4" />
    </Svg>
);

export const IconMenu = (p) => (
    <Svg {...p}>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
    </Svg>
);

export const IconClose = (p) => (
    <Svg {...p}>
        <path d="M6 6l12 12" />
        <path d="M18 6L6 18" />
    </Svg>
);

export const IconArrowLeft = (p) => (
    <Svg {...p}>
        <path d="M19 12H5" />
        <path d="M11 18l-6-6 6-6" />
    </Svg>
);

export const IconLogout = (p) => (
    <Svg {...p}>
        <path d="M10 20H6a1 1 0 01-1-1V5a1 1 0 011-1h4" />
        <path d="M15 8l4 4-4 4" />
        <path d="M19 12H9" />
    </Svg>
);

export const IconShield = (p) => (
    <Svg {...p}>
        <path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" />
        <path d="M9.5 12l1.8 1.8L15 10" />
    </Svg>
);
