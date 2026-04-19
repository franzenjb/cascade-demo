"use client";

import { useEffect, useState } from "react";

export default function HelpModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="About Project Cascade"
        title="About this project"
        className="w-9 h-9 flex items-center justify-center border border-arc-gray-300 dark:border-arc-gray-700 bg-white dark:bg-arc-gray-900 text-arc-gray-700 dark:text-arc-cream hover:border-arc-black dark:hover:border-arc-cream transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 px-4 py-8 overflow-y-auto"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-modal-title"
        >
          <div
            className="bg-white dark:bg-arc-gray-900 border-2 border-arc-red max-w-4xl w-full p-6 sm:p-8 shadow-xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-[10px] font-data uppercase tracking-widest text-arc-red mb-1">
                  Project Cascade · About
                </div>
                <h3
                  id="help-modal-title"
                  className="font-headline text-2xl font-bold text-arc-black dark:text-arc-cream leading-tight"
                >
                  Before You Even Ask
                </h3>
                <div className="text-sm text-arc-gray-500 dark:text-arc-gray-300 italic mt-1">
                  Conversational, Anticipatory Mapping for the Non-GIS Responder
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-arc-gray-500 dark:text-arc-gray-300 hover:text-arc-black dark:hover:text-arc-cream transition-colors flex-shrink-0"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="text-xs font-data uppercase tracking-wider text-arc-gray-500 dark:text-arc-gray-300 mb-4">
              A strategic white paper by Jeff Franzen · American Red Cross
            </div>

            <div className="space-y-4 text-sm text-arc-gray-900 dark:text-arc-cream leading-relaxed">
              <p>
                Most major emergency responses begin the same way: a trained GIS analyst
                opens a tool like FEMA&rsquo;s Resilience Analysis and Planning Tool (RAPT)
                and starts clicking. One hundred-plus layers sit in nested menus, waiting
                to be discovered. Somewhere in those menus is the answer to &ldquo;who is
                most vulnerable in the path of this tornado?&rdquo; — but finding it requires
                knowing what to look for, where it lives, and which combination produces the
                map leadership actually needs.
              </p>

              <blockquote className="border-l-2 border-arc-red pl-4 italic text-arc-gray-900 dark:text-arc-cream">
                &ldquo;Buncombe County just received a tornado warning. I&rsquo;ve pulled
                the path-of-travel polygon and overlaid mobile home parks, schools, medical
                facilities, dialysis centers, and the top three community resilience
                indicators. 2,847 people live within the warning polygon; 18% are over 65,
                9% have limited English. Do you want me to generate the leadership briefing
                draft?&rdquo;
              </blockquote>

              <p>
                That capability — anticipatory, conversational, already grounded in the
                right data — is what Project Cascade demonstrates. The system behaves
                proactively when hazards occur, proposes relevant layers, produces starting
                statistics, and maintains a natural-language conversation with the responder
                as the situation evolves.
              </p>

              <details className="group border-t border-arc-gray-100 dark:border-arc-gray-700 pt-4">
                <summary className="cursor-pointer list-none flex items-center gap-2 text-[11px] font-data uppercase tracking-widest text-arc-red hover:text-arc-black dark:hover:text-arc-cream transition-colors">
                  <svg
                    className="w-3 h-3 transition-transform group-open:rotate-90"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M4 2 L8 6 L4 10 Z" />
                  </svg>
                  Read the full paper (30 pages)
                </summary>
                <div className="mt-4">
                  <iframe
                    src="/before-you-even-ask.pdf#view=FitH"
                    title="Before You Even Ask — full white paper"
                    className="w-full h-[70vh] border border-arc-gray-100 dark:border-arc-gray-700 bg-arc-cream dark:bg-arc-black"
                  />
                  <div className="mt-2 text-[11px] font-data uppercase tracking-wider text-arc-gray-500 dark:text-arc-gray-300">
                    <a
                      href="/before-you-even-ask.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-arc-black dark:hover:text-arc-cream transition-colors"
                    >
                      Open in new tab →
                    </a>
                  </div>
                </div>
              </details>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-arc-gray-100 dark:border-arc-gray-700">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border-2 border-arc-black dark:border-arc-cream bg-arc-black dark:bg-arc-cream text-white dark:text-arc-black hover:bg-arc-gray-900 dark:hover:bg-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
