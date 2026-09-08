// Shared Tailwind recipes keep controls and responsive layouts consistent.
// All utility names are static so Tailwind can generate only the styles we use.
const button =
  "inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border px-[17px] py-2.5 text-center text-[11px] font-medium leading-normal whitespace-nowrap transition-[background-color,border-color,box-shadow,translate] duration-160 hover:-translate-y-px active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none max-[641px]:min-h-11 max-[641px]:px-3.5 max-[641px]:py-[11px] motion-reduce:translate-none motion-reduce:transition-none";
const input =
  "block w-full min-w-0 rounded-lg border border-[#dfe1e7] bg-white px-[13px] py-[11px] text-[12px] font-normal leading-[1.55] text-[#353840] transition-[border-color,box-shadow] duration-160 placeholder:text-[#aaaeb7] focus:border-[#caa260] focus:outline-none focus:shadow-[0_0_0_3px_#ffbb491a] disabled:bg-[#f8f9fb] disabled:text-[#9598a0] max-[641px]:px-3 max-[641px]:py-2.5 max-[641px]:text-base motion-reduce:transition-none";
const grid = "grid min-w-0 gap-5 max-[641px]:gap-4";
const modal =
  "fixed max-w-screen overflow-auto overscroll-contain border border-admin-line bg-white p-0 text-admin-ink shadow-[0_20px_70px_#10131e26] opacity-0 translate-y-3 transition-[opacity,translate] duration-180 ease-out open:animate-none data-[state=open]:translate-y-0 data-[state=open]:opacity-100 backdrop:bg-[#15192266] backdrop:opacity-0 backdrop:transition-opacity backdrop:duration-180 data-[state=open]:backdrop:opacity-100 motion-reduce:transition-none motion-reduce:backdrop:transition-none";

export const adminStyles = {
  root: "min-h-dvh bg-admin-bg text-[13px] leading-[1.6] text-admin-ink max-[641px]:text-[12px] print:bg-white [&_button:disabled]:cursor-not-allowed [&_input[type=checkbox]]:size-4 [&_input[type=checkbox]]:accent-[#28292b] [&_:focus-visible]:outline-[3px]! [&_:focus-visible]:outline-[#c78b25]! [&_:focus-visible]:outline-offset-[3px] motion-reduce:[&_*]:animate-none! motion-reduce:[&_*]:transition-none! motion-reduce:[&_*]:scroll-auto!",
  stack: "grid gap-4",
  listPage: "flex min-h-0 flex-1 flex-col gap-3 [&>p]:shrink-0",
  listCard: "flex min-h-0 flex-1 flex-col [&>form]:shrink-0",
  grid3: `${grid} grid-cols-3 max-[641px]:grid-cols-1`,
  grid4:
    "grid min-w-0 grid-cols-4 gap-5 max-[1201px]:grid-cols-2 max-[641px]:gap-3",
  actions: "flex flex-wrap items-center gap-2.5",
  buttonPrimary: `${button} border-[#28292b] bg-[#28292b] text-white shadow-[0_2px_3px_#23232309] hover:bg-[#414245]`,
  buttonSecondary: `${button} border-[#dedfe5] bg-white text-[#4b4e56] hover:border-[#bfc2ca] hover:bg-admin-bg`,
  buttonDanger: `${button} border-[#bc4141] bg-[#bc4141] text-white hover:bg-[#a83737]`,
  textButton:
    "border-0 bg-transparent px-0 py-1 text-[11px] font-medium text-[#896326] underline underline-offset-[3px] disabled:cursor-not-allowed disabled:opacity-45",
  iconButton:
    "inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-transparent p-0 text-[#70737b] transition-colors duration-160 hover:bg-[#f1f2f5] hover:text-admin-ink disabled:opacity-50 motion-reduce:transition-none",
  card: "min-w-0 rounded-[14px] border border-admin-line bg-admin-surface p-6 shadow-[0_2px_3px_#1f293702] max-[641px]:rounded-xl max-[641px]:p-[18px] [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:tracking-[-0.3px] [&_h3]:text-[13px] [&_h3]:font-semibold",
  cardHeader:
    "flex items-center justify-between gap-3.5 pb-5 max-[641px]:flex-wrap max-[641px]:gap-3 max-[641px]:pb-[18px] [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:tracking-[-0.3px] [&_p]:mt-1 [&_p]:text-[11px] [&_p]:text-admin-muted",
  formGrid:
    "grid grid-cols-2 gap-5 max-[641px]:grid-cols-1 max-[641px]:gap-[18px]",
  formFull: "col-span-full",
  field:
    "min-w-0 [&>label]:grid [&>label]:gap-2 [&>label]:text-[11px] [&>label]:font-medium [&>label]:text-[#555860]",
  fieldHint: "mt-1.5! text-[10px] leading-[1.65] text-[#858893]",
  input: `${input} min-h-11`,
  select: `${input} min-h-11 pr-[30px]`,
  textarea: `${input} min-h-[110px] resize-y`,
  tableWrap:
    "min-h-0 max-w-full overflow-auto overscroll-contain rounded-[10px] border border-admin-line bg-white [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:#c8cbd2_transparent] scroll-pt-11 focus-visible:outline-offset-[-3px]! max-[641px]:rounded-none max-[641px]:border-0 max-[641px]:scroll-pt-2",
  table: [
    "w-full border-separate border-spacing-0 text-left text-[11px] [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 print:[&_thead_th]:static",
    "[&_th]:border-b [&_th]:border-admin-line [&_th]:bg-[#fafbfc] [&_th]:px-4 [&_th]:py-[13px] [&_th]:text-[9px] [&_th]:font-medium [&_th]:tracking-[0.6px] [&_th]:whitespace-nowrap [&_th]:text-[#9396a0] [&_th]:uppercase",
    "[&_td]:border-b [&_td]:border-[#f0f1f4] [&_td]:p-4 [&_td]:align-middle [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-140 [&_tbody_tr:hover]:bg-[#fdfcfa]",
    "[&_td_a]:font-medium [&_td_a:not(.inline-flex):hover]:text-[#9b6c24] [&_td_small]:mt-[3px] [&_td_small]:block [&_td_small]:text-[10px] [&_td_small]:text-admin-muted",
    "[&_button]:min-h-[34px] [&_button]:px-[11px] [&_button]:py-[7px] [&_button]:text-[10px] [&_a.inline-flex]:min-h-[34px] [&_a.inline-flex]:px-[11px] [&_a.inline-flex]:py-[7px] [&_a.inline-flex]:text-[10px]",
    "max-[641px]:block max-[641px]:[&_thead]:sr-only max-[641px]:[&_tbody]:grid max-[641px]:[&_tbody]:gap-3",
    "max-[641px]:[&_tbody_tr]:grid max-[641px]:[&_tbody_tr]:grid-cols-2 max-[641px]:[&_tbody_tr]:gap-x-2.5 max-[641px]:[&_tbody_tr]:gap-y-[13px] max-[641px]:[&_tbody_tr]:rounded-[10px] max-[641px]:[&_tbody_tr]:border max-[641px]:[&_tbody_tr]:border-admin-line max-[641px]:[&_tbody_tr]:p-[13px]",
    "max-[641px]:[&_td]:block max-[641px]:[&_td]:min-w-0 max-[641px]:[&_td]:border-0 max-[641px]:[&_td]:p-0 max-[641px]:[&_td]:text-[11px] max-[641px]:[&_td]:[overflow-wrap:anywhere]",
    "max-[641px]:[&_td[data-label]]:before:mb-1 max-[641px]:[&_td[data-label]]:before:block max-[641px]:[&_td[data-label]]:before:text-[9px] max-[641px]:[&_td[data-label]]:before:font-normal max-[641px]:[&_td[data-label]]:before:text-[#979ba5] max-[641px]:[&_td[data-label]]:before:content-[attr(data-label)]",
    "max-[641px]:[&_td:last-child]:col-span-full max-[641px]:[&_td[colspan]]:col-span-full max-[641px]:[&_td:last-child_.flex]:pt-1 max-[641px]:[&_button]:min-h-10 max-[641px]:[&_a.inline-flex]:min-h-10 motion-reduce:[&_tbody_tr]:transition-none",
  ].join(" "),
  badge:
    "inline-flex items-center gap-[5px] rounded-[5px] bg-[#f0f1f4] px-2 py-1 text-[9px] font-medium leading-normal whitespace-nowrap text-[#666a75] capitalize",
  muted: "text-admin-muted",
  eyebrow: "text-[9px] font-medium tracking-[1.8px] text-[#aa833f]",
  skeleton:
    "rounded-xl bg-[linear-gradient(90deg,#ebedf0_25%,#f4f5f7_50%,#ebedf0_75%)] bg-size-[200%_100%] motion-safe:animate-admin-shimmer",
  modal,
  dialog: `${modal} inset-0 m-auto max-h-[calc(100dvh-40px)] w-[min(460px,calc(100vw-32px))] rounded-2xl [&_h2]:text-[19px] [&_h2]:font-semibold [&_p]:mt-2.5 [&_p]:text-[12px] [&_p]:text-admin-muted`,
  dialogContent: "p-[30px] max-[641px]:p-6",
} as const;
