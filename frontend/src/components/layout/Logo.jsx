import React from 'react';

export default function Logo({ className = "h-4 w-auto" }) {
    return (
        <div className="flex justify-center">
            <img
                src="/graphics/Swiish_Logo.svg"
                alt="Swiish"
                className={`${className} dark:hidden swiish-logo`}
            />
            <img
                src="/graphics/Swiish_Logo_DarkBg.svg"
                alt="Swiish"
                className={`${className} hidden dark:block swiish-logo`}
            />
        </div>
    );
}