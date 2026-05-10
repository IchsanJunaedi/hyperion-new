import DivisionList from '@/components/divisions/DivisionList';
import DefaultLayout from '@/layouts/DefaultLayout';

export default function DivisionIndex() {
    return (
        <>
            <DefaultLayout
                title="Division"
                description="Explore our esports divisions and meet the teams representing Hyperion in various games."
                keywords="esports divisions, game rosters, mobile legends team, hyperion teams"
            >
                <section className="py-8 md:py-16">
                    <DivisionList />
                </section>
            </DefaultLayout>
        </>
    );
}
