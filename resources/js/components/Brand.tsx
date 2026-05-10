import { usePage } from '@inertiajs/react';

type myLogo = {
    logo: string;
};

interface BrandProps {
    className?: string;
}

export function Brand({ className = '' }: BrandProps) {
    const { logo } = usePage().props as myLogo;

    return <img src={'/storage/' + logo} alt="Hyperion team logo" className={className} />;
}
