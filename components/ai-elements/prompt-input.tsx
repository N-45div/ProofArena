"use client";

import { SendIcon, SquareIcon } from "lucide-react";
import {
  createContext,
  type FormEvent,
  type TextareaHTMLAttributes,
  useContext,
  useId,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PromptInputMessage {
  text: string;
}

type PromptInputContextValue = {
  disabled?: boolean;
  inputId: string;
  setText: (value: string) => void;
  text: string;
};

type PromptInputProps = Omit<React.HTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  disabled?: boolean;
  onSubmit: (message: PromptInputMessage) => void | Promise<void>;
};

type PromptInputSubmitProps = React.ComponentProps<typeof Button> & {
  onStop?: () => void;
  status?: "ready" | "submitted" | "streaming" | "error";
};

const PromptInputContext = createContext<PromptInputContextValue | null>(null);

function usePromptInput() {
  const context = useContext(PromptInputContext);
  if (!context) {
    throw new Error("Prompt input components must be rendered inside PromptInput.");
  }
  return context;
}

export function PromptInput({
  children,
  className,
  disabled,
  onSubmit,
  ...props
}: PromptInputProps) {
  const inputId = useId();
  const [text, setText] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    await onSubmit({ text: trimmed });
    setText("");
  };

  return (
    <PromptInputContext.Provider value={{ disabled, inputId, setText, text }}>
      <form
        className={cn(
          "flex min-h-14 items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm",
          className,
        )}
        onSubmit={handleSubmit}
        {...props}
      >
        {children}
      </form>
    </PromptInputContext.Provider>
  );
}

export function PromptInputTextarea({
  className,
  onChange,
  onKeyDown,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { disabled, inputId, setText, text } = usePromptInput();

  return (
    <textarea
      className={cn(
        "max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground",
        className,
      )}
      disabled={disabled}
      id={inputId}
      onChange={(event) => {
        setText(event.target.value);
        onChange?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          event.currentTarget.form?.requestSubmit();
        }
        onKeyDown?.(event);
      }}
      rows={1}
      value={text}
      {...props}
    />
  );
}

export function PromptInputSubmit({
  className,
  onStop,
  status,
  ...props
}: PromptInputSubmitProps) {
  const { disabled, text } = usePromptInput();
  const isBusy = status === "submitted" || status === "streaming";

  if (isBusy) {
    return (
      <Button
        aria-label="Stop response"
        className={cn("size-10 shrink-0 rounded-full", className)}
        onClick={onStop}
        size="icon"
        type="button"
        variant="secondary"
        {...props}
      >
        <SquareIcon className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      aria-label="Send message"
      className={cn("size-10 shrink-0 rounded-full", className)}
      disabled={disabled || !text.trim()}
      size="icon"
      type="submit"
      {...props}
    >
      <SendIcon className="size-4" />
    </Button>
  );
}
