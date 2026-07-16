import React from "react";
import Link from "next/link";

interface EmptyStateProps {
    title: string;
    description: string;
    emoji?: string;
    actionLabel?: string;
    actionHref?: string;
    onActionClick?: () => void;
}

export function EmptyState({
    title,
    description,
    emoji = "🏝️",
    actionLabel,
    actionHref,
    onActionClick,
}: EmptyStateProps) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 24px",
                textAlign: "center",
                background: "linear-gradient(135deg, #f0f7ff, #f8faff)",
                borderRadius: 24,
                border: "1px dashed #bfdbfe",
                margin: "8px 0",
            }}
        >
            {/* Emoji bubble */}
            <div
                style={{
                    width: 80,
                    height: 80,
                    background: "linear-gradient(135deg, rgba(11,87,208,0.08), rgba(26,115,232,0.12))",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                    boxShadow: "0 4px 20px rgba(11,87,208,0.1)",
                }}
            >
                <div style={{ fontSize: 38 }}>{emoji}</div>
            </div>

            {/* Title */}
            <h3
                style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#0f172a",
                    marginBottom: 8,
                    fontFamily: "'Syne', sans-serif",
                    letterSpacing: "-0.2px",
                }}
            >
                {title}
            </h3>

            {/* Description */}
            <p
                style={{
                    color: "#64748b",
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: actionLabel ? 28 : 0,
                    maxWidth: 280,
                    lineHeight: 1.6,
                }}
            >
                {description}
            </p>

            {/* CTA */}
            {actionLabel && (actionHref || onActionClick) && (
                actionHref ? (
                    <Link
                        href={actionHref}
                        style={{
                            background: "linear-gradient(135deg, #0B57D0, #1A73E8)",
                            color: "#fff",
                            fontWeight: 700,
                            padding: "12px 28px",
                            borderRadius: 14,
                            textDecoration: "none",
                            fontSize: 14,
                            boxShadow: "0 4px 16px rgba(11,87,208,0.28)",
                            transition: "transform 0.15s, box-shadow 0.15s",
                        }}
                    >
                        {actionLabel}
                    </Link>
                ) : (
                    <button
                        onClick={onActionClick}
                        style={{
                            background: "linear-gradient(135deg, #0B57D0, #1A73E8)",
                            color: "#fff",
                            fontWeight: 700,
                            padding: "12px 28px",
                            borderRadius: 14,
                            fontSize: 14,
                            border: "none",
                            cursor: "pointer",
                            boxShadow: "0 4px 16px rgba(11,87,208,0.28)",
                        }}
                    >
                        {actionLabel}
                    </button>
                )
            )}
        </div>
    );
}
