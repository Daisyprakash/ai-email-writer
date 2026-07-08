"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  EMAIL_LENGTHS,
  EMAIL_TONES,
  type EmailFormData,
} from "@/types/email";
import { Loader2, Sparkles } from "lucide-react";

interface EmailFormProps {
  formData: EmailFormData;
  isLoading: boolean;
  onChange: (data: EmailFormData) => void;
  onSubmit: () => void;
}

export function EmailForm({
  formData,
  isLoading,
  onChange,
  onSubmit,
}: EmailFormProps) {
  const updateField = <K extends keyof EmailFormData>(
    key: K,
    value: EmailFormData[K]
  ) => {
    onChange({ ...formData, [key]: value });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoading) {
      onSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-in fade-in slide-in-from-bottom-4 space-y-5 duration-500 fill-mode-both"
    >
      <div className="space-y-2">
        <Label htmlFor="prompt">
          Describe your email <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="prompt"
          placeholder='Example: "I want to request leave tomorrow because I have fever."'
          value={formData.prompt}
          onChange={(event) => updateField("prompt", event.target.value)}
          rows={5}
          disabled={isLoading}
          required
          className="min-h-32 resize-y"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tone">Email tone</Label>
          <Select
            value={formData.tone}
            onValueChange={(value) => {
              if (value) updateField("tone", value as EmailFormData["tone"]);
            }}
            disabled={isLoading}
          >
            <SelectTrigger id="tone" className="w-full">
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              {EMAIL_TONES.map((tone) => (
                <SelectItem key={tone} value={tone}>
                  {tone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="length">Email length</Label>
          <Select
            value={formData.length}
            onValueChange={(value) => {
              if (value) updateField("length", value as EmailFormData["length"]);
            }}
            disabled={isLoading}
          >
            <SelectTrigger id="length" className="w-full">
              <SelectValue placeholder="Select length" />
            </SelectTrigger>
            <SelectContent>
              {EMAIL_LENGTHS.map((length) => (
                <SelectItem key={length} value={length}>
                  {length}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalInstructions">
          Additional instructions{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="additionalInstructions"
          placeholder='Example: "Mention tomorrow&apos;s meeting. Keep it polite."'
          value={formData.additionalInstructions}
          onChange={(event) =>
            updateField("additionalInstructions", event.target.value)
          }
          rows={3}
          disabled={isLoading}
          className="resize-y"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isLoading}
        className="h-11 w-full gap-2 text-base"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="size-4" aria-hidden="true" />
            Generate Email
          </>
        )}
      </Button>
    </form>
  );
}
