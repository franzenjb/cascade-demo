"use client";

import { useEffect, useState, type ReactNode } from "react";

function PaperSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group/sec border-t border-arc-gray-100 dark:border-arc-gray-700 pt-3">
      <summary className="cursor-pointer list-none flex items-center gap-2 font-headline font-bold text-sm text-arc-black dark:text-arc-cream hover:text-arc-red transition-colors">
        <svg className="w-3 h-3 transition-transform group-open/sec:rotate-90 flex-shrink-0" viewBox="0 0 12 12" fill="currentColor" aria-hidden><path d="M4 2 L8 6 L4 10 Z" /></svg>
        {title}
      </summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

function BQ({ children }: { children: ReactNode }) {
  return (
    <blockquote className="border-l-2 border-arc-red pl-4 italic text-arc-gray-900 dark:text-arc-cream">
      {children}
    </blockquote>
  );
}

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
                  Read the full paper
                </summary>
                <div className="mt-4 space-y-6 text-sm leading-relaxed max-h-[70vh] overflow-y-auto pr-2">

                  <PaperSection title="Abstract">
                    <p>This paper proposes a conversational, anticipatory mapping partner purpose-built for emergency response. The clearest illustration is a single scene: when the National Weather Service issues a tornado warning, before anyone opens the app, the system is already ready with something like this &mdash;</p>
                    <BQ>&ldquo;Buncombe County just received a tornado warning. I&rsquo;ve pulled the path-of-travel polygon and overlaid mobile home parks, schools, medical facilities, dialysis centers, and the top three community resilience indicators. 2,847 people live within the warning polygon; 18% are over 65, 9% have limited English. Do you want me to generate the leadership briefing draft?&rdquo;</BQ>
                    <p>That capability &mdash; anticipatory, conversational, already grounded in the right data &mdash; is what this paper describes. The system behaves proactively when hazards occur, proposes relevant layers, produces starting statistics, and maintains a natural-language conversation with the responder as the situation evolves. It is grounded in the existing federal, state, and organizational data infrastructure; integrates with &mdash; rather than replaces &mdash; current operational platforms including ArcGIS, NG SCOUT, and Red Cross internal systems; and is designed around trust principles that include transparency, human-in-the-loop control, privacy by design for vulnerable populations, graceful degradation under degraded connectivity, and full evidence traceability.</p>
                    <p>The problem it addresses is real and measurable. Emergency mapping tools today &mdash; FEMA&rsquo;s Resilience Analysis and Planning Tool (RAPT), California&rsquo;s Next-Generation SCOUT, the California Access and Functional Needs Web Map, and Red Cross operational GIS systems &mdash; are individually powerful and collectively fragmented. Each requires the user to know what they&rsquo;re looking for before they can find it, and each lives in its own silo. The cognitive and time cost of discovery, combination, and translation falls on the most highly trained GIS users, effectively excluding volunteer responders, smaller jurisdictions, and community-based organizations from enterprise-grade mapping capability at the moments it matters most.</p>
                    <p>The paper details the core workflow with scripted examples, the technical architecture with a focus on the semantic layer catalog as the highest-leverage artifact, a Hurricane Helene case study grounded in real impacts across western North Carolina and southern Appalachia &mdash; shelter demand, populations needing specialized support, water system failures, and recovery undercount risks &mdash; 28 spin-off tool concepts spanning response, recovery, and planning, a direct comparison with current state-of-the-art systems, and a phased implementation roadmap. It closes not with a single ask but with a set of paths forward &mdash; partnership with existing agencies, collaboration with university GIS programs, private-enterprise development, or some combination &mdash; because the capability is worth building, and the right delivery model is a decision the partners will make together.</p>
                    <p className="text-xs text-arc-gray-500 dark:text-arc-gray-300"><strong>Keywords:</strong> emergency management, geographic information systems, conversational AI, disaster response, access and functional needs, humanitarian technology, FEMA RAPT, Cal OES, American Red Cross</p>
                  </PaperSection>

                  <PaperSection title="Executive Summary">
                    <p>Most major emergency responses begin the same way: a trained GIS analyst opens a tool like FEMA&rsquo;s Resilience Analysis and Planning Tool (RAPT) and starts clicking. One hundred-plus layers sit in nested menus, waiting to be discovered. Somewhere in those menus is the answer to &ldquo;who is most vulnerable in the path of this tornado?&rdquo; &mdash; but finding it requires knowing what to look for, where it lives, and which combination produces the map leadership actually needs.</p>
                    <p>We can do better. Large language models have crossed a threshold where they can act not as a chatbot bolted onto GIS, but as a knowledgeable colleague who already understands the data &mdash; proposing the right layers for a given hazard, synthesizing vulnerability statistics on demand, and producing shareable maps in the time it currently takes to log in.</p>
                    <p>This paper describes a conversational, anticipatory mapping partner purpose-built for emergency response. It is grounded in what FEMA RAPT, Cal OES NG SCOUT, the California Access and Functional Needs Web Map, and Red Cross GIS systems already do well, and designed to fill the gap none of them fill: turning raw spatial capability into fast, accessible, defensible decisions during the worst hours a community will ever have.</p>
                    <p>The target user is not a senior GIS analyst. It is the volunteer who arrived at the Disaster Relief Operation two hours ago, the chapter executive briefing a board in twenty minutes, the county emergency manager in a jurisdiction without dedicated GIS staff, and the incident commander who needs a vulnerability assessment before the next operational period begins.</p>
                  </PaperSection>

                  <PaperSection title="Part 1 — The Problem: How We've Always Done It">
                    <h4 className="font-semibold mt-4 mb-2">1.1 The current state of the art is powerful and fragmented</h4>
                    <p>Today&rsquo;s emergency manager has access to remarkable tools. Few of them talk to each other, and most of them require the user to already know what they&rsquo;re looking for.</p>
                    <p><strong>FEMA RAPT</strong> is the federal baseline. It offers over 100 preloaded GIS layers covering infrastructure, hazards, weather, risk, and community resilience indicators &mdash; including 26 demographic layers at county, census tract, and Tribal Nation levels, the Community Resilience Challenges Index (CRCI), and integrated analysis tools like the Population Counter and Incident Analysis. It is free, requires no login, and is genuinely excellent. It is also a menu-driven application: the user must know that &ldquo;households with limited English&rdquo; is a layer before they can toggle it on, and must know to combine it with mobile home park locations and flood zones before they can produce the map that matters.</p>
                    <p><strong>Cal OES NG SCOUT</strong>, powered by Intterra, is California&rsquo;s operational common operating picture. It integrates statewide incident data, FIRIS aircraft feeds, automatic vehicle location data from fire apparatus, road closures, pre-plans, and predictive analytics &mdash; with an offline-capable field app that syncs without data loss. It is exceptional for incident coordination. It is not designed for pre-positioning analysis, post-disaster equity audits, or ad-hoc vulnerability questions from a volunteer who just arrived at a disaster operation.</p>
                    <p><strong>The California Access and Functional Needs Web Map</strong>, maintained by California&rsquo;s Office of Access and Functional Needs, is the first-of-its-kind statewide inventory of assets serving people who need specialized support during emergencies &mdash; a group that, in California&rsquo;s formal framework, includes people with disabilities, older adults, children, limited-English speakers, those in institutional settings, and the transportation disadvantaged. The map inventories assistive technology providers, accessible transportation, ASL interpreters, Independent Living Centers, and Functional Assessment Service Team coordinators. It encodes the C-MIST framework and California Government Code &sect;8593.3. It lives separately from RAPT, separately from NG SCOUT, and separately from the Red Cross&rsquo;s own tools.</p>
                    <p><strong>Red Cross GIS systems</strong> &mdash; RC View, the dashboards built across the organization, the layers maintained by chapters and divisions &mdash; are the institutional nervous system of disaster response for one of the country&rsquo;s largest humanitarian organizations. They are also scattered across services, projects, and AGOL folders.</p>
                    <p>The pattern is consistent: each tool is a good answer to a narrow question, and the work of stitching them together tends to fall on the most highly trained GIS users in the organization.</p>

                    <h4 className="font-semibold mt-4 mb-2">1.2 Generic AI assistants aren&rsquo;t the answer either</h4>
                    <p>A natural question is whether a general-purpose AI &mdash; ChatGPT, Claude, Gemini, or a similar tool &mdash; could just do this with the right prompting. The answer is no, for three reasons that matter.</p>
                    <p>First, general-purpose AI doesn&rsquo;t have direct, authenticated access to the authoritative data layers. An emergency manager doesn&rsquo;t need an AI that has <em>read about</em> dialysis center locations in its training data. They need an AI that can query the current HIFLD medical facility service-area layer and produce a defensible population count for a specific polygon, right now. That requires real integration with live data sources, not clever prompting against stale knowledge.</p>
                    <p>Second, general-purpose AI produces text. Emergency response produces maps, statistics, and operational artifacts. A leadership briefing needs a map with a legend, a defensible statistic with provenance, and an exportable product. Conversational output is the last mile, not the whole product.</p>
                    <p>Third, general-purpose AI lacks the domain-specific reasoning that makes outputs trustworthy under pressure. It doesn&rsquo;t know that sensitive population registry data requires role-gated access. It doesn&rsquo;t know that &ldquo;shelter&rdquo; means four different things depending on context (mass care, evacuation, homeless services, shelter-in-place). It may not know that a hurricane forecast cone shift triggers a different checklist than a tornado warning, or that a Public Safety Power Shutoff has medical-baseline-customer implications distinct from a general outage. That knowledge has to be encoded in the system, not improvised by a model at runtime.</p>
                    <p>The system described here is built on the same underlying language-model capability that makes general-purpose AI possible. But the architecture &mdash; the semantic layer catalog, the disaster-specific templates, the authenticated data integration, the trust principles &mdash; is what makes it fit for consequential decisions. The language model is the engine, not the product.</p>

                    <h4 className="font-semibold mt-4 mb-2">1.3 The cognitive burden at the worst possible moment</h4>
                    <p>Emergency managers make high-stakes decisions under sleep deprivation, time pressure, and incomplete information. The current mapping workflow adds to the load:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Discovery cost:</strong> The user has to know that a layer exists before they can use it. RAPT alone has over 100.</li>
                      <li><strong>Combination cost:</strong> Useful answers require overlaying three, four, or five layers at once, and knowing which combinations produce insight versus noise.</li>
                      <li><strong>Translation cost:</strong> Leadership asks &ldquo;how many elderly people are in the path?&rdquo; and the analyst must translate that into census variables, buffer geometries, and sum operations.</li>
                      <li><strong>Defensibility cost:</strong> Every number produced might end up on a slide for the Governor, the CEO, or a press conference. The analyst must be able to show their work.</li>
                    </ul>
                    <p>In tabletop exercises and real operations, the time between &ldquo;leadership asks a question&rdquo; and &ldquo;analyst produces a defensible map&rdquo; is routinely measured in hours. In a fast-moving event, that gap is the difference between a proactive response and a reactive one.</p>

                    <h4 className="font-semibold mt-4 mb-2">1.4 Who gets left out</h4>
                    <p>The current tooling tacitly assumes a user with GIS training. That excludes:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>The volunteer who arrived at the disaster operation eighteen hours ago from another state.</li>
                      <li>The smaller Red Cross office without dedicated mapping staff.</li>
                      <li>The community-based organization coordinating the last-mile response.</li>
                      <li>The incident commander who needs the answer themselves, right now, without a request ticket.</li>
                      <li>The jurisdiction &mdash; often rural, often under-resourced &mdash; where the entire emergency management office might be one person.</li>
                    </ul>
                    <p>Hurricane Helene demonstrated what this exclusion costs. Cell towers went down across central Appalachia. Broadband access, already low, collapsed &mdash; and FEMA&rsquo;s application process is online. Some communities used mules to move supplies. The counties hit hardest in western North Carolina, southwest Virginia, and eastern Tennessee had high pre-existing social vulnerability, and the tools that support mapping and anticipating that vulnerability sat in offices, not in the hands of the people responding.</p>
                  </PaperSection>

                  <PaperSection title="Part 2 — The Vision: A Partner, Not a Tool">
                    <h4 className="font-semibold mt-4 mb-2">2.1 The core shift</h4>
                    <p>The change we are proposing is not a better interface. It is a change in the relationship between the responder and the data.</p>
                    <p>Today, the user drives the tool. They decide what to ask, where to look, how to combine, and what to produce. The tool is a passive substrate.</p>
                    <p>Tomorrow, the user drives the decision. They describe the situation &mdash; &ldquo;tornado path just crossed Buncombe County&rdquo; &mdash; and the system, which already knows the data, proposes what matters, produces the starting map, and stays in conversation as the situation evolves. The map becomes a shared artifact between a human and a knowledgeable machine.</p>
                    <p>This is not autopilot. The human remains in the loop for every consequential decision. The shift is that the work of <em>retrieval, combination, and synthesis</em> moves from the human to the machine, freeing the human to do what humans do best: judgment under uncertainty.</p>

                    <h4 className="font-semibold mt-4 mb-2">2.2 The anticipatory system</h4>
                    <p>The most distinctive capability is the one that most deserves careful design: the system behaves proactively when a hazard occurs, not just reactively when a user types a prompt.</p>
                    <p><strong>Trigger sources</strong> (selective, not indiscriminate):</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>National Weather Service active warnings above defined severity thresholds</li>
                      <li>USGS earthquakes above defined magnitude</li>
                      <li>CAL FIRE and NIFC wildfire perimeter growth above defined rates</li>
                      <li>FEMA disaster declarations</li>
                      <li>NOAA tropical storm and hurricane advisories</li>
                      <li>Red Cross internal activation flags</li>
                    </ul>
                    <p><strong>Trigger logic</strong> (to avoid alarm fatigue):</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Geographic filtering by the user&rsquo;s jurisdiction, assigned area of responsibility, or subscribed regions</li>
                      <li>Role-based filtering (a chapter executive sees different triggers than a mass care lead)</li>
                      <li>Confidence thresholds &mdash; NWS tornado warnings trigger immediately; speculative storm path cone changes do not</li>
                      <li>Time-of-day and duty-status awareness (on-call vs. off-duty)</li>
                      <li>A &ldquo;quiet mode&rdquo; governed by the user, not the system</li>
                    </ul>
                    <p><strong>Proactive output</strong> is not a push notification. It is a prepared map waiting for the user when they open the app, with a short narrative &mdash; the scene that makes the difference between today&rsquo;s workflow and tomorrow&rsquo;s:</p>
                    <BQ>&ldquo;Buncombe County just received a tornado warning. I&rsquo;ve pulled the path-of-travel polygon, overlaid mobile home parks, schools, medical facilities, dialysis centers, and the top three CRCI indicators. 2,847 people live within the warning polygon; 18% are over 65, 9% have limited English. Do you want me to generate the leadership briefing draft?&rdquo;</BQ>
                    <p>The alarm-fatigue problem is the one most likely to sink this capability if handled badly. The right posture is <strong>high signal, user-controlled</strong>: the user tunes sensitivity, and the system learns from dismissals.</p>

                    <h4 className="font-semibold mt-4 mb-2">2.3 The curated checklist experience</h4>
                    <p>When a user opens a new situation &mdash; either proactively triggered or manually started &mdash; the system proposes a disaster-appropriate checklist of layers:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Tornado:</strong> path polygon, mobile home parks, schools, medical facilities, power infrastructure, elderly populations, hearing-impaired residents (many tornado deaths involve missed warnings)</li>
                      <li><strong>Wildfire:</strong> active perimeter, 24- and 72-hour projected spread, evacuation zones (with traffic conditions, closed routes, and emergency bulletins), residents with access and functional needs in the zone, air-quality-vulnerable populations (asthma, COPD), livestock operations, historical and cultural sites</li>
                      <li><strong>Hurricane pre-landfall:</strong> forecast cone, storm surge inundation, evacuation routes, shelter capacity, dialysis patients dependent on home treatment, home-oxygen patients, nursing facilities, mobile home concentrations, marinas</li>
                      <li><strong>Flood:</strong> inundation extent, downstream dam and levee inventory, water treatment facilities, agricultural impact, EPA Superfund sites (for contamination risk)</li>
                      <li><strong>Earthquake:</strong> ShakeMap, unreinforced masonry, soft-story buildings, hospitals and medical surge capacity, utility substations, school structures</li>
                      <li><strong>Winter storm:</strong> warming center inventory, homeless population, elderly living alone, power outage history, heating-fuel-dependent rural areas</li>
                      <li><strong>Public Safety Power Shutoff (California-specific):</strong> de-energization footprint, medical baseline customers, refrigeration-dependent medication users, populations with access and functional needs, Community Resource Centers</li>
                    </ul>

                    <h4 className="font-semibold mt-4 mb-2">2.4 Trust-by-design principles</h4>
                    <p>These are the principles that make the system trustworthy enough to use in consequential moments. They belong in the design, not in an afterthought appendix on risks.</p>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li><strong>Transparent reasoning.</strong> Every recommended layer carries a &ldquo;why this&rdquo; explanation. Every statistic shows its source, its vintage, and its derivation. Nothing is a black box.</li>
                      <li><strong>Human-in-the-loop by default.</strong> The system proposes; the human disposes. No automated external communications, no automated resource commitments, no automated evacuations recommended without a human affirmatively confirming.</li>
                      <li><strong>Privacy by design for vulnerable populations.</strong> Data about people with access and functional needs &mdash; disabilities, medical dependencies, language needs, age-related vulnerabilities &mdash; is aggregated and abstracted at presentation. Individual-level data (registries, medical baseline lists) is accessible only to authorized roles, logged, and never combined with open web output. The system&rsquo;s utility for these populations must never become a surveillance risk for them.</li>
                      <li><strong>Graceful degradation.</strong> If the AI layer is unreachable, the tool reverts to a strong traditional interface &mdash; the layer catalog, the checklist, the statistics &mdash; without the conversational wrapper. It should never fail silently, and it should never fail completely.</li>
                      <li><strong>Evidence traceability.</strong> Every map produced can be traced back to the layers used, the queries run, the data vintages, and the user who authored it. After-action review becomes a feature, not an extra burden.</li>
                      <li><strong>Appropriate uncertainty.</strong> When the system doesn&rsquo;t know, it says so. When the data is stale, it flags it. When two sources conflict, it shows both. Hallucinated confidence is the single most dangerous failure mode, and the system is tuned against it.</li>
                    </ol>
                  </PaperSection>

                  <PaperSection title="Part 3 — How It Works: The Conversational Workflow">
                    <h4 className="font-semibold mt-4 mb-2">3.1 The opening moment</h4>
                    <p>The user arrives at the interface &mdash; either because they opened it or because a high-signal trigger surfaced a situation. They describe what&rsquo;s happening in their own words:</p>
                    <BQ>&ldquo;Tornado touched down just east of Asheville, moving northeast. What am I looking at?&rdquo;</BQ>
                    <p>The system responds with a map, a checklist, and a short narrative. Not with a clarifying question cascade. Not with &ldquo;I&rsquo;m sorry, I need more information.&rdquo; The system is paid to make reasonable defaults, not to interview the user in the middle of a crisis.</p>

                    <h4 className="font-semibold mt-4 mb-2">3.2 The refinement loop</h4>
                    <p>The user adjusts &mdash; toggles layers, draws a polygon, asks a follow-up:</p>
                    <BQ>&ldquo;Filter to just the damage path, and show me dialysis patients specifically.&rdquo;</BQ>
                    <p>The system updates the map, produces the statistic, and volunteers what it noticed:</p>
                    <BQ>&ldquo;In the drawn polygon: 47 home-dialysis patients identified through the HIFLD dialysis center service-area overlay. These individuals will need treatment-continuity confirmation as part of the welfare-check protocol; I can queue a direct outreach to the regional dialysis network coordinator.&rdquo;</BQ>

                    <h4 className="font-semibold mt-4 mb-2">3.3 The output</h4>
                    <p>Every session can produce:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>A shareable web map with legend, author, and provenance</li>
                      <li>A short narrative summary (for leadership briefings, one page or less)</li>
                      <li>A statistical table (exportable to Excel, CSV, or Red Cross internal formats)</li>
                      <li>A PDF handout for field teams without reliable connectivity</li>
                      <li>A link-based distribution for mutual-aid partners</li>
                      <li>A machine-readable JSON payload for other systems (NG SCOUT, WebEOC successors, chapter dashboards)</li>
                    </ul>

                    <h4 className="font-semibold mt-4 mb-2">3.4 The learning loop</h4>
                    <p>The system captures, with user consent, which layers got used for which disaster types, which combinations recurred across operations, and which dismissed layers kept coming back anyway. Frequently-used patterns surface as templates. Organizational preferences accumulate. Over time, the system&rsquo;s first-pass recommendations get sharper &mdash; not because a model got smarter on its own, but because the organization&rsquo;s collective expertise got encoded.</p>

                    <h4 className="font-semibold mt-4 mb-2">3.5 A worked scripted conversation: the first thirty seconds of a tornado</h4>
                    <div className="bg-arc-cream/50 dark:bg-arc-gray-800/50 p-4 rounded space-y-3 text-[13px]">
                      <p><strong>USER</strong> (voice, hands-free in a chapter vehicle): A tornado just touched down, Buncombe County, moving northeast out of Asheville.</p>
                      <p><strong>SYSTEM</strong> (audio + map on tablet): Got it. NWS has confirmed tornado warning, polygon active, expires 4:47 PM. I pulled the warning polygon and a 1-mile buffer. Inside that footprint: 2,847 residents, 18% over 65, 9% limited-English households, 4 mobile home parks with roughly 312 units, 1 elementary school, 1 assisted living facility, 3 churches that have served as shelters historically. Map is up. Anything you want me to zoom on?</p>
                      <p><strong>USER:</strong> Mobile home parks first.</p>
                      <p><strong>SYSTEM:</strong> Zoomed. Four parks highlighted. The largest, Mountain View Estates, has 148 units and sits directly on the projected path centerline. I don&rsquo;t have current occupancy data, but average occupancy for this park type in this region is 2.4 per unit &mdash; so plan for up to 355 people potentially affected at that one location. Mountain View is 600 meters from First Baptist Asheville, which has served as a tornado shelter in past events. Do you want me to check whether First Baptist is currently a registered Red Cross shelter and whether its roof condition was assessed after the February hailstorm?</p>
                      <p><strong>USER:</strong> Yes, and tell me who&rsquo;s closest with trailers.</p>
                      <p><strong>SYSTEM:</strong> First Baptist is a pre-identified shelter, not currently activated; last inspection March 12. Regarding trailers &mdash; the nearest Emergency Response Vehicles are two ERVs in Asheville, one in Hendersonville, ETA 22 and 34 minutes respectively. Regional warehouse in Charlotte has cots and comfort kits; dispatch time from Charlotte is approximately 3.5 hours. Should I draft a resource request for the regional logistics lead?</p>
                      <p><strong>USER:</strong> Draft it but don&rsquo;t send. Also &mdash; get me the list of residents with access and functional needs who&rsquo;d need transport if we evacuate this zone.</p>
                      <p><strong>SYSTEM:</strong> Draft resource request queued in your outbox. For access and functional needs transport: I can surface the County Office of Aging&rsquo;s registered transport-dependent clients and California&rsquo;s registered accessible-transportation providers within 30 minutes&rsquo; drive &mdash; that data is role-restricted, and I have to confirm you&rsquo;re authorized to view it in this jurisdiction. Checking your credentials&hellip; confirmed. 43 residents flagged as transport-dependent inside the warning polygon. I&rsquo;m not surfacing their addresses on the map layer directly &mdash; privacy protocol &mdash; but I&rsquo;ve queued a secure export for the Mass Care lead.</p>
                    </div>
                    <p className="mt-2">That exchange took under two minutes and would replace what is today a time-consuming workflow for the typical responder &mdash; a call to the GIS cell, a polygon digitization, three attribute joins, a Red Cross personnel lookup, and a handwritten resource request.</p>
                  </PaperSection>

                  <PaperSection title="Part 4 — Architecture">
                    <h4 className="font-semibold mt-4 mb-2">4.1 Data layer</h4>
                    <p>Four sources, unified behind a semantic catalog:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Public federal:</strong> HIFLD, Census ACS and decennial, USGS hazards, NOAA weather and marine, EPA environmental, FEMA National Risk Index and CRCI, FCC broadband</li>
                      <li><strong>State and regional:</strong> Cal OES operational layers, CAL FIRE perimeters, Public Safety Power Shutoff de-energization footprints, state emergency management feeds, regional transit GTFS</li>
                      <li><strong>Organizational (Red Cross):</strong> Chapter boundaries, shelter inventory, ERV locations, volunteer deployment rosters (access-controlled), historical activation data, parcel data (Realie.ai or equivalent), and operational resource layers &mdash; trailers, supplies, feeding assets, and partner-provided resources (access-controlled)</li>
                      <li><strong>Live feeds:</strong> NWS watches and warnings, earthquake feeds, fire perimeters, active shelter status, power outage trackers (PowerOutage.us, utility-direct where available), wildfire citizen-reporting feeds (Watch Duty), traffic and road closure feeds, social signal scanning (with manual verification required before any action)</li>
                    </ul>

                    <h4 className="font-semibold mt-4 mb-2">4.2 Semantic layer catalog &mdash; the hidden workhorse</h4>
                    <p>This is where the magic lives, and where most &ldquo;conversational GIS&rdquo; efforts quietly fail.</p>
                    <p>A layer in RAPT is today labeled something like <em>&ldquo;Households with Limited English &mdash; American Community Survey 5-Year, Census Tract, 2018&ndash;2022.&rdquo;</em> That label is accurate, auditable, and close to useless for a responder asking &ldquo;who won&rsquo;t understand the warning?&rdquo;</p>
                    <p>The semantic catalog wraps every layer in structured metadata:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Natural-language aliases:</strong> &ldquo;non-English speakers,&rdquo; &ldquo;language minorities,&rdquo; &ldquo;people who need translated alerts,&rdquo; etc. map to the same layer</li>
                      <li><strong>Disaster-type relevance:</strong> this layer is high-relevance for tornado, hurricane, wildfire; medium for earthquake; low for winter storm</li>
                      <li><strong>Role relevance:</strong> this layer matters to Mass Care, less to Logistics</li>
                      <li><strong>Geographic resolution:</strong> what&rsquo;s the finest unit, what&rsquo;s the smallest defensible aggregation</li>
                      <li><strong>Data vintage and refresh cadence:</strong> when was this last updated, how often does it change</li>
                      <li><strong>Access tier:</strong> public, internal, role-restricted, privacy-restricted</li>
                      <li><strong>Known limitations:</strong> undercount groups, edge cases, common misuses</li>
                    </ul>
                    <p>This catalog is the single highest-leverage artifact in the system, and the most important one for the organization to own rather than outsource to a vendor.</p>

                    <h4 className="font-semibold mt-4 mb-2">4.3 The retrieval and reasoning layer</h4>
                    <p>Off-the-shelf retrieval-augmented generation (RAG) returns text chunks from documents. That&rsquo;s not what we need. We need retrieval that returns <em>layers</em> &mdash; spatial data with the right metadata to be combined, queried, and displayed.</p>
                    <p>The approach is three concentric rings:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li><strong>Layer retrieval:</strong> given a user&rsquo;s natural-language query and the current hazard context, rank layers by relevance using the semantic catalog. This is the step most analogous to RAG.</li>
                      <li><strong>Query construction:</strong> translate the user&rsquo;s intent into spatial operations (buffers, intersections, attribute filters, aggregations) using a constrained vocabulary that the system knows how to execute.</li>
                      <li><strong>Explanation generation:</strong> produce the user-facing narrative, with provenance and uncertainty built in.</li>
                    </ol>
                    <p>Domain-specific fine-tuning over emergency-management vocabulary is valuable here. A general-purpose model does not reliably distinguish between &ldquo;shelter&rdquo; (Red Cross mass care), &ldquo;shelter&rdquo; (wildfire evacuation), &ldquo;shelter&rdquo; (homeless services), and &ldquo;shelter-in-place&rdquo; (active threat). Operational context disambiguates.</p>

                    <h4 className="font-semibold mt-4 mb-2">4.4 The conversational interface</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Voice and text:</strong> The field use case is overwhelmingly voice-first (driving, hands on radios, gloves on). The command-post use case is text-first (noisy room, sensitive information, precision matters). Multilingual support and accessibility considerations (screen-reader compatibility, adjustable font sizing, captioned audio) are built in from the start, not retrofitted.</li>
                      <li><strong>Structured output by default:</strong> Every response has a map view, a statistics view, and a narrative view. The user chooses what to surface.</li>
                      <li><strong>Multi-turn memory within a session:</strong> The system knows you&rsquo;re talking about the same event for the duration. The system also tracks its own performance and failures during the session &mdash; which recommendations the user accepted, which they dismissed, where it got confused &mdash; so the next version of the system gets better.</li>
                      <li><strong>Session handoff:</strong> You can hand a session to a colleague with full context preserved &mdash; this is a common need at shift change.</li>
                    </ul>

                    <h4 className="font-semibold mt-4 mb-2">4.5 Real-time statistics</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Population counts within drawn or selected areas</li>
                      <li>Vulnerability indices computed on demand (CRCI, SVI, custom Red Cross indices)</li>
                      <li>Infrastructure inventories by category</li>
                      <li>Comparative statistics (this polygon vs. the county vs. the state)</li>
                      <li>Changes over time (is this population growing, shrinking, aging)</li>
                      <li>Inbound service demand signals: Red Cross requests and 911 calls for food, water, shelter, financial assistance, reunification, and related support, plotted spatially and temporally</li>
                    </ul>

                    <h4 className="font-semibold mt-4 mb-2">4.6 Map rendering and sharing</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Full ArcGIS integration for production output (AGOL items, Experience Builder apps, Dashboards)</li>
                      <li>Web viewer for field access on any device</li>
                      <li>Offline-capable mobile that syncs when connectivity returns &mdash; this is the Appalachia lesson encoded</li>
                      <li>PDF, PNG, and printed-page export for the fax-and-runner workflows that still matter in rural operations</li>
                      <li>Direct JSON/API handoff to NG SCOUT, Red Cross internal systems, and partner platforms</li>
                    </ul>
                  </PaperSection>

                  <PaperSection title="Part 5 — A Worked Scenario: A Hurricane of Helene's Scale">
                    <p>This section describes how the system is designed to operate for a Category 4 hurricane with Helene&rsquo;s profile: coastal landfall, catastrophic inland flooding, prolonged power and communications outages across mountainous terrain, and populations chronically under-served by digital recovery infrastructure. The dates, populations, and specific events below are drawn from Hurricane Helene in late September 2024. They appear as concrete grounding for what an anticipatory workflow addresses, not as a claim about retrospective detection.</p>
                    <p><strong>A framing note before the walkthrough.</strong> This system is an early-warning and situational-awareness tool, not a causal reasoning engine. It surfaces relevant information based on spatial proximity, domain-defined associations, and patterns drawn from historical analogs. It does not reason about <em>why</em> a disaster unfolds, recommend specific interventions, or imagine counterfactual alternatives. The system&rsquo;s job is to narrow the space of things worth thinking about. The thinking itself remains the responder&rsquo;s. This distinction matters especially at long forecast horizons, where uncertainty is wide and the appropriate product is a watchlist, not a prediction.</p>

                    <p><strong>Sunday, September 22 &mdash; roughly 96 hours from a possible landfall, with wide forecast uncertainty.</strong> NOAA issues its first advisory on what will become Helene. At this horizon, average track error is roughly 175 nautical miles and the 5-day cone is wide. The system flags the developing system for Red Cross division leadership across the plausible impact region (Florida, Georgia, and the Carolinas). The default proactive briefing is a watchlist, not a prediction: the current forecast cone, pre-landfall population within it (approximately 6.1 million), pre-positioned Red Cross resources by chapter, historical shelter utilization patterns from prior regional hurricanes, and the distribution of vulnerable populations across the at-risk zone. Division leadership receives a starting picture they can refine. They are not told what will happen.</p>
                    <p><strong>Tuesday, September 24 &mdash; roughly 72 hours out, cone narrowing.</strong> Each successive advisory narrows the forecast cone and sharpens the watchlist. The system updates projected shelter demand based on population density, historical storm analogs, and the current evacuation order footprint. As the western North Carolina mountain corridor emerges as a higher-confidence inland impact zone, the system surfaces what matters for that specific geography: steep terrain that amplifies flash flooding, narrow valley topology, limited road access, chronic broadband and cell coverage gaps that will complicate both warning distribution and post-event communication.</p>
                    <p><strong>Thursday, September 26 &mdash; 24 hours before landfall.</strong> The system produces division-level briefings overnight. Each Red Cross disaster operation in the projected impact zone receives a draft: shelter demand projections with confidence intervals, maps of residents needing specialized support organized by the C-MIST framework (Communication, Maintaining Health, Independence, Support and Safety, Transportation), power outage risk forecasts based on utility territory and historical restoration data, and &mdash; for Asheville specifically &mdash; a callout on water-system flood vulnerability and the roughly 155,000 residents dependent on it.</p>
                    <p><strong>Friday, September 27 &mdash; landfall and inland collapse.</strong> Cell towers begin failing across western North Carolina and southwest Virginia. The system&rsquo;s offline-capable field app, already synced to affected-area responders, continues functioning. Volunteers can still query their cached data, annotate damage on maps, and queue updates that sync when connectivity returns. When Asheville&rsquo;s water system fails, the system automatically surfaces: <em>&ldquo;Asheville water system outage. Residents served by this system: approximately 155,000, with roughly 80% of supply normally from North Fork Reservoir. Alternative potable water source inventory: [list]. Tanker logistics estimate: [number] tankers required for minimum viable supply at 1 gallon per person per day.&rdquo;</em></p>
                    <p><strong>The following days &mdash; the recovery gap.</strong> The system flags populations that are statistically likely to be undercounted in initial damage assessments. Isolated mountain communities without broadband. Households that cannot complete FEMA&rsquo;s online application. Areas where mining-legacy land use amplifies cascading risk. The system pushes these to the Recovery lead as a &ldquo;populations we have not heard from yet&rdquo; list, sorted by severity of expected impact.</p>
                    <p>The capabilities above &mdash; shelter demand forecasting, vulnerable population mapping, water system impact alerting, recovery undercount flagging &mdash; are all achievable with data and methods available today. They require integration and orientation around the non-GIS responder, not AI breakthroughs.</p>
                  </PaperSection>

                  <PaperSection title="Part 6 — Use Cases">
                    <h4 className="font-semibold mt-4 mb-2">6.1 Pre-disaster planning</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><em>&ldquo;Show me flood-risk mobile home parks in Harris County with elderly concentrations above 20%.&rdquo;</em></li>
                      <li>Tabletop exercise scenarios with pre-built vulnerability profiles</li>
                      <li>Budget planning for resource pre-positioning</li>
                      <li>Chapter-level capability gap analysis</li>
                    </ul>
                    <h4 className="font-semibold mt-4 mb-2">6.2 Active response</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Tornado touchdown &rarr; instant impact assessment (see &sect;3.5)</li>
                      <li>Wildfire evacuation &rarr; identification of residents who need accessible transport</li>
                      <li>Hurricane landfall &rarr; shelter demand projection with walk-in/drive-in modeling</li>
                      <li>Mass casualty incident &rarr; hospital capacity and access mapping</li>
                      <li>Public Safety Power Shutoff &rarr; medical baseline customer outreach targeting</li>
                    </ul>
                    <h4 className="font-semibold mt-4 mb-2">6.3 Recovery</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Damage assessment coordination with satellite and drone imagery integration</li>
                      <li>Individual assistance outreach targeting for populations statistically likely to be missed</li>
                      <li>Long-term recovery prioritization with equity overlays</li>
                      <li>Retrospective equity audit of service delivery patterns</li>
                    </ul>
                    <h4 className="font-semibold mt-4 mb-2">6.4 Mutual aid and multi-agency coordination</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Resource gap identification across jurisdictions</li>
                      <li>Surge personnel deployment mapping with skill-match overlays</li>
                      <li>Shared operational picture across Red Cross, FEMA, state, local, and partner agencies</li>
                      <li>Reduction of duplicative data calls during active operations</li>
                    </ul>
                    <h4 className="font-semibold mt-4 mb-2">6.5 Community engagement and donor communication</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Public-facing impact maps for affected residents</li>
                      <li>Volunteer recruitment targeting</li>
                      <li>Donor communication with real-time, credible impact visuals</li>
                      <li>Media briefing support with pre-cleared, sourced data</li>
                    </ul>
                  </PaperSection>

                  <PaperSection title="Part 7 — Benefits and Measurable Impact">
                    <h4 className="font-semibold mt-4 mb-2">7.1 Speed (targets, not claims)</h4>
                    <p>These speed comparisons apply to the paper&rsquo;s target user: the non-GIS responder, the occasional mapping volunteer, the chapter executive without daily tool fluency.</p>
                    <table className="w-full text-xs border border-arc-gray-200 dark:border-arc-gray-700 mt-2">
                      <thead><tr className="bg-arc-cream/50 dark:bg-arc-gray-800"><th className="p-2 text-left border-b border-arc-gray-200 dark:border-arc-gray-700">Workflow</th><th className="p-2 text-left border-b border-arc-gray-200 dark:border-arc-gray-700">Target time</th></tr></thead>
                      <tbody>
                        <tr><td className="p-2 border-b border-arc-gray-100 dark:border-arc-gray-800">Tornado warning &rarr; leadership-ready impact map</td><td className="p-2 border-b border-arc-gray-100 dark:border-arc-gray-800">Under 5 minutes</td></tr>
                        <tr><td className="p-2 border-b border-arc-gray-100 dark:border-arc-gray-800">Pre-landfall hurricane briefing for vulnerable populations</td><td className="p-2 border-b border-arc-gray-100 dark:border-arc-gray-800">Under 30 minutes</td></tr>
                        <tr><td className="p-2 border-b border-arc-gray-100 dark:border-arc-gray-800">Ad-hoc vulnerability query during operations</td><td className="p-2 border-b border-arc-gray-100 dark:border-arc-gray-800">Under 2 minutes</td></tr>
                        <tr><td className="p-2">Post-incident after-action map compilation</td><td className="p-2">Hours, not days</td></tr>
                      </tbody>
                    </table>

                    <h4 className="font-semibold mt-4 mb-2">7.2 Accessibility</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Non-GIS staff produce professional-quality maps.</li>
                      <li>New volunteers become productive on day one rather than day five.</li>
                      <li>Small jurisdictions gain capability previously available only to the largest EM offices.</li>
                      <li>Non-English-speaking responders work in their first language; the system is multilingual by design.</li>
                    </ul>

                    <h4 className="font-semibold mt-4 mb-2">7.3 Equity</h4>
                    <p>The single highest-value equity win is systematic identification of populations that current tooling misses because the tooling requires the user to know to look for them. The system encodes the question &ldquo;who else might be affected that we haven&rsquo;t thought of?&rdquo; as a default step.</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Populations with access and functional needs surfaced by default in every scenario where they&rsquo;re relevant</li>
                      <li>Language-access needs surfaced before the first press release is drafted</li>
                      <li>Rural and broadband-limited populations flagged as undercount risks</li>
                      <li>Populations with past under-service patterns highlighted in recovery prioritization</li>
                    </ul>

                    <h4 className="font-semibold mt-4 mb-2">7.4 Resource optimization</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Better-targeted supply distribution (fewer trucks to the wrong locations)</li>
                      <li>Reduced duplicate mapping work across agencies</li>
                      <li>Shared intelligence across Red Cross, FEMA, state, and local partners</li>
                      <li>Documentation artifacts produced as a byproduct of response, not as an afterthought</li>
                    </ul>

                    <h4 className="font-semibold mt-4 mb-2">7.5 Institutional knowledge preservation</h4>
                    <p>The pattern of &ldquo;the senior GIS analyst who retires and takes all the tribal knowledge with them&rdquo; is real and unsolved. This system captures that knowledge in the semantic catalog, in the disaster-type templates, and in the usage patterns that surface as the organization&rsquo;s preferred response playbook.</p>
                  </PaperSection>

                  <PaperSection title="Part 8 — Expanded Spin-offs and Adjacent Tools">
                    <p>The conversational mapping core creates a platform. Each of the following is a product that rides on top of it, sharing the data layer, the semantic catalog, and the reasoning engine.</p>
                    <h4 className="font-semibold mt-3 mb-2">Already in the original outline, sharpened</h4>
                    <ul className="list-none space-y-2 pl-0">
                      <li><strong>8.1 &mdash; After-Action Report Generator.</strong> The system already captured what layers were used, what queries were run, what polygons were drawn, and what maps were shared. AAR generation is a matter of synthesizing the record into the standard format.</li>
                      <li><strong>8.2 &mdash; Volunteer Briefing Module.</strong> A ten-minute voice-driven situation brief for new arrivals at a disaster operation.</li>
                      <li><strong>8.3 &mdash; Donor Impact Visualizer.</strong> The same core system produces donor-facing impact visuals, with sensitive data stripped and narrative framing adjusted.</li>
                      <li><strong>8.4 &mdash; Equity Audit.</strong> Retrospective analysis of service delivery patterns against vulnerability data.</li>
                      <li><strong>8.5 &mdash; Policy Simulation.</strong> What-if analysis for strategic decisions. <em>&ldquo;What happens to response time if we move the Sacramento warehouse to Fresno?&rdquo;</em></li>
                      <li><strong>8.6 &mdash; Training Simulator.</strong> Practice scenarios using the same conversational interface new responders will use in real events.</li>
                      <li><strong>8.7 &mdash; Inter-Agency Translator.</strong> Route the same question across Red Cross, FEMA, state, and local systems, reconciling the answers.</li>
                      <li><strong>8.8 &mdash; Pre-Landfall Hurricane Companion.</strong> Days-ahead vulnerability snapshots updated hourly, automated shelter-activation recommendations.</li>
                      <li><strong>8.9 &mdash; Climate Resilience Planner.</strong> Long-horizon version for hazard mitigation planning. 10, 20, 50-year vulnerability projections.</li>
                    </ul>
                    <h4 className="font-semibold mt-3 mb-2">New, higher-leverage additions</h4>
                    <ul className="list-none space-y-2 pl-0">
                      <li><strong>8.10 &mdash; Damage Assessment Copilot.</strong> Integration with satellite imagery (Maxar, Planet, NOAA post-event collections) and drone feeds.</li>
                      <li><strong>8.11 &mdash; Cross-Disaster Pattern Recognition.</strong> <em>&ldquo;This flood looks like the 2022 eastern Kentucky event &mdash; here&rsquo;s what we learned then that might apply now.&rdquo;</em></li>
                      <li><strong>8.12 &mdash; Voice-First Field Assistant.</strong> A responder in the field speaks observations: <em>&ldquo;Three houses, roof damage, moderate, Maple Street between 4th and 5th.&rdquo;</em> The system geocodes, classifies, and adds to the damage map in real time.</li>
                      <li><strong>8.13 &mdash; Responder Safety and Routing Layer.</strong> Dynamic routing that integrates washed-out roads, known landslide-prone areas, active fire perimeters, and reported hazards.</li>
                      <li><strong>8.14 &mdash; Shelter Cascade Digital Twin.</strong> If Shelter A fills, what happens? Who gets turned away, where do they go next, can Shelter B absorb the overflow?</li>
                      <li><strong>8.15 &mdash; Community-Contributed Layer System.</strong> A structured, moderated pipeline for local knowledge to become official layers.</li>
                      <li><strong>8.16 &mdash; Multilingual Outreach Engine for Underserved Populations.</strong> The system identifies language and access gaps in warning coverage and drafts culturally appropriate outreach.</li>
                      <li><strong>8.17 &mdash; Agent-Based Multi-Agency Simulation.</strong> Tabletop exercises at scale &mdash; Red Cross, FEMA, state, local, utility, hospital system, and school district agents, each with different information and priorities.</li>
                      <li><strong>8.18 &mdash; Household-Level Resilience Scoring (Opt-In).</strong> A voluntary tool where residents can register their particular vulnerabilities and get pre-incident preparedness guidance.</li>
                      <li><strong>8.19 &mdash; Ghost Shelter and Ghost Facility Detection.</strong> Cross-references declared shelter inventories against recent inspection data and post-event imagery to flag shelters that have lost functional capacity.</li>
                      <li><strong>8.20 &mdash; Misinformation and Rumor Watch.</strong> Scans local social media for emerging rumors, geolocates them, and routes them to the public information lead with suggested counter-messaging. Never auto-posts.</li>
                      <li><strong>8.21 &mdash; Medical Surge Demand Forecaster.</strong> Forecast hospital and ED demand by hour over a defined horizon, using historical analogs, weather forecasts, and population vulnerability.</li>
                      <li><strong>8.22 &mdash; Volunteer Skills Matching.</strong> The system knows which tasks at which sites need which skills, and routes assignments accordingly.</li>
                      <li><strong>8.23 &mdash; Safe-Zone Reverse Mapper.</strong> Produces safe-zone maps for evacuees, integrated with open shelter capacity, open roads, and fuel availability.</li>
                      <li><strong>8.24 &mdash; Supply Chain Cascade Alerting (aspirational).</strong> When a disaster threatens a critical supplier &mdash; IV solutions, blood products, water treatment chemicals &mdash; expand analysis to the downstream impact area.</li>
                      <li><strong>8.25 &mdash; Ephemeral Incident Command Mapping.</strong> Lightweight maps for house fires, small-scale flooding, and local displacement events &mdash; the 90% of Red Cross responses that are not major disasters.</li>
                      <li><strong>8.26 &mdash; Heat-Dome and Slow-Onset Event Monitoring.</strong> Continuously monitors heat indices, power grid stress, and vulnerable-population density, surfacing decision points before heat becomes a crisis.</li>
                      <li><strong>8.27 &mdash; Reunification and Missing Persons Support.</strong> Privacy-protected tool integrating with the American Red Cross Safe and Well framework.</li>
                      <li><strong>8.28 &mdash; Animal and Livestock Operations.</strong> Includes animal shelter capacity, livestock evacuation resources, and veterinary support, surfaced by default for fire, flood, and hurricane scenarios.</li>
                    </ul>
                  </PaperSection>

                  <PaperSection title="Part 9 — Implementation Roadmap">
                    <p>The phases below describe the <em>sequence</em> of capability development, not fixed timelines. Modern AI-assisted development compresses traditional software delivery schedules dramatically.</p>
                    <h4 className="font-semibold mt-4 mb-2">Phase 1 &mdash; Proof of Concept</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Define a minimum viable layer catalog: 40&ndash;60 layers, focused on the highest-frequency disaster types for Red Cross (home fires, severe storms, hurricanes, wildfires)</li>
                      <li>Build the conversational interface prototype on top of AGOL and custom components where platform capabilities don&rsquo;t extend</li>
                      <li>Test against three controlled scenarios: a tornado, a hurricane pre-landfall, and a Public Safety Power Shutoff</li>
                      <li>Pilot with 10&ndash;20 Red Cross GIS users across three regions, ideally one urban, one rural, one mixed</li>
                      <li>Hard success criterion: produce a defensible leadership-ready map in under 5 minutes for each scenario</li>
                    </ul>
                    <h4 className="font-semibold mt-4 mb-2">Phase 2 &mdash; Integration</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Connect live hazard feeds (NWS, USGS, NIFC, NOAA)</li>
                      <li>Integrate with existing Red Cross ArcGIS infrastructure and AGOL item library</li>
                      <li>Build the mobile/field app with offline capability</li>
                      <li>Expand layer catalog to full RAPT-equivalent breadth plus access-and-functional-needs and Red Cross-specific layers</li>
                      <li>Formal partnership conversations with FEMA and Cal OES on data access and cross-agency interoperability</li>
                    </ul>
                    <h4 className="font-semibold mt-4 mb-2">Phase 3 &mdash; Scaling</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Direct integration with NG SCOUT, WebEOC successors, and other partner common-operating-picture platforms</li>
                      <li>Public-facing variants (stripped of sensitive data) for community use</li>
                      <li>International adaptation for IFRC and other Red Cross/Red Crescent societies</li>
                      <li>Machine learning refinement from accumulated usage data</li>
                      <li>Productization decisions: which capabilities go to partners as shared infrastructure, which stay internal</li>
                    </ul>
                  </PaperSection>

                  <PaperSection title="Part 10 — Governance, Trust, and Open Questions">
                    <h4 className="font-semibold mt-4 mb-2">10.1 Data quality and currency</h4>
                    <p>The system is only as good as its underlying layers. Stale data is worse than no data because it creates false confidence. The governance answer is explicit data-lineage display on every layer, age-based staleness flagging, and an internal review cadence that funds keeping the catalog fresh rather than assuming someone else will.</p>

                    <h4 className="font-semibold mt-4 mb-2">10.2 Access equity between responding agencies</h4>
                    <p>A capability that works beautifully for the Red Cross and the largest state emergency management offices, but not for the small rural county emergency manager or the community-based organization, perpetuates the gap it&rsquo;s trying to close. The system must be tiered: a free, public-data-only variant with real capability; an organizational tier with member-specific layers; an enterprise tier for the full cross-agency common operating picture. The lowest tier must be genuinely useful, not a demo.</p>

                    <h4 className="font-semibold mt-4 mb-2">10.3 Cost and sustainability</h4>
                    <p>Real-time infrastructure is not free, and data licensing is not free. The sustainability question is unavoidable and is best answered by a consortium model: FEMA, Cal OES and peers, the Red Cross, and foundation funders share the infrastructure cost; member agencies contribute data and domain expertise; development is open where possible and proprietary only where necessary. This is not a startup waiting for an exit. It is shared civic infrastructure.</p>

                    <h4 className="font-semibold mt-4 mb-2">10.4 Automation bias</h4>
                    <p>The system is a partner, not an authority. Its outputs are recommendations, not orders. The governance answer is three-layered: (1) every output is traceable and explainable, (2) every consequential action requires human affirmation, (3) the organization trains responders in how to <em>disagree</em> with the system, which is as important as training them in how to use it.</p>

                    <h4 className="font-semibold mt-4 mb-2">10.5 Sensitive-population data</h4>
                    <p>Access and functional needs data, medical baseline registries, and individual-level vulnerability information are the highest-privacy-risk content in the system. The governance answer is roles-and-purposes access control, aggregation by default, individual data surfacing only to authorized roles with logging, and no combination with public-facing output. The system&rsquo;s utility for populations with access and functional needs must never become a surveillance risk for them.</p>
                  </PaperSection>

                  <PaperSection title="Part 11 — What's Different from What Already Exists">
                    <p>A partner reading this paper will reasonably ask: &ldquo;Isn&rsquo;t someone already building this? Isn&rsquo;t there an off-the-shelf answer?&rdquo;</p>
                    <p>The honest answer is that we don&rsquo;t know every research track underway in every agency and vendor, and some groups may well be exploring similar territory. What we can say is that significant pieces already exist, and what&rsquo;s missing is the integration, the domain-specific orientation, and the operational-partner stance.</p>
                    <table className="w-full text-xs border border-arc-gray-200 dark:border-arc-gray-700 mt-2">
                      <thead><tr className="bg-arc-cream/50 dark:bg-arc-gray-800">
                        <th className="p-2 text-left border-b border-arc-gray-200 dark:border-arc-gray-700">Capability</th>
                        <th className="p-2 text-left border-b border-arc-gray-200 dark:border-arc-gray-700">FEMA RAPT</th>
                        <th className="p-2 text-left border-b border-arc-gray-200 dark:border-arc-gray-700">Cal OES NG SCOUT</th>
                        <th className="p-2 text-left border-b border-arc-gray-200 dark:border-arc-gray-700">CA AFN Map</th>
                        <th className="p-2 text-left border-b border-arc-gray-200 dark:border-arc-gray-700">This System</th>
                      </tr></thead>
                      <tbody className="[&_td]:p-2 [&_td]:border-b [&_td]:border-arc-gray-100 dark:[&_td]:border-arc-gray-800">
                        <tr><td>Rich layer catalog</td><td>100+</td><td>Partial</td><td>Focused on vulnerable populations</td><td>Unified</td></tr>
                        <tr><td>Operational COP</td><td>&mdash;</td><td>Strong</td><td>&mdash;</td><td>Integrates</td></tr>
                        <tr><td>Specialization for vulnerable populations</td><td>Partial (CRCI)</td><td>&mdash;</td><td>Deep</td><td>First-class</td></tr>
                        <tr><td>Natural-language query</td><td>&mdash;</td><td>&mdash;</td><td>&mdash;</td><td>Domain-oriented</td></tr>
                        <tr><td>Anticipatory behavior</td><td>&mdash;</td><td>Partial</td><td>&mdash;</td><td>Core</td></tr>
                        <tr><td>Cross-agency integration</td><td>&mdash;</td><td>California only</td><td>California only</td><td>By design</td></tr>
                        <tr><td>Purpose-built for EM</td><td>Partial</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
                        <tr><td>Red Cross operational fit</td><td>Partial</td><td>&mdash;</td><td>&mdash;</td><td>Yes</td></tr>
                      </tbody>
                    </table>
                    <p className="mt-2">The gap this system fills is the diagonal that no single existing tool covers: cross-jurisdictional, domain-specific, anticipatory, vulnerable-populations-first, and oriented to the non-GIS responder as the primary user.</p>
                    <p>The posture toward existing platforms and partners is collaboration, not replacement. This system runs on the ArcGIS platform, draws from Living Atlas and the federal and state data sources that FEMA, Cal OES, and peer agencies already maintain, and integrates with operational common-operating-picture platforms rather than duplicating them.</p>
                  </PaperSection>

                  <PaperSection title="Part 12 — Call to Action">
                    <h4 className="font-semibold mt-4 mb-2">12.1 Why now</h4>
                    <p>Three conditions have converged:</p>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li><strong>AI capability crossed a threshold.</strong> Language models are now capable of the reasoning, retrieval, and explanation required for this to work. Two years ago they were not. Two years from now, the organizations that built on this threshold will have a durable advantage; the organizations that waited will be catching up.</li>
                      <li><strong>Disaster frequency and severity are rising.</strong> The response community cannot keep up by adding more analysts. The work has to get more leveraged, and the only way to get more leveraged is better tooling.</li>
                      <li><strong>Existing tools haven&rsquo;t kept pace with need.</strong> RAPT, NG SCOUT, and California&rsquo;s Access and Functional Needs Web Map are excellent at what they were designed to do. They were designed for an era when the user was a GIS professional and the goal was visualization. The era we&rsquo;re in needs something different.</li>
                    </ol>

                    <h4 className="font-semibold mt-4 mb-2">12.2 What we&rsquo;re doing &mdash; and what collaboration looks like</h4>
                    <p>We are not waiting for permission to build this. We have the skills, the tools, and the data access to develop a working proof-of-concept ourselves, and we intend to. What collaborators bring is not a green light &mdash; it&rsquo;s depth and reach:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Operational validation.</strong> Real responders using the prototype in real exercises, telling us what works and what doesn&rsquo;t.</li>
                      <li><strong>Data partnerships.</strong> Formal access arrangements for layers currently behind governance walls.</li>
                      <li><strong>Domain expertise.</strong> The encoded knowledge that turns a generic mapping tool into a trusted partner lives in the heads of emergency preparedness specialists, disability advocates, and long-tenured responders. Getting that knowledge into the semantic catalog requires their time and trust.</li>
                      <li><strong>Distribution.</strong> A tool that lives only on a developer&rsquo;s laptop helps no one. Scaling into Red Cross operations, state emergency management offices, and community-based organizations requires institutional adopters.</li>
                      <li><strong>Funding for sustainability.</strong> Initial proof-of-concept is achievable with modest resources. Ongoing data licensing, infrastructure, and maintenance will require a sustainable model.</li>
                    </ul>
                    <p>The delivery model is an open question. Paths worth considering include:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Partnership with existing agencies.</strong> FEMA&rsquo;s Resilience Analysis Branch, Cal OES GIS Division, American Red Cross operational regions, and platform vendors collaborating on shared civic infrastructure.</li>
                      <li><strong>University GIS program development.</strong> A research partnership with a university GIS program &mdash; Penn State, the University of Redlands, the University of Southern California Spatial Sciences Institute, the University of Maine, or others &mdash; combining graduate research capacity with operational validation.</li>
                      <li><strong>Private enterprise.</strong> A mission-aligned private developer building the capability under contract or as a product, with governance and access terms that protect the humanitarian mission.</li>
                      <li><strong>Hybrid.</strong> Some combination &mdash; core platform developed by one stakeholder, domain catalog maintained by a consortium, operational deployment through Red Cross and partners.</li>
                    </ul>
                    <p>The right answer is a decision to make together, informed by what the proof-of-concept reveals.</p>

                    <h4 className="font-semibold mt-4 mb-2">12.3 The next step</h4>
                    <p>Build the proof-of-concept. Pilot it against one real-world scenario with one operational region. Share the results &mdash; what worked, what didn&rsquo;t, what we learned about the data, the workflow, the users. Then, with evidence in hand rather than a deck full of promises, open the conversations about scaling, delivery model, and partnership structure.</p>
                  </PaperSection>

                  <PaperSection title="Appendix A — Additional Scripted Conversations">
                    <h4 className="font-semibold mt-4 mb-2">A.1 Pre-landfall hurricane, 48 hours out</h4>
                    <div className="bg-arc-cream/50 dark:bg-arc-gray-800/50 p-4 rounded space-y-3 text-[13px]">
                      <p><strong>USER:</strong> Helene track update &mdash; what changed?</p>
                      <p><strong>SYSTEM:</strong> NHC 11 PM advisory shifted the landfall cone 40 miles east. That moves the projected wind swath to include Tallahassee&rsquo;s southeast suburbs. New population in the Category 3+ wind zone: 187,000, up 34,000 from the previous advisory. Vulnerable populations in the new-inclusion area: 11,200 older adults, 2,300 with mobility-assistive-device dependence. Three additional nursing facilities are now in-zone; I&rsquo;ve flagged them for the Mass Care lead and prepared evacuation-support requests. Want me to proactively reach out to the two chapters whose territories just expanded?</p>
                      <p><strong>USER:</strong> Draft the outreach. And tell me about hospitals.</p>
                      <p><strong>SYSTEM:</strong> Outreach drafted, queued for your review. Hospitals: five acute-care facilities now in the Category 3+ zone, total 1,100 licensed beds. Two are on the state&rsquo;s &ldquo;shelter in place&rdquo; pre-plan list; three have evacuation obligations. The closest receiving hospitals with capacity are in Valdosta and Albany. Ground ambulance transport time from Tallahassee to Albany runs 90&ndash;110 minutes under normal conditions; under pre-landfall conditions it has historically doubled. Do you want me to surface the Florida Health Care Coalition&rsquo;s evacuation coordination dashboard?</p>
                    </div>

                    <h4 className="font-semibold mt-4 mb-2">A.2 Small-chapter home fire, 11 PM on a Tuesday</h4>
                    <div className="bg-arc-cream/50 dark:bg-arc-gray-800/50 p-4 rounded space-y-3 text-[13px]">
                      <p><strong>USER:</strong> Three-alarm house fire, 847 Maple Street. Family of five displaced.</p>
                      <p><strong>SYSTEM:</strong> Got it. Pulled the parcel &mdash; single-family, assessed $186K, built 1963. Family composition from public records not available; fire department report will have verified info. Nearest three Red Cross partner hotels with current availability: Comfort Inn (0.8 miles, pet-friendly), Hampton Inn (1.4 miles, pet-friendly), Days Inn (2.1 miles, pet-friendly). Nearest open grocery for emergency purchases: Kroger, 0.9 miles, open 24 hours. I have DR-ready casework templates for family-of-five loaded. Want me to prep the casework draft while you drive?</p>
                      <p><strong>USER:</strong> Yes. And are there other recent fires in that neighborhood?</p>
                      <p><strong>SYSTEM:</strong> Three structure fires within 0.5 miles in the last 18 months. None with Red Cross engagement on record. Two of the three involved rental units &mdash; might be worth a note to the preparedness team for future community outreach targeting.</p>
                    </div>

                    <h4 className="font-semibold mt-4 mb-2">A.3 Retrospective equity audit, quarterly review</h4>
                    <div className="bg-arc-cream/50 dark:bg-arc-gray-800/50 p-4 rounded space-y-3 text-[13px]">
                      <p><strong>USER:</strong> Show me our last quarter&rsquo;s residential fire responses, and tell me if we served everyone equally.</p>
                      <p><strong>SYSTEM:</strong> 247 residential fire responses last quarter across the division. Mapping now. Overlaying against census demographics at the block-group level: response times were 12% longer on average in block groups with median household income below the regional 25th percentile. Case financial assistance amounts showed no statistically significant demographic variation once family size was controlled for. One chapter &mdash; I&rsquo;ll tell you which one privately &mdash; had a response-time pattern that warrants investigation; it may reflect staffing or geography, not bias, but it&rsquo;s worth a closer look. Want me to generate the full equity audit report?</p>
                    </div>
                  </PaperSection>

                  <PaperSection title="Appendix B — Data Flow for a Typical Tornado Session">
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>NWS issues tornado warning polygon via CAP feed.</li>
                      <li>System ingests polygon, applies geographic and role-based filtering to identify affected users.</li>
                      <li>For triggered users: system retrieves default tornado-response layer set from semantic catalog.</li>
                      <li>System performs spatial operations: population counts, mobile-home-park intersection, school and medical facility identification, CRCI overlay, transport-dependent resident count (role-gated).</li>
                      <li>System generates narrative summary with provenance metadata.</li>
                      <li>Map, stats, and narrative delivered to user interface; session opens.</li>
                      <li>User interactions (toggles, polygons, follow-up questions) update map state and refine statistics in real time.</li>
                      <li>Session artifacts (map, stats, narrative, user actions, layer provenance) persisted for AAR generation.</li>
                      <li>On session close, artifacts available for export and handoff.</li>
                    </ol>
                  </PaperSection>

                  <p className="text-xs italic text-arc-gray-500 dark:text-arc-gray-300 border-t border-arc-gray-100 dark:border-arc-gray-700 pt-4 mt-4">Document version 2.6. Prepared for Red Cross strategic review. A strategic white paper for FEMA, Cal OES, the American Red Cross, and their partners.</p>

                  <div className="mt-4 text-[11px] font-data uppercase tracking-wider text-arc-gray-500 dark:text-arc-gray-300">
                    <a
                      href="/before-you-even-ask.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-arc-black dark:hover:text-arc-cream transition-colors"
                    >
                      Download PDF version &rarr;
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
