'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler, type UseFormReturn } from 'react-hook-form';
import PersonalInfoSection from './PersonalInfoSection';
import HealthQuerySection from './HealthQuerySection';
import ConsentSection from './ConsentSection';
import SubmitSection from './SubmitSection';
import { toast } from 'sonner';
import { formSchema, type FormData } from '@/lib/formSchema/schema';
import { Stethoscope } from 'lucide-react';

export default function MedicalIntakeForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      age: '',
      gender: 'prefer-not-to-say',
      symptoms: '',
      medicalHistory: '',
      consent: false,
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log('Submitted:', data);
    toast.success(
      "Thank you! Your AI health analysis is being prepared. You'll receive results shortly.",
    );
    return new Promise<void>((resolve) => setTimeout(resolve, 1500));
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-teal-50 to-emerald-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Stethoscope />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Medical AI Agent Intake Form
            </CardTitle>
            <CardDescription className="mt-2 text-lg text-gray-600">
              Your health data is encrypted and processed with strict privacy
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              <PersonalInfoSection form={form} />
              <HealthQuerySection form={form} />
              <ConsentSection form={form} />
              <SubmitSection isSubmitting={isSubmitting} />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
