"use client";

import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function GoogleAuthButton({
  label,
  loadingLabel,
  isLoading = false,
  onClick,
}: {
  label: string;
  loadingLabel: string;
  isLoading?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="w-full justify-center border-white/10 bg-white/[0.03] text-white hover:border-white/20 hover:bg-white/[0.06]"
      disabled={isLoading}
      onClick={onClick}
    >
      {isLoading ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path
            d="M21.805 10.023h-9.72v3.955h5.563c-.24 1.27-.958 2.345-2.042 3.062v2.542h3.31c1.939-1.785 3.056-4.417 2.889-7.321-.001-.744-.086-1.49-.25-2.238Z"
            fill="#4285F4"
          />
          <path
            d="M12.085 22c2.776 0 5.107-.916 6.81-2.478l-3.31-2.542c-.92.617-2.094.98-3.5.98-2.688 0-4.965-1.815-5.78-4.257H2.89v2.622A10.284 10.284 0 0 0 12.085 22Z"
            fill="#34A853"
          />
          <path
            d="M6.305 13.703a6.143 6.143 0 0 1-.323-1.95c0-.676.117-1.334.323-1.95V7.181H2.89A10.25 10.25 0 0 0 1.8 11.753c0 1.64.392 3.189 1.09 4.572l3.415-2.622Z"
            fill="#FBBC04"
          />
          <path
            d="M12.085 5.544c1.51 0 2.866.52 3.932 1.54l2.948-2.948C17.188 2.483 14.857 1.5 12.085 1.5A10.284 10.284 0 0 0 2.89 7.181l3.415 2.622c.815-2.442 3.092-4.259 5.78-4.259Z"
            fill="#EA4335"
          />
        </svg>
      )}
      <span>{isLoading ? loadingLabel : label}</span>
    </Button>
  );
}
