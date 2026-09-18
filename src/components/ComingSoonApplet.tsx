import type { Applet } from "@/lib/types";

export function ComingSoonApplet({ applet }: { applet: Applet }) {
  return (
    <section
      className="coming-soon-applet"
      aria-labelledby="coming-soon-heading"
    >
      <p className="applet-kicker text-xs font-medium tracking-[0.22em] text-neutral-900/55 uppercase">
        Catalog applet
      </p>
      <h2 id="coming-soon-heading" className="mt-2 font-sans text-2xl text-neutral-900">
        {applet.title}
      </h2>
      <p className="mt-4 max-w-lg text-neutral-900/75">{applet.description}</p>
      <p className="mt-6 text-sm text-neutral-900/55">
        Flip this to <span className="text-neutral-900">Live</span> in Studio after the
        matching applet exists in code.
      </p>
    </section>
  );
}
