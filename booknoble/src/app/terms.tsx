import { LegalPage } from '@/components/legal-page';
import { TERMS } from '@/content/legal';

export default function Terms() {
  return <LegalPage title="Terms of Service" sections={TERMS} />;
}
