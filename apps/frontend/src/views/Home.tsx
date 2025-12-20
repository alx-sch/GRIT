import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <section className="p-8">
      <h1 className="text-2xl font-bold mb-4">Home</h1>
      <p className="text-gray-700 mb-6">
        Welcome to your new single-page application. This is the home page.
      </p>

      <Button onClick={() => alert('You clicked the shadcn button!')}>Shadcn Button</Button>
    </section>
  );
}
