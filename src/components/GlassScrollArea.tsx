"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import type { PointerEvent, ReactNode } from "react";

type Axis = "x" | "y" | "xy";

const MIN_THUMB = 28;

export function GlassScrollArea({
  children,
  className = "",
  axis = "xy",
}: {
  children: ReactNode;
  className?: string;
  axis?: Axis;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const yTrackRef = useRef<HTMLDivElement>(null);
  const yThumbRef = useRef<HTMLDivElement>(null);
  const xTrackRef = useRef<HTMLDivElement>(null);
  const xThumbRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    axis: "x" | "y";
    pointerId: number;
    start: number;
    scroll: number;
  } | null>(null);

  const allowY = axis !== "x";
  const allowX = axis !== "y";

  const sync = useCallback(() => {
    const view = viewportRef.current;
    const root = rootRef.current;
    const yTrack = yTrackRef.current;
    const yThumb = yThumbRef.current;
    const xTrack = xTrackRef.current;
    const xThumb = xThumbRef.current;
    if (!view || !root) return;

    const yOverflow = allowY && view.scrollHeight - view.clientHeight > 2;
    const xOverflow = allowX && view.scrollWidth - view.clientWidth > 2;
    root.classList.toggle("has-y", yOverflow);
    root.classList.toggle("has-x", xOverflow);

    if (yTrack && yThumb) {
      yTrack.hidden = !yOverflow;
      if (yOverflow) {
        const trackSize = yTrack.clientHeight;
        const thumbSize = Math.max(
          MIN_THUMB,
          (view.clientHeight / view.scrollHeight) * trackSize,
        );
        const maxScroll = Math.max(1, view.scrollHeight - view.clientHeight);
        const maxThumb = Math.max(0, trackSize - thumbSize);
        yThumb.style.height = `${thumbSize}px`;
        yThumb.style.transform = `translate3d(0, ${(view.scrollTop / maxScroll) * maxThumb}px, 0)`;
      }
    }

    if (xTrack && xThumb) {
      xTrack.hidden = !xOverflow;
      if (xOverflow) {
        const trackSize = xTrack.clientWidth;
        const thumbSize = Math.max(
          MIN_THUMB,
          (view.clientWidth / view.scrollWidth) * trackSize,
        );
        const maxScroll = Math.max(1, view.scrollWidth - view.clientWidth);
        const maxThumb = Math.max(0, trackSize - thumbSize);
        xThumb.style.width = `${thumbSize}px`;
        xThumb.style.transform = `translate3d(${(view.scrollLeft / maxScroll) * maxThumb}px, 0, 0)`;
      }
    }
  }, [allowX, allowY]);

  useLayoutEffect(() => {
    const view = viewportRef.current;
    if (!view) return;

    const frame = { id: 0 };
    const schedule = () => {
      if (frame.id) return;
      frame.id = requestAnimationFrame(() => {
        frame.id = 0;
        sync();
      });
    };

    sync();
    view.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(view);
    if (view.firstElementChild) observer.observe(view.firstElementChild);

    return () => {
      view.removeEventListener("scroll", schedule);
      observer.disconnect();
      if (frame.id) cancelAnimationFrame(frame.id);
    };
  }, [sync]);

  const onThumbDown = (event: PointerEvent<HTMLDivElement>, nextAxis: "x" | "y") => {
    const view = viewportRef.current;
    if (!view || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      axis: nextAxis,
      pointerId: event.pointerId,
      start: nextAxis === "y" ? event.clientY : event.clientX,
      scroll: nextAxis === "y" ? view.scrollTop : view.scrollLeft,
    };
  };

  const onThumbMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const view = viewportRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !view) return;

    if (drag.axis === "y") {
      const track = yTrackRef.current;
      const thumb = yThumbRef.current;
      if (!track || !thumb) return;
      const maxScroll = view.scrollHeight - view.clientHeight;
      const maxThumb = track.clientHeight - thumb.offsetHeight;
      if (maxThumb <= 0) return;
      view.scrollTop = drag.scroll + ((event.clientY - drag.start) * maxScroll) / maxThumb;
      return;
    }

    const track = xTrackRef.current;
    const thumb = xThumbRef.current;
    if (!track || !thumb) return;
    const maxScroll = view.scrollWidth - view.clientWidth;
    const maxThumb = track.clientWidth - thumb.offsetWidth;
    if (maxThumb <= 0) return;
    view.scrollLeft = drag.scroll + ((event.clientX - drag.start) * maxScroll) / maxThumb;
  };

  const onThumbUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onTrackDown = (event: PointerEvent<HTMLDivElement>, nextAxis: "x" | "y") => {
    if (event.target !== event.currentTarget || event.button !== 0) return;
    const view = viewportRef.current;
    if (!view) return;
    event.preventDefault();

    if (nextAxis === "y") {
      const thumb = yThumbRef.current;
      const bounds = event.currentTarget.getBoundingClientRect();
      const thumbSize = thumb?.offsetHeight ?? MIN_THUMB;
      const maxThumb = Math.max(1, bounds.height - thumbSize);
      const maxScroll = view.scrollHeight - view.clientHeight;
      view.scrollTop = ((event.clientY - bounds.top - thumbSize / 2) / maxThumb) * maxScroll;
      return;
    }

    const thumb = xThumbRef.current;
    const bounds = event.currentTarget.getBoundingClientRect();
    const thumbSize = thumb?.offsetWidth ?? MIN_THUMB;
    const maxThumb = Math.max(1, bounds.width - thumbSize);
    const maxScroll = view.scrollWidth - view.clientWidth;
    view.scrollLeft = ((event.clientX - bounds.left - thumbSize / 2) / maxThumb) * maxScroll;
  };

  return (
    <div
      ref={rootRef}
      className={`glass-scroll ${axis === "x" ? "glass-scroll--x" : ""} ${className}`.trim()}
    >
      <div ref={viewportRef} className="glass-scroll-viewport">
        <div className="glass-scroll-content">{children}</div>
      </div>
      {allowY ? (
        <div
          ref={yTrackRef}
          className="glass-scroll-track glass-scroll-track--y"
          hidden
          onPointerDown={(event) => onTrackDown(event, "y")}
        >
          <div
            ref={yThumbRef}
            className="glass-scroll-thumb glass-scroll-thumb--y"
            onPointerDown={(event) => onThumbDown(event, "y")}
            onPointerMove={onThumbMove}
            onPointerUp={onThumbUp}
            onPointerCancel={onThumbUp}
          />
        </div>
      ) : null}
      {allowX ? (
        <div
          ref={xTrackRef}
          className="glass-scroll-track glass-scroll-track--x"
          hidden
          onPointerDown={(event) => onTrackDown(event, "x")}
        >
          <div
            ref={xThumbRef}
            className="glass-scroll-thumb glass-scroll-thumb--x"
            onPointerDown={(event) => onThumbDown(event, "x")}
            onPointerMove={onThumbMove}
            onPointerUp={onThumbUp}
            onPointerCancel={onThumbUp}
          />
        </div>
      ) : null}
    </div>
  );
}
