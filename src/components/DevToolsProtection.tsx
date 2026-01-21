"use client";

import { useEffect } from "react";

export default function DevToolsProtection() {
    useEffect(() => {
        // Copyright notice in console
        const copyrightStyle = "color: #a855f7; font-size: 16px; font-weight: bold;";
        const warningStyle = "color: #ef4444; font-size: 14px; font-weight: bold;";
        const infoStyle = "color: #60a5fa; font-size: 12px;";

        console.clear();
        console.log("%c🚫 STOP!", "color: #ef4444; font-size: 40px; font-weight: bold;");
        console.log("%c⚠️ This is a browser feature intended for developers.", warningStyle);
        console.log("%c", "padding: 10px;");
        console.log("%c╔══════════════════════════════════════════════════════════════╗", copyrightStyle);
        console.log("%c║                    ⚠️ COPYRIGHT NOTICE ⚠️                     ║", copyrightStyle);
        console.log("%c╠══════════════════════════════════════════════════════════════╣", copyrightStyle);
        console.log("%c║  This website and all its contents are protected by          ║", copyrightStyle);
        console.log("%c║  copyright law. Unauthorized copying, modification,          ║", copyrightStyle);
        console.log("%c║  distribution, or use of any content, code, or resources     ║", copyrightStyle);
        console.log("%c║  from this website is strictly prohibited.                   ║", copyrightStyle);
        console.log("%c╠══════════════════════════════════════════════════════════════╣", copyrightStyle);
        console.log("%c║  👨‍💻 Developer: Rohit Gunthal                                 ║", copyrightStyle);
        console.log("%c║  📧 Contact: rohitgunthal1819@gmail.com                       ║", copyrightStyle);
        console.log("%c║  🌐 Website: Pixico - AI Prompt Library                       ║", copyrightStyle);
        console.log("%c╠══════════════════════════════════════════════════════════════╣", copyrightStyle);
        console.log("%c║  All code, designs, images, and intellectual property        ║", copyrightStyle);
        console.log("%c║  belong exclusively to Rohit Gunthal.                        ║", copyrightStyle);
        console.log("%c║                                                              ║", copyrightStyle);
        console.log("%c║  © 2024-2025 Pixico. All Rights Reserved.                    ║", copyrightStyle);
        console.log("%c╚══════════════════════════════════════════════════════════════╝", copyrightStyle);
        console.log("%c", "padding: 10px;");
        console.log("%cIf you're a developer interested in working together, please contact:", infoStyle);
        console.log("%crohitgunthal1819@gmail.com", "color: #22c55e; font-size: 14px; font-weight: bold;");

        // Disable right-click context menu
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };

        // Disable keyboard shortcuts for dev tools
        const handleKeyDown = (e: KeyboardEvent) => {
            // F12
            if (e.key === "F12") {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+I (Dev Tools)
            if (e.ctrlKey && e.shiftKey && e.key === "I") {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && e.key === "J") {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+C (Inspect Element)
            if (e.ctrlKey && e.shiftKey && e.key === "C") {
                e.preventDefault();
                return false;
            }
            // Ctrl+U (View Source)
            if (e.ctrlKey && e.key === "u") {
                e.preventDefault();
                return false;
            }
            // Ctrl+S (Save Page)
            if (e.ctrlKey && e.key === "s") {
                e.preventDefault();
                return false;
            }
        };

        // Add event listeners
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("keydown", handleKeyDown);

        // Cleanup on unmount
        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return null;
}
