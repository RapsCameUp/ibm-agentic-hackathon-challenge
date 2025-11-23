// components/form/ConsentSection.tsx
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel, FieldSet } from '@/components/ui/field';
import type { UseFormReturn } from 'react-hook-form';
import type { FormData } from '../../lib/formSchema/schema';

interface Props {
  form: UseFormReturn<FormData>;
}
export default function ConsentSection({ form }: Props) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <FieldSet>
      <Field orientation="horizontal" className="items-start gap-3">
        <Checkbox id="consent" {...register('consent')} />
        <FieldLabel htmlFor="consent" className="cursor-pointer leading-tight font-normal">
          I consent to AI processing of my health data according to the{' '}
          <a href="/privacy" className="text-emerald-600 underline hover:text-emerald-700">
            Privacy Policy
          </a>
          . *
        </FieldLabel>
      </Field>
      {errors.consent && (
        <p className="mt-2 w-full text-sm text-red-500">{errors.consent.message}</p>
      )}
    </FieldSet>
  );
}
