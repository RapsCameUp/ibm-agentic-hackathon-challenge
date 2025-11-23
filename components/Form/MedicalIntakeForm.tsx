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
import { submitHealthForm } from '@/app/frontend/src/services/form.api';
import { useRouter } from 'next/navigation';

export default function MedicalIntakeForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      age: '',
      weight: '',
      height: '',
      gender: 'prefer-not-to-say',
      symptoms: '',
      medicalHistory: '',
      dietaryPreferences: '',
      activityLevel: 'moderate',
      goals: '',
      consent: false,
    },
  });

  const router = useRouter();
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    console.log('Submitted:', data);
    try {
      const response = await submitHealthForm({
        ...data,
        medicalHistory: data.medicalHistory || '',
        dietaryPreferences: data.dietaryPreferences || '',
      });
      if (response.success) {
        toast.success('Health analysis complete! Redirecting to chat...');

        // Store analysis results and thread_id for the chat page
        localStorage.setItem('chat_thread_id', response.thread_id);

        if (response.analysis) {
          // Check if analysis is an object (already parsed JSON) or string
          const analysisToStore =
            typeof response.analysis === 'object'
              ? JSON.stringify(response.analysis)
              : response.analysis;

          localStorage.setItem('health_analysis', analysisToStore);
        }

        router.push('/chat');
      } else {
        toast.error('Failed to analyze health data. Please try again.');
      }
    } catch (error) {
      console.error('Error', error);
      toast.error('An error occurred. Please try again.');
    }
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
