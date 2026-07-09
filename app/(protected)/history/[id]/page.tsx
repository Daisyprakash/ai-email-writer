import { EmailDetailView } from "@/components/EmailHistory/EmailDetailView";

interface EmailDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EmailDetailPage({ params }: EmailDetailPageProps) {
  const { id } = await params;

  return <EmailDetailView emailId={id} />;
}
