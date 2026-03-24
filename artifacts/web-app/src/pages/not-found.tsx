import { Link } from "wouter";
import { AlertOctagon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="brutalist-card p-12 text-center border-8 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full">
        <AlertOctagon className="w-32 h-32 mx-auto mb-8 text-destructive" strokeWidth={1.5} />
        <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">404 ERROR</h1>
        <div className="h-2 w-24 bg-black mx-auto mb-8"></div>
        <p className="text-xl font-bold uppercase mb-12 text-gray-600">
          The requested trajectory leads to an unmapped sector of the vault.
        </p>
        <Link 
          href="/" 
          className="inline-block px-8 py-4 brutalist-button bg-primary hover:bg-black text-black hover:text-white text-xl"
        >
          RETURN TO SAFE ZONE
        </Link>
      </div>
    </div>
  );
}
