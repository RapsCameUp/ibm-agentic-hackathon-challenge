'use client';

// components/form/PersonalInfoSection.tsx
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UseFormReturn } from 'react-hook-form';
import type { FormData } from '../../lib/formSchema/schema';

interface Props {
  form: UseFormReturn<FormData>;
}
export default function PersonalInfoSection({ form }: Props) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  return (
    <FieldSet>
      <FieldLegend className="text-xl font-semibold">Personal Information</FieldLegend>
      <FieldDescription>Please provide accurate details</FieldDescription>

      <FieldGroup className="mt-6 grid gap-6 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="fullName">Full Name *</FieldLabel>
          <Input id="fullName" placeholder="John Doe" {...register('fullName')} />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email *</FieldLabel>
          <Input id="email" type="email" placeholder="john@example.com" {...register('email')} />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
        </Field>

        <Field>
          <FieldLabel htmlFor="age">Age *</FieldLabel>
          <Input id="age" type="number" min={18} max={120} placeholder="18" {...register('age')} />
          {errors.age && <p className="mt-1 text-sm text-red-500">{errors.age.message}</p>}
        </Field>

        <Field>
          <FieldLabel htmlFor="gender">Gender *</FieldLabel>
          <Select onValueChange={(v) => setValue('gender', v as any)} value={watch('gender')}>
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="non-binary">Non-binary</SelectItem>
              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && <p className="mt-1 text-sm text-red-500">{errors.gender.message}</p>}
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
