"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="text-center max-w-sm">
        <h1 className="text-6xl font-extrabold tracking-tighter mb-2">404</h1>
        <p className="text-muted-foreground text-[15px] mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild className="h-11 px-8">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
