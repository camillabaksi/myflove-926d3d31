import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-dvh w-full flex items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
            <h1 className="text-2xl font-bold">404 – Sidan finns inte</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Länken kan vara felstavad eller så har sidan flyttats.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
