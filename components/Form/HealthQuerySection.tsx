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
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="weight">Weight (kg) *</FieldLabel>
            <input
              id="weight"
              type="number"
              className="w-full rounded-md border border-gray-300 p-2"
              placeholder="70"
              {...register('weight')}
            />
            {errors.weight && <p className="text-sm text-red-500">{errors.weight.message}</p>}
          </Field>
          <Field>
            <FieldLabel htmlFor="height">Height (cm) *</FieldLabel>
            <input
              id="height"
              type="number"
              className="w-full rounded-md border border-gray-300 p-2"
              placeholder="170"
              {...register('height')}
            />
            {errors.height && <p className="text-sm text-red-500">{errors.height.message}</p>}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="activityLevel">Activity Level</FieldLabel>
          <select
            id="activityLevel"
            className="w-full rounded-md border border-gray-300 p-2"
            {...register('activityLevel')}
          >
            <option value="sedentary">Sedentary</option>
            <option value="light">Lightly Active</option>
            <option value="moderate">Moderately Active</option>
            <option value="active">Active</option>
            <option value="very_active">Very Active</option>
          </select>
        </Field>

        <Field>
          <FieldLabel htmlFor="symptoms">Symptoms / Description *</FieldLabel>
          <Textarea
            id="symptoms"
            rows={3}
            placeholder="Describe symptoms..."
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
            rows={2}
            placeholder="Conditions..."
            className="resize-none"
            {...register('medicalHistory')}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="dietaryPreferences">Dietary Preferences</FieldLabel>
          <input
            id="dietaryPreferences"
            className="w-full rounded-md border border-gray-300 p-2"
            placeholder="e.g. Low sodium, Vegetarian"
            {...register('dietaryPreferences')}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="goals">Health Goals *</FieldLabel>
          <input
            id="goals"
            className="w-full rounded-md border border-gray-300 p-2"
            placeholder="e.g. Weight loss, Improve cardio"
            {...register('goals')}
          />
          {errors.goals && <p className="text-sm text-red-500">{errors.goals.message}</p>}
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
