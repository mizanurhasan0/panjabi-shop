import Image from "next/image";
import Link from "next/link";

interface ProductOptionsProps {
  colors: string[];
  image: string;
  selectedColor: string;
  onColorChange: (color: string) => void;
  sizes: string[];
  availableSizes: Set<string>;
  selectedSize: string;
  onSizeChange: (size: string) => void;
}

export function ProductOptions({
  colors,
  image,
  selectedColor,
  onColorChange,
  sizes,
  availableSizes,
  selectedSize,
  onSizeChange,
}: ProductOptionsProps) {
  return (
    <>
      {colors.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-[12px]">
            Color – <span className="font-medium">{selectedColor}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onColorChange(color)}
                className={`swatch ${selectedColor === color ? "active" : ""}`}
                title={color}
              >
                <Image
                  src={image}
                  alt={color}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
      {sizes.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-[12px] font-medium">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const available = availableSizes.has(size);
              return (
                <button
                  key={size}
                  type="button"
                  disabled={!available}
                  onClick={() => onSizeChange(size)}
                  className={`size-option ${
                    selectedSize === size ? "active" : ""
                  } ${!available ? "sold-out" : ""}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
          <Link href="#" className="mt-2 inline-block text-[12px] underline">
            Size Guide
          </Link>
        </div>
      )}
    </>
  );
}
