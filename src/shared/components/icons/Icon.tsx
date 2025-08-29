// src/shared/components/icons/Icon.tsx
import React from 'react';

interface IconProps {
    name: string;
    width?: number;
    height?: number;
    color?: string;
}

const Icon: React.FC<IconProps> = ({ name, width = 24, height = 24, color }) => {
    console.warn(`Icon "${name}" not found`);
    return null;
};

export default Icon;
