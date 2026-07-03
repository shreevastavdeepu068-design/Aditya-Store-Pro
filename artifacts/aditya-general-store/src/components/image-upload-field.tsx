import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";

interface ImageUploadFieldProps {
  value: string;
  onChange: (dataUri: string) => void;
  label?: string;
}

export function ImageUploadField({ value, onChange, label = "Product Photo" }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [converting, setConverting] = useState(false);

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, WEBP, etc.)");
      return;
    }

    setConverting(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
      setConverting(false);
    };
    reader.onerror = () => {
      setConverting(false);
      alert("Could not read that image. Please try a different file.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-3">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex-1 border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            {converting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Processing image...
              </>
            ) : (
              <>
                <ImagePlus size={14} className="text-primary" />
                <span>
                  <span className="text-primary font-semibold">Tap to upload</span> or drag a photo here
                </span>
              </>
            )}
          </div>
        </div>
        <div className="w-14 h-14 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
          {value ? (
            <img src={value} alt="Preview" className="w-full h-full object-contain" />
          ) : (
            <span className="text-lg">🖼️</span>
          )}
        </div>
      </div>
    </div>
  );
}
