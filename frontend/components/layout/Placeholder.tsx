import { Card, CardBody } from '../ui/Card';
import { copy } from '../../lib/copy';

/** Stand-in for a page whose real content arrives in a later phase. */
export function Placeholder({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <Card>
        <CardBody className="py-16 text-center text-muted-foreground">
          {copy.shell.comingSoon}
        </CardBody>
      </Card>
    </div>
  );
}
