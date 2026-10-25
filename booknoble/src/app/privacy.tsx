import { LegalPage } from '@/components/legal-page';
import { PRIVACY } from '@/content/legal';

export default function Privacy() {
  return <LegalPage title="Privacy Policy" sections={PRIVACY} />;
}
