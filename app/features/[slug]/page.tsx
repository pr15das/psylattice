import { notFound } from "next/navigation";
import FeatureDetailPage from "@/components/marketing/FeatureDetailPage";
import { getMarketingFeature, marketingFeatures } from "@/lib/marketing-features";

export const dynamicParams = false;

export function generateStaticParams() {
  return marketingFeatures.map((feature) => ({ slug: feature.slug }));
}

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const feature = getMarketingFeature(slug);

  if (!feature) notFound();

  return <FeatureDetailPage feature={feature} />;
}
