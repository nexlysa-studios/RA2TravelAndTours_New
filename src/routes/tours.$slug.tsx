import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PackagePage } from "@/components/site/PackagePage";
import { publicPackagesOptions } from "@/lib/packages";

export const Route = createFileRoute("/tours/$slug")({
  loader: async ({ context, params }) => {
    const packages = await context.queryClient.ensureQueryData(publicPackagesOptions);
    const pkg = packages.find((p) => p.slug === params.slug);
    if (!pkg) throw notFound();
    return { pkg, packages };
  },
  head: ({ loaderData }) => {
    const pkg = loaderData?.pkg;
    return {
      meta: [
        { title: pkg?.seo_title || `${pkg?.name || "Experience"} | RA2 Travel and Tours` },
        { name: "description", content: pkg?.seo_description || pkg?.summary || "" },
        { property: "og:title", content: pkg?.name || "RA2 Travel and Tours" },
        { property: "og:description", content: pkg?.summary || "" },
      ],
    };
  },
  component: Detail,
});
function Detail() {
  const { slug } = Route.useParams();
  const packages = useSuspenseQuery({
    ...publicPackagesOptions,
    initialData: Route.useLoaderData().packages,
  }).data;
  const pkg = packages.find((p) => p.slug === slug);
  if (!pkg) throw notFound();
  return (
    <PackagePage
      pkg={pkg}
      related={packages
        .filter(
          (p) =>
            p.package_type === pkg.package_type &&
            p.id !== pkg.id &&
            (p.show_in_tours || p.show_on_category_page),
        )
        .slice(0, 3)}
    />
  );
}
