import { deliveryPolicy } from "@/lib/data/home";

export function DeliveryPolicy() {
  return (
    <div className="mt-8 border-t border-ylw-border pt-6">
      <h2 className="mb-1 text-[16px] font-semibold">
        {deliveryPolicy.title}
      </h2>
      <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.05em]">
        {deliveryPolicy.subtitle}
      </p>
      {[...deliveryPolicy.en, ...deliveryPolicy.bn].map((paragraph, index) => (
        <p
          key={index}
          className="mb-2 text-[12px] leading-relaxed text-ylw-text-secondary"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
