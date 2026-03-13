"use client";

import React, { useState, useEffect } from "react";

export interface ReputationArcProps {
  value: number;
  max?: number;
  size?: number;
}

export function getReputationVisuals(value: number) {
  if (value < 10) {
    return {
      textClass: "text-red-500 dark:text-red-400",
      strokeColor: "#ef4444",
    };
  }
  if (value < 30) {
    return {
      textClass: "text-yellow-500 dark:text-yellow-400",
      strokeColor: "#eab308",
    };
  }
  if (value < 40) {
    return {
      textClass: "text-orange-500 dark:text-orange-400",
      strokeColor: "#f97316",
    };
  }
  if (value < 80) {
    return {
      textClass: "text-green-500 dark:text-green-400",
      strokeColor: "#22c55e",
    };
  }
  return {
    textClass: "text-fuchsia-500 dark:text-fuchsia-400",
    strokeColor: "#d946ef",
  };
}

export function ReputationArc({ value, max = 100, size = 120 }: ReputationArcProps) {
  const clamped = Math.max(0, Math.min(value, max));
  const [animatedValue, setAnimatedValue] = useState(0);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 0.6;
  const arcLength = circumference * arcFraction;
  const progress = animatedValue / max;
  const progressLength = arcLength * progress;
  const gapLength = circumference - arcLength;
  const rotationDegrees = -15.5;
  const { strokeColor } = getReputationVisuals(clamped);

  useEffect(() => {
    if (clamped === 0) {
      setAnimatedValue(0);
      return;
    }
    let frameId: number;
    const start = performance.now();
    const duration = 700;
    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedValue(clamped * eased);
      if (t < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };
    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [clamped]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient
          id="reputation-arc-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
      </defs>
      <g transform={`rotate(${rotationDegrees} ${center} ${center})`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 184, 0.25)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${gapLength}`}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progressLength} ${circumference - progressLength}`}
        />
      </g>
    </svg>
  );
}
