import { Card, CardContent } from '@/components/ui/card';
import { usePage } from '@inertiajs/react';

export default function CardAbout() {
    const { vision, mission, values } = usePage().props;

    return (
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="h-auto rounded-2xl border-none bg-[#2E2E2E] text-white shadow-lg transition-shadow hover:shadow-xl">
                <CardContent className="p-6">
                    <h3 className="mb-4 text-xl font-bold text-[#DEB304]">Our Vision</h3>
                    <p className="text-justify text-gray-200">{vision}</p>
                </CardContent>
            </Card>
            <Card className="h-auto rounded-2xl border-none bg-[#2E2E2E] text-white shadow-lg transition-shadow hover:shadow-xl">
                <CardContent className="p-6">
                    <h3 className="mb-4 text-xl font-bold text-[#DEB304]">Our Mission</h3>
                    <p className="text-justify text-gray-200">{mission}</p>
                </CardContent>
            </Card>
            <Card className="h-auto rounded-2xl border-none bg-[#2E2E2E] text-white shadow-lg transition-shadow hover:shadow-xl">
                <CardContent className="p-6">
                    <h3 className="mb-4 text-xl font-bold text-[#DEB304]">Our Values</h3>
                    <p className="text-justify text-gray-200">{values}</p>
                </CardContent>
            </Card>
        </div>
    );
}
