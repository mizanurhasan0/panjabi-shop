import { Suspense } from "react";
import SearchPageContent from "./SearchPageContent";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-ylw py-16 text-center">Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
