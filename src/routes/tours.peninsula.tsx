import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PackagePage } from "@/components/site/PackagePage";
import { publicPackagesOptions } from "@/lib/packages";

export const Route = createFileRoute("/tours/peninsula")({
  loader: async ({ context }) => {
    const packages = await context.queryClient.ensureQueryData(publicPackagesOptions);
    const pkg = packages.find((p) => p.slug === "peninsula");
    if (!pkg) throw notFound();
    return { pkg, packages };
  },
  head: ({ loaderData }) => {
    const pkg = loaderData?.pkg;
    return {
      meta: [
        { title: pkg?.seo_title || `${pkg?.name || "Cape Peninsula"} | RA2 Travel and Tours` },
        { name: "description", content: pkg?.seo_description || pkg?.summary || "" },
        { property: "og:title", content: pkg?.name || "Cape Peninsula" },
        { property: "og:description", content: pkg?.summary || "" },
      ],
    };
  },
  component: Peninsula,
});
function Peninsula() {
  const packages = useSuspenseQuery({
    ...publicPackagesOptions,
    initialData: Route.useLoaderData().packages,
  }).data;
  const pkg = packages.find((p) => p.slug === "peninsula");
  if (!pkg) throw notFound();
  return (
    <PackagePage
      pkg={pkg}
      related={packages.filter((p) => p.show_in_tours && p.id !== pkg.id).slice(0, 3)}
    />
  );
}
