import Link from "next/link";

import PlaceholderContent from "@/components/demo/placeholder-content";
import { ContentLayout } from "@/components/admin-panel/content-layout";

export default function PostsPage() {
  return (
    <ContentLayout title="All Posts">
      <PlaceholderContent />
    </ContentLayout>
  );
}
