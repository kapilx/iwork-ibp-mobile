import React, { useMemo, useState } from "react";
import {
  Description as StyledDescription,
  StyledHeading,
  List as StyledList,
  ListContainer,
  ListItem,
  ReadMore,
  SectionContainer,
  Wrapper,
  Container,
  Image,
  Text,
  RichTextContainer,
} from "./styles";
import { READ_LESS, READ_MORE } from "../../constants";
import { sanitizeHtml } from "@ui/ui-lib/utils/sanitizeHtml";

type Props = {
  title: string;
};
type ListProps = {
  title: string;
  content: string[];
};

type DescriptionProps = {
  title: string;
  description: string;
  richText?: boolean;
};
type ImageTextProps = {
  image: string;
  text: string;
};

export const Heading: React.FC<Props> = ({ title }) => {
  return <StyledHeading>{title}</StyledHeading>;
};

// List/List.tsx
export const List: React.FC<ListProps> = ({ title, content }) => {
  return (
    <ListContainer>
      <StyledHeading type="list">{title}</StyledHeading>
      <StyledList>
        {content.map((point, idx) => (
          <ListItem key={idx}>{point}</ListItem>
        ))}
      </StyledList>
    </ListContainer>
  );
};

export const Description: React.FC<DescriptionProps> = ({
  title,
  description,
  richText = false,
}) => {
  const [showMore, setShowMore] = useState(false);
  const words = description.split(" ");
  const shouldTruncate = words.length > 20;
  const displayText = showMore ? description : words.slice(0, 20).join(" ");

  const sanitizedDisplayText = useMemo(
    () => sanitizeHtml(displayText),
    [displayText]
  );

  return (
    <SectionContainer>
      <StyledHeading>{title}</StyledHeading>
      <StyledDescription>
        {richText ? (
          <RichTextContainer
            dangerouslySetInnerHTML={{
              //  fd_secret_ignore
              __html: sanitizedDisplayText,
            }}
          />
        ) : (
          <>
            {displayText}
            &nbsp;
          </>
        )}
        {shouldTruncate && (
          <ReadMore onClick={() => setShowMore(!showMore)}>
            {showMore ? READ_LESS : READ_MORE}
          </ReadMore>
        )}
      </StyledDescription>
    </SectionContainer>
  );
};

export const ImageText: React.FC<ImageTextProps> = ({ image, text }) => {
  return (
    <Container>
      <Image src={image} alt="icon" />
      <Text>{text}</Text>
    </Container>
  );
};
