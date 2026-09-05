import { gsap } from 'gsap';
import { MutableRefObject } from 'react';

export default function GsapTransitionComponent(reference: MutableRefObject<any>, methodName: string, fromProps: object, toProps: object) {
    
    const OnCompleteHandler = (originalOnComplete?: () => void) => {
        return () => {
            if (originalOnComplete) {
                originalOnComplete();
            }
            gsap.killTweensOf(reference.current);
        };
    };
    const executeGsapMethod = (method: 'from' | 'to', props: object) => {
        const originalOnComplete = (props as any).onComplete;
        gsap[method](reference.current, {
            ...props,
            onComplete: OnCompleteHandler(originalOnComplete)
        });
    };
    if (methodName === 'fromTo') {
        const originalOnComplete = (toProps as any).onComplete;
        gsap.fromTo(reference.current, {
            ...fromProps
        },
            {
                ...toProps,
                onComplete: OnCompleteHandler(originalOnComplete)
            })
    }
    else if (methodName === 'from') {
        executeGsapMethod('from', fromProps);
    } else if (methodName === 'to') {
        executeGsapMethod('to', toProps);
    }
}


