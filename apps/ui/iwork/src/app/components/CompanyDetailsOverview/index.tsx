// index.tsx
import React from "react";
import { Wrapper, CustomDivider, BackgroundImageLink } from "./styles";
import { Description, ImageText, List } from "./ComponentRender";
import detailsOverviewImage from "../../assets/svgs/details-overview-image.svg";

type DataItem = {
  type: "section" | "list" | "imageText";
  title: string;
  description?: string;
  content?: string[];
  image?: string;
  text?: string;
  richText?: boolean;
};

type Props = {
  data: DataItem[];
};

const CompanyDetailsOverview: React.FC<Props> = ({ data }) => {
  return (
    <Wrapper>
      {data.map((item, index) => (
        <React.Fragment key={index}>
          {(() => {
            switch (item.type) {
              case "section":
                return (
                  <Description
                    title={item.title}
                    description={item.description || ""}
                    richText={item.richText}
                  />
                );
              case "list":
                return <List title={item.title} content={item.content || []} />;
              case "imageText":
                return (
                  <ImageText image={item.image || ""} text={item.text || ""} />
                );
              default:
                return null;
            }
          })()}
          {index !== 0 && index !== data.length - 1 && <CustomDivider />}
        </React.Fragment>
      ))}
      <BackgroundImageLink src={detailsOverviewImage} />
    </Wrapper>
  );
};

export default CompanyDetailsOverview;
