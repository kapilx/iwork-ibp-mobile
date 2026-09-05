import { useEffect, useState } from "react";
import { apiRequest, endPoints } from "@ui/ui-lib";
import { PromoBanner } from "./types";
import { OfferBenefitConfigItem } from "../../../hooks/useCompanyConfig";

/**
 * Resolves the real Offers & Benefits items configured for the CURRENT
 * subdomain (Company Configuration → Offers & Benefits in iwork, for the
 * domain matching this portal — falling back to the company-level default
 * set, same as branding/auth) into PromoBanner slides for
 * BannerCarouselSection. Every enabled item becomes a slide — items with no
 * uploaded image (or a failed image fetch) still render, using a placeholder
 * graphic in BannerCarouselSection. Returns an empty list when the section
 * is disabled for this domain, nothing is configured, or the caller passes
 * no items — callers should fall back to mock banners.
 *
 * Takes the already domain-resolved `offersAndBenefits` + `offersAndBenefitsEnabled`
 * from useCompanyConfig() (subdomain-based) rather than fetching by companyId,
 * so a company with multiple portal domains gets the right set per domain.
 */
export const useOfferBenefitBanners = (
  items: OfferBenefitConfigItem[],
  sectionEnabled: boolean
) => {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!sectionEnabled || !items.length) {
      setBanners([]);
      return;
    }

    let isCancelled = false;
    const objectUrls: string[] = [];

    const load = async () => {
      setIsLoading(true);
      try {
        const enabledItems = items
          .filter((item) => item.isEnabled)
          .sort((a, b) => a.displayOrder - b.displayOrder);

        const resolved = await Promise.all(
          enabledItems.map(async (item): Promise<PromoBanner> => {
            const base = {
              id: `offer-benefit-${item.id}`,
              alt: item.title,
              redirectionUrl: item.redirectionUrl,
              title: item.title,
              description: item.description,
            };

            if (!item.imageFileId) {
              return base;
            }

            try {
              const fileResponse = await apiRequest(
                endPoints.ibpPublicFileUploadDownloadById(item.imageFileId),
                { method: "GET", responseType: "blob" }
              );
              const imageUrl = URL.createObjectURL(fileResponse.data as Blob);
              objectUrls.push(imageUrl);
              return { ...base, imageUrl };
            } catch {
              // Image failed to resolve — still show the card via the placeholder.
              return base;
            }
          })
        );

        if (!isCancelled) {
          setBanners(resolved);
        }
      } catch {
        if (!isCancelled) setBanners([]);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      isCancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [items, sectionEnabled]);

  return { banners, isLoading };
};
