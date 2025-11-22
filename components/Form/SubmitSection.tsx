// components/form/SubmitSection.tsx
import { Button } from '@/components/ui/button';

interface Props {
  isSubmitting: boolean;
}

export default function SubmitSection({ isSubmitting }: Props) {
  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      className="w-full cursor-pointer bg-emerald-600 py-6 text-lg font-semibold text-white hover:bg-emerald-700"
    >
      {isSubmitting ? 'Processing...' : 'Submit for AI Analysis'}
    </Button>
  );
}
