import React from "react";
import SlotCounter from "react-slot-counter";
import { SlotCounterFadeWrapper } from "./styles";


interface AnimatedCounterProps {
    value: number;
    duration?: number;
    speed?: number;
    suffix?: string;
    className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, duration = 1, speed = 10, suffix = "", className }) => (
    <SlotCounterFadeWrapper className={className}>
        <SlotCounter value={value} duration={duration} speed={speed} />
        {suffix && <span style={{ marginLeft: 4 }}>{suffix}</span>}
    </SlotCounterFadeWrapper>
);

export default AnimatedCounter;
