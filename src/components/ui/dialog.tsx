"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Popovers do MUI (DatePicker etc.) vão para o body. Sem isso, o DismissableLayer trata como “fora” e pode fechar.
 * O FocusScope com trap também devolve o foco para o diálogo e o picker some — use trapFocus={false} nesses modais.
 */
function isMuiPortaledPickerLayer(node: EventTarget | null): boolean {
  if (!(node instanceof Element)) return false;
  return Boolean(
    node.closest(".MuiPickersPopper-root") ||
      node.closest(".MuiPopover-root") ||
      node.closest(".MuiPopper-root"),
  );
}

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]", className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  /** Quando false, não renderiza o botão absoluto no canto (útil se o fechar fica na própria faixa de título). */
  showCloseButton?: boolean;
};

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, showCloseButton = true, onPointerDownOutside, onInteractOutside, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      {...props}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl outline-none sm:w-full",
        className,
      )}
      onPointerDownOutside={(e) => {
        if (isMuiPortaledPickerLayer(e.target)) e.preventDefault();
        onPointerDownOutside?.(e);
      }}
      onInteractOutside={(e) => {
        if (isMuiPortaledPickerLayer(e.target)) e.preventDefault();
        onInteractOutside?.(e);
      }}
    >
      {children}
      {showCloseButton ? (
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground opacity-80 ring-offset-background transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      ) : null}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 pr-8 text-left", className)} {...props} />;
}

function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

export { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogTitle };
