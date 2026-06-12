"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/app/(app)/actions";

interface ActionFormProps {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  className?: string;
  children: React.ReactNode;
}

/**
 * Wrapper cliente para formularios con server actions.
 * Muestra un toast de éxito/error según el resultado de la action.
 */
export function ActionForm({ action, className = "", children }: ActionFormProps) {
  const { show } = useToast();
  const [state, formAction] = useActionState(action, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      show("success", state.message);
    } else {
      show("error", state.error);
    }
  }, [state, show]);

  return (
    <form action={formAction} className={className}>
      {children}
    </form>
  );
}
