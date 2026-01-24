'use client';

import { cn } from "@/lib/utils";
import React from "react";

interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {}

const Timeline = React.forwardRef<HTMLOListElement, TimelineProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <ol
        ref={ref}
        className={cn("relative border-s border-gray-200 dark:border-gray-700", className)}
        {...props}
      >
        {children}
      </ol>
    );
  }
);
Timeline.displayName = "Timeline";

interface TimelineItemProps extends React.HTMLAttributes<HTMLLIElement> {}

const TimelineItem = React.forwardRef<HTMLLIElement, TimelineItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <li ref={ref} className={cn("mb-10 ms-4", className)} {...props}>
        {children}
      </li>
    );
  }
);
TimelineItem.displayName = "TimelineItem";

interface TimelinePointProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
}

const TimelinePoint = React.forwardRef<HTMLDivElement, TimelinePointProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-gray-200 dark:border-gray-900 dark:bg-gray-700",
          "flex items-center justify-center",
          className
        )}
        {...props}
      >
        {icon}
      </div>
    );
  }
);
TimelinePoint.displayName = "TimelinePoint";


interface TimelineTimeProps extends React.HTMLAttributes<HTMLTimeElement> {}

const TimelineTime = React.forwardRef<HTMLTimeElement, TimelineTimeProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <time ref={ref} className={cn("mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500", className)} {...props}>
                {children}
            </time>
        )
    }
);
TimelineTime.displayName = "TimelineTime";

interface TimelineTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const TimelineTitle = React.forwardRef<HTMLHeadingElement, TimelineTitleProps>(
    ({ className, as: Comp = "h3", ...props }, ref) => {
        return (
            <Comp ref={ref} className={cn("text-lg font-semibold text-gray-900 dark:text-white", className)} {...props} />
        )
    }
);
TimelineTitle.displayName = "TimelineTitle";


interface TimelineBodyProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const TimelineBody = React.forwardRef<HTMLParagraphElement, TimelineBodyProps>(
    ({ className, ...props }, ref) => {
        return (
            <p ref={ref} className={cn("mb-4 text-base font-normal text-gray-500 dark:text-gray-400", className)} {...props} />
        )
    }
);
TimelineBody.displayName = "TimelineBody";


export {
  Timeline,
  TimelineItem,
  TimelinePoint,
  TimelineTime,
  TimelineTitle,
  TimelineBody,
};
