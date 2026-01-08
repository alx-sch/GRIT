import { Container } from '@/components/layout/Container';
import { Heading } from '@/components/ui/typography';

export default function Home() {
  return (
    <Container className="py-10 space-y-12">
      <Heading level={1}>Hi there</Heading>
    </Container>
  );
}
