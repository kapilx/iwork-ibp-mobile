import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Step, StepItem } from "./config";
import { StateEnum } from "./RenderComponent";

interface UseNestedStepperOptions {
  stepsConfig: Step[];
  onSelectedKeyChange?: (key: string | null) => void;
  initialSelectedKey?: string | null;
  initialActiveStepIndex?: number;
  autoSelectFirstStep?: boolean;
}

const normalizeStepItem = (item: StepItem): StepItem => ({
  ...item,
  stepState: item.stepState ?? StateEnum.DRAFT,
});

const deriveStepStateFromItems = (
  items: StepItem[],
  fallback: StateEnum
): StateEnum => {
  if (!items.length) {
    return fallback;
  }

  if (items.every((item) => item.stepState === StateEnum.COMPLETED)) {
    return StateEnum.COMPLETED;
  }

  if (items.some((item) => item.stepState === StateEnum.ACTIVE)) {
    return StateEnum.ACTIVE;
  }

  if (items.some((item) => item.stepState === StateEnum.COMPLETED)) {
    return StateEnum.ACTIVE;
  }

  return fallback;
};

const normalizeStep = (step: Step): Step => {
  const normalizedItems = step.items?.map(normalizeStepItem);
  const fallbackState = step.stepState ?? StateEnum.DRAFT;
  const derivedState = normalizedItems
    ? deriveStepStateFromItems(normalizedItems, fallbackState)
    : fallbackState;

  return {
    ...step,
    ...(normalizedItems ? { items: normalizedItems } : {}),
    stepState: derivedState,
  };
};

const normalizeSteps = (steps: Step[]): Step[] => steps.map(normalizeStep);

const findDefaultKey = (steps: Step[]): string | null => {
  for (const step of steps) {
    if (step.items?.length) {
      const activeItem =
        step.items.find((item) => item.stepState === StateEnum.ACTIVE) ??
        step.items.find((item) => item.stepState === StateEnum.DRAFT);

      if (activeItem) {
        return activeItem.key;
      }
    }

    if (
      step.stepState === StateEnum.ACTIVE ||
      step.stepState === StateEnum.COMPLETED
    ) {
      return step.items?.[0]?.key ?? step.key;
    }
  }

  return steps[0]?.items?.[0]?.key ?? steps[0]?.key ?? null;
};

const activateStep = (step: Step): Step => {
  if (!step) {
    return step;
  }

  if (step.stepState === StateEnum.COMPLETED) {
    return step;
  }

  if (!step.items?.length) {
    return { ...step, stepState: StateEnum.ACTIVE };
  }

  let hasActive = false;
  const items = step.items.map((item) => {
    if (item.stepState === StateEnum.COMPLETED) {
      return item;
    }

    if (!hasActive) {
      hasActive = true;
      return { ...item, stepState: StateEnum.ACTIVE };
    }

    return { ...item, stepState: StateEnum.DRAFT };
  });

  return normalizeStep({ ...step, items, stepState: StateEnum.ACTIVE });
};

const findPosition = (steps: Step[], key: string | null) => {
  if (!key) {
    return { stepIndex: -1, itemIndex: -1 };
  }
  let stepIndex = -1;
  let itemIndex = -1;
  steps.forEach((step, sIdx) => {
    if (step.items) {
      const iIdx = step.items.findIndex((i) => i.key === key);
      if (iIdx !== -1) {
        stepIndex = sIdx;
        itemIndex = iIdx;
      }
    }
    if (step.key === key) {
      stepIndex = sIdx;
      itemIndex = -1;
    }
  });
  return { stepIndex, itemIndex };
};

export const useNestedStepper = ({
  stepsConfig,
  onSelectedKeyChange,
  initialSelectedKey,
  initialActiveStepIndex,
  autoSelectFirstStep = true,
}: UseNestedStepperOptions) => {
  const normalizedStepsConfig = useMemo(
    () => normalizeSteps(stepsConfig),
    [stepsConfig]
  );

  const defaultKey = useMemo(
    () => findDefaultKey(normalizedStepsConfig),
    [normalizedStepsConfig]
  );
  const resolvedInitialKey =
    initialSelectedKey !== undefined
      ? initialSelectedKey
      : autoSelectFirstStep
      ? defaultKey
      : null;
  const resolvedInitialIndex = (() => {
    if (typeof initialActiveStepIndex === "number") {
      return initialActiveStepIndex;
    }
    if (resolvedInitialKey) {
      const { stepIndex } = findPosition(
        normalizedStepsConfig,
        resolvedInitialKey
      );
      if (stepIndex !== -1) {
        return stepIndex;
      }
    }
    return autoSelectFirstStep ? 0 : -1;
  })();

  const [activeStepIndex, setActiveStepIndex] = useState(resolvedInitialIndex);
  const [steps, setSteps] = useState<Step[]>(normalizedStepsConfig);
  const [selectedKey, setSelectedKey] = useState<string | null>(
    resolvedInitialKey
  );
  const [openSteps, setOpenSteps] = useState<string[]>(() => {
    if (!normalizedStepsConfig.length) return [];
    if (resolvedInitialKey) {
      const { stepIndex } = findPosition(
        normalizedStepsConfig,
        resolvedInitialKey
      );
      if (stepIndex !== -1) {
        return [normalizedStepsConfig[stepIndex].key];
      }
    }
    return autoSelectFirstStep && normalizedStepsConfig[0]
      ? [normalizedStepsConfig[0].key]
      : [];
  });

  const selectedKeyRef = useRef<string | null>(resolvedInitialKey);

  useEffect(() => {
    selectedKeyRef.current = selectedKey;
  }, [selectedKey]);

  useEffect(() => {
    onSelectedKeyChange?.(selectedKey ?? null);
  }, [selectedKey, onSelectedKeyChange]);

  useEffect(() => {
    if (!selectedKey) return;
    setOpenSteps((prev) => {
      const { stepIndex } = findPosition(steps, selectedKey);
      if (stepIndex === -1) return prev;
      const key = steps[stepIndex].key;
      return prev.includes(key) ? prev : [...prev, key];
    });
  }, [selectedKey, steps]);

  const selectedStep = useMemo(() => {
    const { stepIndex } = findPosition(steps, selectedKey);
    return stepIndex !== -1 ? steps[stepIndex] : undefined;
  }, [steps, selectedKey]);

  const completedKeys = useMemo(() => {
    const keys: string[] = [];
    steps.forEach((step) => {
      if (step.stepState === StateEnum.COMPLETED) keys.push(step.key);
      step.items?.forEach((item) => {
        if (item.stepState === StateEnum.COMPLETED) keys.push(item.key);
      });
    });
    return keys;
  }, [steps]);

  useEffect(() => {
    setSteps(normalizedStepsConfig);

    const previousSelectedKey = selectedKeyRef.current;
    const previousSelectionExists = previousSelectedKey
      ? findPosition(normalizedStepsConfig, previousSelectedKey).stepIndex !== -1
      : false;
    const nextSelectedKey = previousSelectionExists
      ? previousSelectedKey
      : autoSelectFirstStep
      ? defaultKey
      : null;

    selectedKeyRef.current = nextSelectedKey;
    setSelectedKey(nextSelectedKey);

    setActiveStepIndex(() => {
      if (nextSelectedKey) {
        const { stepIndex } = findPosition(
          normalizedStepsConfig,
          nextSelectedKey
        );
        if (stepIndex !== -1) {
          return stepIndex;
        }
      }
      if (autoSelectFirstStep && normalizedStepsConfig.length) {
        return 0;
      }
      return -1;
    });

    setOpenSteps((prevOpen) => {
      if (!normalizedStepsConfig.length) {
        return [];
      }

      const validStepKeys = new Set(
        normalizedStepsConfig.map((step) => step.key)
      );
      const filteredPrevOpen = prevOpen.filter((key) => validStepKeys.has(key));

      if (nextSelectedKey) {
        const { stepIndex } = findPosition(
          normalizedStepsConfig,
          nextSelectedKey
        );
        if (stepIndex !== -1) {
          const stepKey = normalizedStepsConfig[stepIndex].key;
          return filteredPrevOpen.includes(stepKey)
            ? filteredPrevOpen
            : [...filteredPrevOpen, stepKey];
        }
      }

      if (autoSelectFirstStep && normalizedStepsConfig[0]) {
        const stepKey = normalizedStepsConfig[0].key;
        return filteredPrevOpen.includes(stepKey)
          ? filteredPrevOpen
          : [...filteredPrevOpen, stepKey];
      }

      return filteredPrevOpen;
    });
  }, [
    normalizedStepsConfig,
    autoSelectFirstStep,
    defaultKey,
  ]);

  const handleStepHeaderClick = (stepKey: string) => {
    const index = steps.findIndex((s) => s.key === stepKey);
    if (index !== -1) {
      setActiveStepIndex(index);
    }
    
    // Close all steps first, then open only the clicked step
    // If the clicked step is already the only open step, toggle it closed
    setOpenSteps((prev) => {
      const isCurrentlyOpen = prev.includes(stepKey);
      const isOnlyOpenStep = prev.length === 1 && isCurrentlyOpen;
      
      if (isOnlyOpenStep) {
        // If this is the only open step, close it
        return [];
      } else {
        // Otherwise, close all other steps and open only this one
        return [stepKey];
      }
    });

    const step = steps.find((s) => s.key === stepKey);
    if (step) {
      if (!step.items || step.items.length === 0) {
        setSelectedKey(stepKey);
        return;
      }

      if (step.items.length > 0) {
        const activeItem =
          step.items.find((item) => item.stepState === StateEnum.ACTIVE) ??
          step.items[0];
        if (activeItem) {
          setSelectedKey(activeItem.key);
        }
      }
    }
  };

  const handleItemClick = (itemKey: string) => {
    setSelectedKey(itemKey);
    const { stepIndex } = findPosition(steps, itemKey);
    if (stepIndex !== -1) {
      setActiveStepIndex(stepIndex);
    }
  };

  const markComplete = useCallback(
    (key: string) => {
      let derivedNextSelectionKey: string | null = null;
      let derivedNextOpenStepKey: string | null = null;
      let derivedNextActiveIndex: number | null = null;

      setSteps((prev) => {
        const updated = prev.map((step) => ({
          ...step,
          items: step.items?.map((item) => ({ ...item })),
        }));
        const { stepIndex, itemIndex } = findPosition(updated, key);
        if (stepIndex === -1) return prev;
        const currentStep = updated[stepIndex];

        if (itemIndex !== -1 && currentStep.items) {
          const items = currentStep.items.map((item, idx) => {
            if (idx === itemIndex) {
              return { ...item, stepState: StateEnum.COMPLETED };
            }

            if (idx === itemIndex + 1 && item.stepState !== StateEnum.COMPLETED) {
              derivedNextSelectionKey = item.key;
              return { ...item, stepState: StateEnum.ACTIVE };
            }

            return item;
          });

          const normalizedCurrentStep = normalizeStep({
            ...currentStep,
            items,
          });

          updated[stepIndex] = normalizedCurrentStep;

          if (!derivedNextSelectionKey) {
            const nextPending = normalizedCurrentStep.items?.find(
              (item) => item.stepState !== StateEnum.COMPLETED
            );

            if (nextPending) {
              derivedNextSelectionKey = nextPending.key;
            }
          }

          if (derivedNextSelectionKey) {
            derivedNextActiveIndex = stepIndex;
          }

          const isStepComplete = normalizedCurrentStep.items?.every(
            (item) => item.stepState === StateEnum.COMPLETED
          );

          if (isStepComplete && stepIndex + 1 < updated.length) {
            const activatedStep = activateStep(updated[stepIndex + 1]);
            updated[stepIndex + 1] = activatedStep;
            derivedNextOpenStepKey = activatedStep.key;
            derivedNextSelectionKey =
              derivedNextSelectionKey ??
              activatedStep.items?.find(
                (item) => item.stepState === StateEnum.ACTIVE
              )?.key ??
              activatedStep.key;
            derivedNextActiveIndex = stepIndex + 1;
          }
        } else {
          updated[stepIndex] = normalizeStep({
            ...currentStep,
            stepState: StateEnum.COMPLETED,
          });

          if (stepIndex + 1 < updated.length) {
            const activatedStep = activateStep(updated[stepIndex + 1]);
            updated[stepIndex + 1] = activatedStep;
            derivedNextOpenStepKey = activatedStep.key;
            derivedNextSelectionKey =
              activatedStep.items?.find(
                (item) => item.stepState === StateEnum.ACTIVE
              )?.key ?? activatedStep.key;
            derivedNextActiveIndex = stepIndex + 1;
          }
        }

        return normalizeSteps(updated);
      });

      if (derivedNextOpenStepKey) {
        setOpenSteps((prev) =>
          prev.includes(derivedNextOpenStepKey)
            ? prev
            : [...prev, derivedNextOpenStepKey]
        );
      }

      if (derivedNextSelectionKey) {
        setSelectedKey(derivedNextSelectionKey);
      }

      if (derivedNextActiveIndex !== null) {
        setActiveStepIndex(derivedNextActiveIndex);
      }
    },
    [setOpenSteps, setSelectedKey, setActiveStepIndex]
  );

  const handleNext = () => {
    if (!selectedKey) return;
    const { stepIndex, itemIndex } = findPosition(steps, selectedKey);
    if (stepIndex === -1) return;
    const step = steps[stepIndex];

    if (step.items && itemIndex !== -1 && itemIndex + 1 < step.items.length) {
      setSelectedKey(step.items[itemIndex + 1].key);
      setActiveStepIndex(stepIndex);
      return;
    }

    const nextStep = steps[stepIndex + 1];
    if (nextStep) {
      setSteps((prev) =>
        prev.map((entry, idx) =>
          idx === stepIndex + 1 ? activateStep(entry) : entry
        )
      );
      setOpenSteps((prev) =>
        prev.includes(nextStep.key) ? prev : [...prev, nextStep.key]
      );
      const nextKey =
        nextStep.items?.find((item) => item.stepState === StateEnum.ACTIVE)?.
          key ??
        nextStep.items?.[0]?.key ??
        nextStep.key;
      setSelectedKey(nextKey);
      setActiveStepIndex(stepIndex + 1);
    }
  };

  const handleBack = () => {
    if (!selectedKey) return;
    const { stepIndex, itemIndex } = findPosition(steps, selectedKey);
    if (stepIndex === -1) return;
    const step = steps[stepIndex];

    if (step.items && itemIndex > 0) {
      setSelectedKey(step.items[itemIndex - 1].key);
      setActiveStepIndex(stepIndex);
      return;
    }

    const prevStep = steps[stepIndex - 1];
    if (prevStep) {
      setOpenSteps((prev) =>
        prev.includes(prevStep.key) ? prev : [...prev, prevStep.key]
      );
      const prevKey =
        prevStep.items?.[prevStep.items.length - 1]?.key ?? prevStep.key;
      setSelectedKey(prevKey);

      if (stepIndex - 1 >= 0) {
        setActiveStepIndex(stepIndex - 1);
      }
    }
  };

  return {
    steps,
    selectedKey,
    selectedStep,
    openSteps,
    completedKeys,
    setSelectedKey,
    handleStepHeaderClick,
    handleItemClick,
    handleNext,
    handleBack,
    markComplete,
    activeStepIndex,
    setActiveStepIndex,
  };
};

export type UseNestedStepperReturn = ReturnType<typeof useNestedStepper>;
