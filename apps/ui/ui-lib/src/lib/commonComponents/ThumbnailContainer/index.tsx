import { styled } from "@mui/material";
import React from "react";
import {
  ThumbDate,
  ThumbDescription,
  ThumbnailBlock,
  ThumbnailCard,
  ThumbnailContent,
  ThumbTitle,
} from "./style";
const Thumbnail = styled("img")`
  width: 345px;
  height: 210px;
  object-fit: cover;
  cursor: pointer;
  margintop: auto;
  border-radius: 8px;
`;
interface Thumbnail {
  url: string;
  alt: string;
  date: string;
  title: string;
  description: string;
}

interface ThumbnailContainerProps {
  thumbnails: Thumbnail[];
  website: string;
  companyName: string;
}

const ThumbnailContainer: React.FC<ThumbnailContainerProps> = ({
  thumbnails,
  website,
  companyName,
}) => {
  // Microlink’s “embed” param will spit back just the screenshot URL
  const thumbSrc = (url: string): string =>
    `https://api.microlink.io/?url=${encodeURIComponent(
      url
    )}&meta=false&screenshot=&embed=screenshot.url`;
  const validWebsite =
    website &&
    website.trim().toLowerCase() !== "n/a" &&
    (website.startsWith("http://") || website.startsWith("https://"))
      ? website
      : website && website.trim().toLowerCase() !== "n/a"
      ? `https://${website}`
      : undefined;
  return (
    <ThumbnailBlock data-testid="thumbnail-container">
      <ThumbnailCard>
        {validWebsite && (
          <a href={validWebsite} target="_blank" rel="noopener noreferrer">
            <Thumbnail
              src={thumbSrc(validWebsite)}
              alt={thumbnails?.[0]?.alt || "Thumbnail"}
            />
          </a>
        )}
      </ThumbnailCard>

      {/* For Future changes commented the code */}
      {/* <ThumbnailCard>
        <a
          href={`https://www.google.com/search?q=latest+news+${companyName}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Thumbnail
            src={thumbSrc(
              `https://www.google.com/search?sca_esv=f34086cde12ec0ff&q=latest+news+of+insurance+sector&tbm=nws&source=lnms&fbs=ABzOT_CWdhQLP1FcmU5B0fn3xuWpmDtIGL1r84kuKz6yAcD_igefx-eKq1gCPHF3zhthFoneNn6lL83lY3KLybUMxCNDhMUtbCQQO9t_eGxoOP_s3rR9imLItfH1uBSfE1eodVuTM8ezEBX_ohGDzWrNTFJqTIa4FIeozw3hfs1G8gz7FAEgzSxyaFWCZRly-Pd5v-1iuWduOWnMfaYHIKvUwOxZvMmH2w&sa=X&ved=2ahUKEwjYpf-ztpeNAxX5cGwGHVRqLFAQ0pQJegQIFhAB&biw=1440&bih=778&dpr=2`
            )}
            alt={thumbnails?.[1].alt}
          />
        </a>
       
      </ThumbnailCard> */}
    </ThumbnailBlock>
  );
};

export default ThumbnailContainer;
