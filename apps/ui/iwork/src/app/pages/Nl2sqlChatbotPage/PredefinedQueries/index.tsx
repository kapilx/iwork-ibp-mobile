import { useRef, useCallback, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Title } from "@mui/icons-material";
import {
  QueryChip,
  QueriesContainer,
  QueriesWrapper,
  NavigationButton,
  QueriesTitle,
  TitleContainer,
  NavigationContainer,
  StarIcon,
} from "./styles.js";

export interface PredefinedQueriesProps {
  queries: string[];
  onQueryClick: (query: string) => void;
  title?: string;
}

const PredefinedQueries = ({
  queries,
  onQueryClick,
  title = "Try these queries:",
}: PredefinedQueriesProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  if (!queries || queries.length === 0) {
    return null;
  }

  const handleQueryClick = (query: string) => {
    onQueryClick(query);
  };

  const checkScrollState = useCallback(() => {
    if (wrapperRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = wrapperRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    checkScrollState();
    const wrapper = wrapperRef.current;
    if (wrapper) {
      wrapper.addEventListener("scroll", checkScrollState);
      return () => wrapper.removeEventListener("scroll", checkScrollState);
    }
    return undefined;
  }, [checkScrollState, queries]);

  const scrollLeft = useCallback(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  }, []);

  const scrollToChip = useCallback((index: number) => {
    if (wrapperRef.current) {
      const chipElements =
        wrapperRef.current.querySelectorAll('[role="button"]');
      const targetChip = chipElements[index] as HTMLElement;
      if (targetChip) {
        targetChip.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          if (index > 0) {
            scrollToChip(index - 1);
            const prevChip = wrapperRef.current?.querySelectorAll(
              '[role="button"]'
            )[index - 1] as HTMLElement;
            prevChip?.focus();
          }
          break;
        case "ArrowRight":
          event.preventDefault();
          if (index < queries.length - 1) {
            scrollToChip(index + 1);
            const nextChip = wrapperRef.current?.querySelectorAll(
              '[role="button"]'
            )[index + 1] as HTMLElement;
            nextChip?.focus();
          }
          break;
        case "Home":
          event.preventDefault();
          scrollToChip(0);
          const firstChip = wrapperRef.current?.querySelectorAll(
            '[role="button"]'
          )[0] as HTMLElement;
          firstChip?.focus();
          break;
        case "End":
          event.preventDefault();
          scrollToChip(queries.length - 1);
          const lastChip = wrapperRef.current?.querySelectorAll(
            '[role="button"]'
          )[queries.length - 1] as HTMLElement;
          lastChip?.focus();
          break;
      }
    },
    [queries.length, scrollToChip]
  );

  return (
    <QueriesContainer>
      <TitleContainer>
          <StarIcon />
         <QueriesTitle>{title}</QueriesTitle>
      </TitleContainer>
      <NavigationContainer>
        <NavigationButton
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          aria-label="Scroll left"
          size="small"
        >
          <ChevronLeft />
        </NavigationButton>
        <QueriesWrapper ref={wrapperRef}>
          {queries.map((query, index) => (
            <QueryChip
              key={`${query}-${index}`}
              label={query}
              onClick={() => handleQueryClick(query)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              clickable
              variant="outlined"
              tabIndex={0}
              role="button"
              aria-label={`Query: ${query}`}
            />
          ))}
        </QueriesWrapper>
        <NavigationButton
          onClick={scrollRight}
          disabled={!canScrollRight}
          aria-label="Scroll right"
          size="small"
        >
          <ChevronRight />
        </NavigationButton>
      </NavigationContainer>
    </QueriesContainer>
  );
};

export default PredefinedQueries;
