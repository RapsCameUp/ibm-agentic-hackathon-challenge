// components/form/HealthQuerySection.tsx
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import type { UseFormReturn } from 'react-hook-form';
import type { FormData } from '../../lib/formSchema/schema';

interface Props {
  form: UseFormReturn<FormData>;
}
export default function HealthQuerySection({ form }: Props) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <FieldSet>
      <FieldLegend>Your Health Concern</FieldLegend>
      <FieldDescription>The AI will carefully analyze this information</FieldDescription>

      <FieldGroup className="mt-3 space-y-6">
        <Field>
          <FieldLabel htmlFor="symptoms">Symptoms / Description *</FieldLabel>
          <Textarea
            id="symptoms"
            rows={5}
            placeholder="Describe symptoms, duration, severity..."
            className="resize-none"
            {...register('symptoms')}
          />
          {errors.symptoms && (
            <p className="mt-1 text-sm text-red-500">{errors.symptoms.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="medicalHistory">Medical History (Optional)</FieldLabel>
          <Textarea
            id="medicalHistory"
            rows={3}
            placeholder="Medications, allergies, past conditions..."
            className="resize-none"
            {...register('medicalHistory')}
          />
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
