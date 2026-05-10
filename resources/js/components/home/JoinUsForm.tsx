'use client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import React from 'react';

export default function JoinUsForm() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        age: '',
        school: '',
    });

    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/join', {
            onSuccess: () => {
                toast({
                    description: 'Thank you for joining!',
                });
                reset();
            },
            onError: () => {
                toast({
                    description: 'Failed to submit. Please check the form.',
                });
            },
        });
    };
    return (
        <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">Join With Hyperion</h2>
            <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
                Unleash Young Potential Power. Focus of Develop Young Player
            </p>

            <form className="my-8" onSubmit={handleSubmit}>
                <LabelInputContainer className="mb-4">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                    {errors.name && <div className="text-sm text-red-500">{errors.name}</div>}
                </LabelInputContainer>
                <LabelInputContainer className="mb-4">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required type="email" />
                    {errors.email && <div className="text-sm text-red-500">{errors.email}</div>}
                </LabelInputContainer>

                <LabelInputContainer className="mb-4">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" value={data.age} onChange={(e) => setData('age', e.target.value)} required type="number" />
                    {errors.age && <div className="text-sm text-red-500">{errors.age}</div>}
                </LabelInputContainer>

                <LabelInputContainer className="mb-4">
                    <Label htmlFor="school">Which school are you from?</Label>
                    <Input id="school" value={data.school} onChange={(e) => setData('school', e.target.value)} required />
                    {errors.school && <div className="text-sm text-red-500">{errors.school}</div>}
                </LabelInputContainer>

                <button
                    className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                    type="submit"
                    disabled={processing}
                >
                    Submit &rarr;
                    <BottomGradient />
                </button>
            </form>
        </div>
    );
}

const BottomGradient = () => {
    return (
        <>
            <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
            <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
        </>
    );
};

const LabelInputContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return <div className={cn('flex w-full flex-col space-y-2', className)}>{children}</div>;
};
