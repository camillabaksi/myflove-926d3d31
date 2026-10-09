import * as React from "react";
import { Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectTrigger, SelectContent } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DialogContent } from "@/components/ui/dialog";
import { MyFloveBlock, type MyFloveBlockProps } from "@/components/myflove/block";

/** Existing pilot presentation, deliberately unchanged. No state or persistence. */
export const paceFormSurface = "pace-form pace-form-surface";

export function PacePage({ className, children, ...props }: React.ComponentProps<"div">) {
  return <div {...props} data-pace-design="true" className={cn("pace-ds pace-ds-page", className)}>{children}</div>;
}

export function PaceHeading({ editorial = false, level = 1, className, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { editorial?: boolean; level?: 1 | 2 | 3 }) {
  const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
  return <Tag {...props} className={cn("pace-ds-heading", `pace-ds-heading-${level}`, editorial && "pace-editorial-role", className)} />;
}

/** Page orientation only; sibling forms retain their presentation. */
export function PacePageTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <PaceHeading {...props} editorial level={1} className={cn("pace-page-title", className)} />;
}

export function PaceSection({ title, children, className, ...props }: Omit<React.ComponentProps<"section">, "title"> & { title: string }) {
  const id = React.useId();
  return <section {...props} aria-labelledby={id} className={cn("pace-ds-section", className)}><PaceHeading level={2} id={id}>{title}</PaceHeading>{children}</section>;
}

export function PaceCard({ className, ...props }: React.ComponentProps<"div">) {
  return <div {...props} className={cn("pace-ds-card", className)} />;
}

/** Retains the original component, collapse key and stored collapse behavior. */
export function PaceBlock({ className, ...props }: MyFloveBlockProps) {
  return <MyFloveBlock {...props} surface="plain" className={cn(paceFormSurface, className)} />;
}

export const PaceButton = React.forwardRef<HTMLButtonElement, ButtonProps>(function PaceButton({ className, ...props }, ref) {
  return <Button {...props} ref={ref} className={cn("pace-ds-button", className)} />;
});

export const PaceInput = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(function PaceInput({ className, ...props }, ref) {
  return <Input {...props} ref={ref} className={cn("pace-ds-control", className)} />;
});
export const PaceTextarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<typeof Textarea>>(function PaceTextarea({ className, ...props }, ref) {
  return <Textarea {...props} ref={ref} className={cn("pace-ds-control pace-ds-textarea", className)} />;
});
export const PaceSelectTrigger = React.forwardRef<React.ElementRef<typeof SelectTrigger>, React.ComponentPropsWithoutRef<typeof SelectTrigger>>(function PaceSelectTrigger({ className, ...props }, ref) {
  return <SelectTrigger {...props} ref={ref} className={cn("pace-ds-control pace-ds-select", className)} />;
});
export const PaceSelectContent = React.forwardRef<React.ElementRef<typeof SelectContent>, React.ComponentPropsWithoutRef<typeof SelectContent>>(function PaceSelectContent({ className, ...props }, ref) {
  return <SelectContent {...props} ref={ref} data-pace-design="true" className={cn("pace-ds pace-ds-select-content", className)} />;
});

type FieldChildProps = { id?: string; "aria-describedby"?: string; "aria-invalid"?: React.AriaAttributes["aria-invalid"]; required?: boolean };
export function PaceField({ label, help, error, required, children }: { label: string; help?: string; error?: string; required?: boolean; children: React.ReactElement<FieldChildProps> }) {
  const generated = React.useId();
  const id = children.props.id ?? generated;
  const describedBy = [children.props["aria-describedby"], help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return <div className="pace-ds-field">
    <label htmlFor={id}>{label}{required && <span> (obligatoriskt)</span>}</label>
    {React.cloneElement(children, { id, "aria-describedby": describedBy, "aria-invalid": error ? true : children.props["aria-invalid"], required: required ?? children.props.required })}
    {help && <p id={`${id}-help`} className="pace-ds-help">{help}</p>}
    {error && <p id={`${id}-error`} className="pace-ds-error" role="alert">{error}</p>}
  </div>;
}

export function PaceChoiceGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <fieldset className="pace-ds-field"><legend>{label}</legend><div className="pace-ds-choices">{children}</div></fieldset>;
}
export function PaceChoice({ selected, className, ...props }: Omit<ButtonProps, "aria-pressed"> & { selected: boolean }) {
  return <PaceButton {...props} variant="outline" aria-pressed={selected} className={cn("pace-ds-choice", className)} />;
}
export function PaceActions({ className, ...props }: React.ComponentProps<"div">) {
  return <div {...props} className={cn("pace-ds-actions", className)} />;
}
export function PaceHelp({ children, ...props }: ButtonProps) {
  return <PaceButton {...props} variant="link" className={cn("pace-ds-inline-help", props.className)}><Info aria-hidden="true" />{children}</PaceButton>;
}
export function PaceSwitch({ label, help, ...props }: React.ComponentPropsWithoutRef<typeof Switch> & { label: string; help?: string }) {
  const generated = React.useId();
  const id = props.id ?? generated;
  return <div className="pace-ds-switch-row"><label htmlFor={id}>{label}{help && <span id={`${id}-help`} className="pace-ds-help">{help}</span>}</label><Switch {...props} id={id} aria-describedby={[props["aria-describedby"], help && `${id}-help`].filter(Boolean).join(" ") || undefined} className={cn("pace-ds-switch", props.className)} /></div>;
}
export const PaceDialogContent = React.forwardRef<React.ElementRef<typeof DialogContent>, React.ComponentPropsWithoutRef<typeof DialogContent>>(function PaceDialogContent({ className, ...props }, ref) {
  return <DialogContent {...props} ref={ref} data-pace-design="true" className={cn("pace-ds pace-ds-dialog", className)} />;
});
export function PaceStatus({ state, children }: { state: "empty" | "loading" | "saving" | "saved" | "error"; children: React.ReactNode }) {
  const busy = state === "loading" || state === "saving";
  return <div className={cn("pace-ds-status", state === "error" && "pace-ds-error")} role={state === "error" ? "alert" : "status"} aria-live={state === "error" ? "assertive" : "polite"} aria-atomic="true">
    {busy && <Loader2 aria-hidden="true" className="pace-ds-spinner" />}<span>{children}</span>
  </div>;
}