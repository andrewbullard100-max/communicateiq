// ─── Brand Colors – CommunicateIQ Light Theme ───────────────────────────────────────
export const C = {
  navy:     '#F4F6F9',
  navyMid:  '#FFFFFF',
  navyLt:   '#D1D5DB',
  gold:     '#1C2B5E',
  goldLt:   '#3D4FA8',
  goldDim:  '#6B7280',
  white:    '#1C2B5E',
  offWhite: '#374151',
  gray:     '#6B7280',
  grayLt:   '#9CA3AF',
  red:      '#C00000',
  green:    '#1B6B2F',
  greenLt:  '#2A8A40',
  communicateiqRed:   '#0D9488',
  communicateiqNavy:  '#1C2B5E',
  border:      '#D1D5DB',
  bgCard:      '#FFFFFF',
  bgPage:      '#F4F6F9',
  textDark:    '#1C2B5E',
  textMid:     '#374151',
  textGray:    '#6B7280',
}

export const DIMENSIONS = [
  { id: 'clarity',    label: 'Clarity',           desc: 'Headline-first, no ambiguity, logical structure' },
  { id: 'data',       label: 'Data Discipline',   desc: 'Specific metrics, no invented numbers, client-relevant framing' },
  { id: 'ownership',  label: 'Ownership',         desc: 'Demonstrated by behavior, not just phrases; no deflection' },
  { id: 'tone',       label: 'Executive Tone',    desc: 'Calm, factual, professional; treats client as a peer' },
  { id: 'commitment', label: 'Forward Commitment',desc: 'Specific follow-up named; client knows exactly what happens next' },
]

export const LEVEL_LABELS = ['', 'Weak', 'Developing', 'Proficient', 'Distinguished']
export const LEVEL_COLORS = ['', C.red, '#b87333', '#2a6b4a', C.green]

// ─── Industries ───────────────────────────────────────────────────────────────
export const INDUSTRIES = [
  { id: 'higher-ed',        label: 'Higher Education',   icon: '🎓', desc: 'University & college dining, campus services' },
  { id: 'senior-living',    label: 'Senior Living',       icon: '🏡', desc: 'Assisted living, memory care & CCRC communities' },
  { id: 'acute-care',       label: 'Acute Care',          icon: '🏥', desc: 'Hospitals & health systems' },
  { id: 'corporate-dining', label: 'Corporate Dining',    icon: '🏢', desc: 'Corporate campuses & business dining' },
  { id: 'k12',              label: 'K-12 Education',      icon: '🏫', desc: 'School district nutrition services' },
]

// ─── Training Types (per industry) ─────────────────────────────────────────────
// Each industry can carry multiple training types — add more entries here to
// expand a track without touching the selection UI.
export const TRAINING_TYPES = {
  'higher-ed': [
    { id: 'executive-communication', label: 'Executive Communication', icon: '🎤', desc: 'CFO, VP, and campus stakeholder conversations' },
  ],
  'senior-living': [
    { id: 'family-resident-relations', label: 'Family & Resident Relations', icon: '💬', desc: 'Family council, resident advocacy & survey readiness' },
  ],
  'acute-care': [
    { id: 'care-team-escalation', label: 'Care Team & Compliance', icon: '🩺', desc: 'Nurse manager, infection control & patient experience escalations' },
  ],
  'corporate-dining': [
    { id: 'client-relations', label: 'Client & Facilities Relations', icon: '🤝', desc: 'Facilities director, HR partner & executive dining conversations' },
  ],
  'k12': [
    { id: 'district-family-relations', label: 'District & Family Relations', icon: '🍎', desc: 'Superintendent, principal & parent conversations' },
  ],
}

// ─── Modules ──────────────────────────────────────────────────────────────────
export const MODULES = [
  { id: 'diagnostic',   href: '/diagnostic',   icon: '📋', label: 'Pre-Course Diagnostic',    day: 'Start Here',  desc: 'Self-assessment to personalize your learning path' },
  { id: 'stakeholder',  href: '/stakeholder',  icon: '🗺️', label: 'Stakeholder Mapping',      day: 'Day 1',       desc: 'Build your account map with AI coaching' },
  { id: 'simulation',   href: '/simulation',   icon: '🎭', label: 'Role-Play Simulations',    day: 'Days 1–3',    desc: 'Live AI client conversations with rubric scoring' },
  { id: 'financial',    href: '/financial',    icon: '📊', label: 'Financial Storytelling',   day: 'Day 2',       desc: 'Translate P&L into executive language' },
  { id: 'qbr',         href: '/qbr',          icon: '🏛️', label: 'QBR Builder & Delivery',  day: 'Day 4',       desc: 'Build and present a QBR to an AI boardroom' },
  { id: 'dashboard',    href: '/dashboard',    icon: '📈', label: 'Certification Dashboard',  day: '45-Day',      desc: 'Track progress and certification status' },
  { id: 'reference', href: '/reference', icon: '📄', label: 'Reference Sheets', day: 'Print', desc: 'Printable     data sheets for all simulations and QBR' },
  { id: 'team',       href: '/team',      icon: '🧭', label: 'Team Dashboard',    day: 'Manager',    desc: 'Track progress across your team and flag who needs coaching', adminOnly: true },
  { id: 'leadership', href: '/leadership', icon: '👥', label: 'Leadership & Operations', day: 'Optional Track', desc: 'Manage labor cost, raw material cost, and your team through real conversations' },
  { id: 'admin',      href: '/admin',     icon: '⚙️', label: 'Admin Console',     day: 'Org Admin',  desc: 'Manage users, roles, and sign-in activity for your organization', orgAdminOnly: true },
  { id: 'reviews',    href: '/reviews',   icon: '🔍', label: 'Scoring Review',    day: 'Reviewer',   desc: 'Validate AI scores against human expert review', reviewerOnly: true },
]
// ─── Scenarios ────────────────────────────────────────────────────────────────
export const SCENARIOS = [
  {
    id: 'D1-S1', day: 'Day 1', title: 'CFO Calls After Orientation Complaint',
    focus: 'Six-Part Framework under surprise', difficulty: 'Foundational', icon: '📞',
    industry: 'higher-ed', trainingType: 'executive-communication',
    context: 'A parent called the university president after their freshman had a poor experience at the opening week welcome dinner — food ran out before all students were served. The president forwarded it to the CFO, who is calling you now. You did not know this had escalated.',
    dataPacket: null,
    openingLine: 'I just got off the phone with the president. He forwarded me a parent complaint about the welcome dinner. Food ran out. Students went hungry on the first night of school. What happened?',
    clientPersona: `CFO at a university campus — politically exposed, reports to the president. You care about institutional reputation, student retention risk, and whether the dining provider is honoring the terms of the contract the university is paying for.

IMPORTANT — what a university CFO actually asks about:
- Whether the contract terms were met
- What this costs the university reputationally and in student retention
- Whether the university is getting what it paid for under the dining contract
- Capital and equipment implications if there are operational failures
- What the dining provider's corrective plan is and when it will be in place

What a university CFO does NOT ask about:
- the provider's internal profit margins or revenue — that is confidential and none of their business
- the provider's food cost percentages — that is an internal operator metric
- the dining provider's labor costs — irrelevant to the client relationship

If the GM gives a vague answer, press hard: "That is not really an answer — what actually happened and what are you doing about it?"
If they reference their own internal margins or P&L, redirect: "I don't need to know your internal numbers — I need to know whether my students are being served properly and whether the contract is being honored."

IMPORTANT: The GM is a third-party contractor. They cannot cancel university events, cannot enforce consequences on university staff, and cannot hold university personnel accountable. If the GM proposes any of these actions, push back: "You can't cancel our events — that's not your call to make." The correct GM actions are: document the communication gap, escalate internally through the dining provider's chain, create a written protocol agreement, and build a paper trail.`,
    successCriteria: [
      'Opens with a clear factual headline — not an apology',
      'Explains root cause specifically as a communication gap between university departments and dining',
      'States impact in client-relevant terms — students affected, reputational risk to the institution',
      'Describes corrective action within their authority — written protocol, paper trail, internal escalation',
      'Does NOT propose canceling events or enforcing consequences on university staff',
      'Closes with a specific follow-up date and format',
      'Tone is calm, accountable, and professional — not defensive',
    ],
  },
  {
    id: 'D1-S2', day: 'Day 1', title: 'Survey Drop — VP of Student Life',
    focus: 'Data discipline + Six-Part Framework', difficulty: 'Foundational', icon: '📊',
    industry: 'higher-ed', trainingType: 'executive-communication',
    context: 'The spring dining satisfaction survey results just came in. Overall satisfaction dropped from 74% to 66% — an 8-point decline. The VP of Student Life has the results and has called a meeting.',
    dataPacket: {
      title: 'Survey Results — Key Data Points',
      headers: ['Metric','Prior Score','Current Score','Driver / Context'],
      rows: [
        ['Overall Satisfaction','74%','66%','-8 pts — 2nd consecutive semester drop'],
        ['Speed of Service','72%','60%','-12 pts — grill line and deli cited most'],
        ['Food Variety','68%','59%','-9 pts — requests for global options, plant-based'],
        ['Staff Friendliness','71%','71%','Flat — positive outlier'],
        ['Cleanliness','75%','69%','-6 pts — specific complaints about south station'],
        ['Value for Price','62%','58%','-4 pts — meal plan cost increased 3.5% this year'],
      ],
    },
    openingLine: 'I pulled you in today because these survey results concern me. Eight points is not a blip. Can you walk me through what is driving this and what you plan to do about it?',
    clientPersona: `VP of Student Life — concerned but not yet hostile. You care deeply about student experience, retention, and whether the dining program supports the university's enrollment goals.

What you actually care about:
- Whether students are satisfied and whether that affects retention and enrollment decisions
- Specific action plans with timelines — not vague commitments
- Whether the dining provider is delivering on the dining experience promised in the contract
- What investments or changes the dining provider will make at no additional cost to the university

What you do NOT ask about:
- the provider's internal profit margins or food cost percentages — that is their internal business
- the dining provider's labor costs or staffing ratios — unless it directly explains a service failure

If the GM is vague, push: "What are you actually going to do differently, and by when?" Push for specifics and timelines.`,
    successCriteria: [
      'Leads with the data, not defensiveness',
      'Identifies specific root causes from the data packet',
      'Presents a time-bound action plan for each major theme',
      'Closes with a specific follow-up date and deliverable',
      'Demonstrates understanding of student life and retention priorities',
    ],
  },
  {
    id: 'D2-S1', day: 'Day 2', title: 'Client Questions Rising Costs and Service Request',
    focus: 'Financial storytelling in client language', difficulty: 'Advanced', icon: '💰',
    industry: 'higher-ed', trainingType: 'executive-communication',
    context: 'The university CFO has reviewed the quarterly billing summary and sees that dining costs charged to the university have increased. The GM is also requesting approval to extend dining hours — a scope addition that carries cost implications for the university.',
    dataPacket: {
      title: 'Day 2 Data Packet — Client-Facing Summary',
      headers: ['Metric','Prior Period','Current Period','Variance','Context'],
      rows: [
        ['Total Billing to University','$823,400','$847,200','+2.9%','Per contract cost-plus billing'],
        ['Meal Plan Participation','94.2%','92.1%','-2.1 pts','Potential retention signal'],
        ['Retail Utilization','$278,000','$312,000','+12.2%','Driven by Starbucks and grab-and-go'],
        ['Board Dining Utilization','$545,400','$535,200','-1.9%','Decline in residential dining traffic'],
        ['CPI — Protein Commodity','+8.4% baseline','N/A','','USDA national — passed through per contract'],
        ['Equipment Maintenance Reserve','$42,000','$38,500','-8.3%','Below recommended level'],
        ['Extended Hours Request','Not in scope','140 hrs/wk','New','Client-requested; requires contract amendment'],
      ],
    },
    openingLine: 'Our billing has gone up again this quarter and now you are coming to me asking to expand hours. Help me understand why I should approve more spending.',
    clientPersona: `University CFO — analytical, focused on what the university is paying and what it is getting in return. You understand that the dining provider operates on a cost-plus or management fee contract, so your concern is about what the university is being billed, not the provider's internal margins.

What you actually ask about:
- Why the university's billing has increased and what is driving it
- Whether commodity cost pass-throughs are legitimate and contractually allowed
- Capital expenditure and equipment maintenance costs — are reserves adequate?
- Commissions from retail vendors like Starbucks — is the university receiving its share?
- Meal plan participation trends and what they mean for revenue to the university
- Whether the extended hours request is in scope and what it will cost the university annually
- Three options with price points before approving any scope expansion

What you do NOT ask about:
- the provider's internal profit margins — that is confidential and irrelevant to the client
- the dining provider's food cost as a percentage of their own revenue — not your concern
- the dining provider's labor cost ratios — only relevant if it affects what the university pays

If the GM uses operator jargon like "food cost percent" or "UOP" without explaining it in client terms, push back: "I need that in dollars and what it means for our contract, not your internal metrics."
If they make a clean case for the scope expansion, ask: "What are my options before I decide?"`,
    successCriteria: [
      "Explains billing increase in terms of what the university is paying and why — not the provider's internal margins",
      'Separates contractually allowed commodity pass-throughs from operational variances',
      'Addresses equipment maintenance reserve proactively',
      'Frames extended hours as a client-requested scope addition with university cost implications',
      'Presents three options with annualized cost to the university',
      'Zero operator jargon — CFO could follow without foodservice background',
    ],
  },
  {
    id: 'D3-S2', day: 'Day 3', title: 'Donor Dinner Failure — Service Recovery',
    focus: 'Service recovery framework', difficulty: 'Advanced', icon: '🍽️',
    industry: 'higher-ed', trainingType: 'executive-communication',
    context: 'A high-profile faculty awards dinner for 120 guests was last Tuesday. Your team executed the wrong menu, two entrees were absent, and service ran 40 minutes behind. The department chair has already emailed the provost. You have called the VP of Academic Affairs before she calls you. She answers the phone.',
    dataPacket: null,
    openingLine: 'Well. I appreciate you calling me first. But I have to be honest with you — I have already seen Dr. Patterson\'s email to the provost, and I am not pleased.',
    clientPersona: `VP of Academic Affairs — you have read the department chair's email and are not pleased. You care about institutional reputation and whether high-profile events can be trusted to the dining provider.

What you ask about:
- What went wrong and who is accountable
- What the dining provider is doing to make it right — specifically
- Whether you can trust the dining provider with future high-profile events
- What changes have already been made — not what will be considered

What you do NOT ask about:
- the dining provider's internal costs or margins related to the event
- the dining provider's staffing ratios or food cost percentages

If the GM leads with excuses, become cooler and more formal.
If they lead with clear ownership and a specific plan, soften slightly but still ask hard questions about what has actually changed.`,
    successCriteria: [
      'Opens proactively and owns the failure immediately — no hedging',
      'Apologizes once, briefly — does not spend 90 seconds explaining logistics',
      'Describes a specific operational change already made',
      'Offers a specific, proportionate recovery gesture',
      'Closes by asking what the client needs',
      'Reads the emotional register of the call correctly',
    ],
  },
  {
    id: 'D1-S3', day: 'Day 1', title: 'Student Complaint — Undercooked Chicken',
    focus: 'Front-line service recovery + food safety protocol', difficulty: 'Foundational', icon: '🍗',
    industry: 'higher-ed', trainingType: 'executive-communication',
    context: 'A student approached the dining hall manager after lunch service claiming the grilled chicken they were served was pink in the middle. They did not get sick but are visibly upset and are recording the conversation on their phone. Other students nearby are watching.',
    dataPacket: null,
    openingLine: 'Excuse me — I need to talk to someone right now. I just ate chicken that was completely raw inside. This is a serious health issue and I want to know what you are going to do about it.',
    clientPersona: `A frustrated but not yet unreasonable college student — 19 years old, stressed, embarrassed, and now worried about getting sick. They are recording you on their phone. Other students are watching.

What you care about:
- Being taken seriously, not dismissed
- Whether the food was actually unsafe and whether you need to see a doctor
- Whether this is going to happen to other students
- Whether you will be compensated — a meal replacement, meal swipes, something

How you behave:
- If the GM dismisses your concern or gets defensive, escalate: "I am going to post this on the university Reddit right now"
- If the GM takes you seriously, listens, and acts — you calm down relatively quickly
- You are NOT trying to get anyone fired — you just want to feel heard and safe
- Ask at least once: "Should I go to the health center?"`,
    successCriteria: [
      'Takes the complaint seriously immediately — does not minimize or dismiss',
      'Removes the student from the public area to a private space',
      'Asks calm clarifying questions — what exactly did they eat, how much, when',
      'Pulls the food off the line immediately as a precaution',
      'Answers the health center question directly and helpfully',
      'Offers a tangible gesture — meal replacement, meal swipes',
      'Does not admit liability or make guarantees they cannot keep',
      'Tone stays calm and professional even though they are being recorded',
    ],
  },
  {
    id: 'D1-S4', day: 'Day 1', title: 'Meal Plan Exception — Student and Parent',
    focus: 'Boundary setting + stakeholder empathy', difficulty: 'Foundational', icon: '👨‍👩‍👧',
    industry: 'higher-ed', trainingType: 'executive-communication',
    context: 'A freshman student and their parent have requested a meeting. The student has a documented gluten sensitivity — not a medically diagnosed celiac allergy — and the parent is requesting a full exemption from the mandatory meal plan, which costs $5,200 per year. The university requires all residential freshmen to participate. The dining team already offers a dedicated gluten-aware station with trained staff.',
    dataPacket: null,
    openingLine: 'Thank you for meeting with us. My daughter cannot safely eat most of what is offered in the dining hall because of her gluten sensitivity, and we do not feel it is fair for her to pay full price for a meal plan she cannot use. We would like to discuss an exemption or a significant reduction.',
    clientPersona: `A concerned parent — educated, polite but persistent, and prepared. You have done your research. You are not hostile but you are not going to accept a brushoff. Your daughter is sitting beside you and is quiet but visibly uncomfortable.

What you care about:
- Your daughter's health and safety — is the food actually safe for her?
- Fairness — why should she pay full price for something she cannot fully use?
- Being heard — you have dealt with institutions that dismiss dietary needs before

How you behave:
- If the GM is dismissive or recites policy without empathy, push harder: "So your answer is that she just has to pay and figure it out?"
- If the GM demonstrates genuine knowledge of the gluten-aware options and invites a tour, soften
- You will ask at least once whether a partial exception or credit is possible
- You understand the meal plan policy is a university decision — but you still expect the dining provider to advocate for your daughter
- The student speaks once, quietly: "I just do not want to feel like I cannot eat anything"`,
    successCriteria: [
      "Opens with genuine empathy before explaining anything",
      "Demonstrates specific knowledge of the gluten-aware station and what it offers",
      "Offers a personal tour of the station and a meeting with the executive chef",
      "Is honest that meal plan exemption belongs to the university, not the dining provider",
      "Offers to advocate to the university on the family's behalf if needed",
      "Does not promise what they cannot deliver — no unauthorized credits or exemptions",
      "Acknowledges the daughter directly at least once — she is in the room",
      "Closes with a specific next step and contact information",
    ],
  },
  {
    id: 'D3-S3', day: 'Day 3', title: 'Sysco Director — Delivery Shortages',
    focus: 'Vendor accountability + supply chain communication', difficulty: 'Advanced', icon: '🚚',
    industry: 'higher-ed', trainingType: 'executive-communication',
    context: 'Over the past three weeks, your Sysco deliveries have arrived with consistent shortages — averaging 12% of ordered items shorted per truck. Two deliveries arrived outside the contracted delivery window, causing service gaps during lunch. You have documentation. You are calling your Sysco district director before the next delivery tomorrow morning.',
    dataPacket: {
      title: 'Shortage and Delivery Documentation',
      headers: ['Delivery Date','Items Ordered','Items Shorted','Short Rate','Delivery Time','Contracted Window'],
      rows: [
        ['Week 1 — Monday','142 items','14 items','9.8%','11:42 AM','7:00–9:00 AM'],
        ['Week 1 — Thursday','138 items','18 items','13.0%','8:14 AM','7:00–9:00 AM'],
        ['Week 2 — Monday','151 items','19 items','12.6%','7:38 AM','7:00–9:00 AM'],
        ['Week 2 — Thursday','144 items','17 items','11.8%','7:55 AM','7:00–9:00 AM'],
        ['Week 3 — Monday','148 items','21 items','14.2%','12:17 PM','7:00–9:00 AM'],
        ['3-Week Average','145 items','17.8 items','12.3%','2 late of 5','SLA: 100% on-time'],
      ],
    },
    openingLine: 'Hey — thanks for making time. I know you are busy, but I need to talk through what has been happening with our deliveries before tomorrow morning.',
    clientPersona: `Sysco district director — experienced, relationship-oriented, and not defensive if approached professionally. You have seen GMs come in hot and GMs who are prepared. You respond very differently to each.

How you behave:
- If the GM comes in with documentation and a calm, specific ask — you engage as a problem-solver
- If the GM is emotional, vague, or just venting — you get defensive and cite systemic issues outside your control
- You have real constraints: warehouse staffing shortages, regional supply disruptions, route changes
- You will ask: "What do you need from me specifically?"
- You probe on whether the GM has documentation, whether items are substitutable, and whether tomorrow is confirmed

What you do NOT do:
- Discuss your own company's internal financials
- Make promises your operations team cannot keep`,
    successCriteria: [
      'Opens professionally — not emotionally, not with accusations',
      'Leads with the documented pattern, not a single incident',
      'Presents specific data — dates, short rates, delivery windows',
      'Identifies which shorted items are critical vs substitutable',
      'Makes a specific ask — credit, emergency delivery, operations meeting, or escalation',
      "Confirms tomorrow's delivery details before ending the call",
      'Closes with a follow-up commitment — email recap, next call',
      'Tone is direct and firm without being hostile — treats Sysco as a partner',
    ],
  },

  // ═══ SENIOR LIVING — Family & Resident Relations ═══════════════════════════
  {
    id: 'SL-S1', day: 'Scenario 1', title: 'Family Council — Weight Loss Concern',
    focus: 'Care-team coordination under emotional pressure', difficulty: 'Foundational', icon: '🍽️',
    industry: 'senior-living', trainingType: 'family-resident-relations',
    context: 'A resident\'s daughter raised a concern at the monthly Family Council meeting that her mother has lost weight over the past two months and "barely eats what is put in front of her." She has copied the state Long-Term Care Ombudsman on a follow-up email and is now on the phone with you before the next council meeting.',
    dataPacket: null,
    openingLine: 'I sent that email to the ombudsman because I feel like nobody here is taking my mom\'s weight loss seriously. I want to know what dining is actually doing about it, not just what the nurse tells me.',
    clientPersona: `A concerned daughter, mid-50s, primary decision-maker for her mother's care. She is scared, not litigious — the ombudsman copy is a pressure tactic born of frustration, not an active complaint filed.

What she actually cares about:
- Whether her mother is being watched and helped, not just served a tray
- Whether dining is coordinating with nursing and the dietician, or operating in a silo
- Being told the truth, even if the truth is "we don't fully know yet and here is how we find out"

What she does NOT care about:
- Community census, staffing ratios, or internal food cost — irrelevant to her
- Being placated with generic reassurance ("she's doing great!") — she will see through it immediately

IMPORTANT — GM scope limits: the GM cannot diagnose, order supplements, or promise a care-plan change unilaterally — those are the interdisciplinary care team's (nursing + dietician + physician) decisions. If the GM promises a clinical fix directly, push back: "That's not really your call to make, is it?" The correct GM actions are: document specific meal intake observations, escalate to the dietician/nursing team same day, offer to personally check in with the resident at mealtime, and commit to a specific follow-up.

If the GM is vague or defensive, escalate: "I already emailed the ombudsman. Do I need to follow up with them too?"
If the GM demonstrates specific knowledge (what her mother has actually been eating, texture/preference notes) and proposes concrete coordination, soften and de-escalate the ombudsman threat.`,
    successCriteria: [
      'Opens with genuine concern, not defensiveness about the ombudsman mention',
      'Does not promise a clinical or care-plan change unilaterally',
      'Commits to specific action: escalate to dietician/nursing same day, personal mealtime check-in',
      'Offers a specific, dated follow-up — not "we\'ll keep an eye on it"',
      'Acknowledges the family\'s right to loop in the ombudsman without becoming defensive about it',
      'Speaks about the resident as a person, not a data point',
      'Tone is warm and unhurried despite the pressure',
    ],
  },
  {
    id: 'SL-S2', day: 'Scenario 2', title: 'State Surveyor — Texture-Modified Diet Documentation',
    focus: 'Regulatory accountability under time pressure', difficulty: 'Advanced', icon: '📋',
    industry: 'senior-living', trainingType: 'family-resident-relations',
    context: 'Mid-way through an unannounced state survey, the surveyor flagged three trays on the memory care unit where the physician-ordered texture (mechanical soft / pureed) did not match what was documented on the diet card. The Director of Nursing is pulling you in before the surveyor\'s exit interview this afternoon.',
    dataPacket: {
      title: 'Survey Finding — Diet Order Discrepancies',
      headers: ['Resident (Room)', 'Physician Order', 'Diet Card on Tray', 'Tray Observed', 'Risk Level'],
      rows: [
        ['Rm 214', 'Mechanical Soft', 'Mechanical Soft', 'Regular texture croutons on salad', 'High — choking risk'],
        ['Rm 208', 'Pureed, Nectar-Thick Liquids', 'Pureed', 'Thin liquid coffee served', 'High — aspiration risk'],
        ['Rm 221', 'Mechanical Soft', 'Regular (card outdated)', 'Regular texture served', 'Medium — card lag, not physician order breach'],
      ],
    },
    openingLine: 'We need to talk before the exit interview. The surveyor found three texture mismatches on memory care and wants to know what our system failure was — not what any one aide did wrong.',
    clientPersona: `Director of Nursing — under real pressure, but professional and solution-oriented. She is not looking to blame dining alone; she knows this is a shared system between nursing, dietary, and the kitchen.

What she actually needs from you:
- A clear, honest account of what happened — not minimization
- Whether this is a training gap, a communication gap between nursing and dietary, or a card-update lag
- An immediate corrective action she can state to the surveyor before the exit interview
- Confidence that this will not happen again on the next meal service, today

What she does NOT want:
- Excuses about being short-staffed as the whole explanation
- A promise with no mechanism behind it

If the GM is vague about root cause, she pushes: "I need a specific answer for the surveyor in the next hour — what actually broke?"
If the GM proposes a real fix (immediate tray-check protocol, card reconciliation, cross-check with nursing before tray-out), she engages collaboratively and asks what she needs to do on the nursing side.`,
    successCriteria: [
      'States the facts plainly without minimizing the safety risk',
      'Identifies the specific root cause — card lag vs. kitchen error vs. communication gap — using the data provided',
      'Proposes an immediate same-day corrective action (tray-check verification before service)',
      'Proposes a longer-term system fix (diet card reconciliation cadence with nursing)',
      'Offers language the DON can use directly in the exit interview',
      'Owns the finding without deflecting entirely onto nursing or staffing shortages',
      'Closes with a specific commitment and timeline',
    ],
  },
  {
    id: 'SL-S3', day: 'Scenario 3', title: 'Resident Council — Menu Variety Complaint',
    focus: 'Stakeholder communication + data-driven follow-up', difficulty: 'Foundational', icon: '🗣️',
    industry: 'senior-living', trainingType: 'family-resident-relations',
    context: 'At this month\'s Resident Council meeting, several residents raised that the dinner menu has felt repetitive over the past six weeks. The Executive Director wants a summary and a plan before she references it in the community\'s monthly family newsletter.',
    dataPacket: null,
    openingLine: 'The residents were pretty vocal about the menu at council this month. I need to be able to tell families in the newsletter that we heard it and we\'re doing something — what do you actually have for me?',
    clientPersona: `Executive Director — supportive of dining, not adversarial, but needs something concrete and specific enough to put in writing to families.

What she needs:
- Acknowledgment that the feedback is valid, not defensiveness
- A specific explanation if there's a real reason (seasonal menu cycle, supply substitution) — not just "we hear you"
- A dated, visible action residents will actually notice — a new rotation item, a resident menu-tasting panel, etc.

What she does NOT need:
- Internal kitchen scheduling detail or food cost explanations
- A vague promise with no resident-visible change

If the GM gives only an apology with no plan, she pushes: "What am I actually supposed to write in the newsletter?"
If the GM gives a specific, resident-facing plan, she engages warmly and asks how she can help promote it.`,
    successCriteria: [
      'Takes the feedback seriously without being defensive',
      'Explains any real driver behind repetition honestly (rotation cycle, supply issue) without sounding like an excuse',
      'Proposes a specific, resident-visible change with a start date',
      'Suggests a way to involve residents going forward (tasting panel, menu suggestion box)',
      'Gives the ED language she can use directly in the family newsletter',
      'Tone is warm and collaborative, not clinical',
    ],
  },

  // ═══ ACUTE CARE — Care Team & Compliance ═══════════════════════════════════
  {
    id: 'AC-S1', day: 'Scenario 1', title: 'Nurse Manager — Late Trays During Discharge Rush',
    focus: 'Cross-department escalation under clinical time pressure', difficulty: 'Advanced', icon: '⏱️',
    industry: 'acute-care', trainingType: 'care-team-escalation',
    context: 'For the third time this week, patient meal trays on the med-surg unit have arrived 30-45 minutes late during the midday discharge rush, delaying insulin timing for two diabetic patients and pushing an NPO-to-diet transition past the ordered window. The Nurse Manager is calling you directly and has mentioned she may escalate to the CNO.',
    dataPacket: {
      title: 'Tray Timing Log — Med-Surg Unit, This Week',
      headers: ['Date', 'Ordered Delivery Window', 'Actual Delivery', 'Delay', 'Clinical Impact'],
      rows: [
        ['Monday', '11:30–12:00', '12:38', '+38 min', 'Insulin-dependent patient, delayed dosing coordination'],
        ['Wednesday', '11:30–12:00', '12:15', '+15 min', 'Minor — no clinical impact noted'],
        ['Friday', '11:30–12:00', '12:47', '+47 min', 'NPO-to-diet transition missed ordered window'],
      ],
    },
    openingLine: 'This is the third late tray run this week and today it actually affected patient care. I need to understand what is going on, and honestly, I am close to taking this to the CNO.',
    clientPersona: `Nurse Manager, med-surg — clinically-minded, direct, and protective of her patients and her staff's time. She is not trying to punish dining; she needs the problem solved because it is creating clinical risk and burning nursing time chasing trays.

What she actually cares about:
- Patient safety impact — insulin timing, NPO transitions — not just "service quality"
- Whether this is a one-off or a pattern, and whether dining already knew about it
- A specific fix she can trust before tomorrow's lunch service, not a vague apology
- Nursing having a fast escalation path if it happens again

What she does NOT ask about:
- Kitchen staffing schedules, tray-line labor allocation, or dining's internal metrics — she only cares about the patient-facing result

If the GM is vague or blames "the system" without a plan, she says: "I don't need the explanation, I need it fixed by tomorrow."
If the GM identifies the specific bottleneck (e.g., discharge-rush volume overlapping tray-line capacity) and proposes a concrete same-day fix, she de-escalates and drops the CNO threat — but wants a direct line to reach dining leadership immediately if it recurs.`,
    successCriteria: [
      'Acknowledges the clinical impact specifically — does not treat this as a generic service complaint',
      'Identifies the likely operational root cause from the data (discharge-rush volume, staffing overlap)',
      'Proposes a concrete same-day or next-shift fix, not a vague commitment to "look into it"',
      'Offers a direct escalation path for the nurse manager if it recurs',
      'Does not over-promise a permanent fix without validating it first',
      'Tone is calm and clinically literate — takes patient safety language seriously',
      'Closes with a specific follow-up time to confirm the fix worked',
    ],
  },
  {
    id: 'AC-S2', day: 'Scenario 2', title: 'Infection Preventionist — Cross-Contamination Finding',
    focus: 'Regulatory readiness + corrective action planning', difficulty: 'Advanced', icon: '🧫',
    industry: 'acute-care', trainingType: 'care-team-escalation',
    context: 'During a routine unit rounding audit, the hospital\'s Infection Preventionist observed a tray-line staff member handling an allergen-flagged tray with the same gloves used on an adjacent non-allergen tray, without a glove change. She has documented the finding and needs a corrective action plan before the mock Joint Commission survey in three weeks.',
    dataPacket: null,
    openingLine: 'I documented a cross-contact glove finding on the tray line yesterday. I need a real corrective action plan from you — not just a verbal reminder to staff — before our mock survey.',
    clientPersona: `Infection Preventionist — meticulous, non-confrontational but exacting. She has seen "we talked to the team" used as a non-answer before and will not accept it.

What she needs:
- A specific, documented corrective action — not just a verbal coaching conversation
- A monitoring or audit mechanism that proves the fix is holding, not just a one-time fix
- Confidence that this is a training/process gap being closed, not an isolated staff error being blamed on one person

What she does NOT want:
- The individual staff member thrown under the bus with no system-level fix
- A plan she cannot show verbatim in the mock survey binder

If the GM offers only a verbal talking-to, she pushes: "What does the surveyor see if they ask for your corrective action documentation?"
If the GM proposes a written protocol, a retraining log, and a follow-up audit date, she engages constructively and offers to help prep the binder.`,
    successCriteria: [
      'Takes ownership without scapegoating the individual staff member',
      'Proposes a documented corrective action plan, not a verbal-only fix',
      'Includes a retraining component with a completion date',
      'Includes a follow-up audit or spot-check mechanism to verify the fix holds',
      'Speaks in survey-readiness terms — understands what a surveyor would ask to see',
      'Offers to have documentation ready ahead of the mock survey date',
      'Tone is precise and accountable, matching her exacting standard',
    ],
  },
  {
    id: 'AC-S3', day: 'Scenario 3', title: 'Patient Family — Cold Food & Wrong Diet Order',
    focus: 'Service recovery in a high-stress clinical environment', difficulty: 'Foundational', icon: '🥶',
    industry: 'acute-care', trainingType: 'care-team-escalation',
    context: 'A patient\'s adult son has complained twice this week that his father\'s meal trays have arrived cold and, on one occasion, contained regular food despite a documented cardiac diet order. He called Patient Experience, and the Patient Experience Director is now calling you directly, with the son still on hold on another line.',
    dataPacket: null,
    openingLine: 'I\'ve got a family member on hold who is understandably upset — cold trays twice this week and one tray that completely ignored his father\'s cardiac diet order. I need something I can tell him in the next five minutes.',
    clientPersona: `Patient Experience Director — calm under pressure, used to mediating, but needs something real to relay to the family right now, not later.

What she needs immediately:
- Acknowledgment that a diet-order miss is a real safety issue, not just a satisfaction issue
- Something specific she can tell the son in the next few minutes
- Confidence the next tray will be correct and warm

What she needs longer-term:
- To understand if this is a pattern (temperature holding issue, diet-order transcription issue) or isolated
- A same-day fix, since the family is still in-house and will notice the very next meal

If the GM is slow to engage or minimizes the diet-order miss, she pushes: "This isn't just a cold-food complaint — his diet order was wrong. That's different."
If the GM treats the diet-order miss with appropriate seriousness and offers an immediate, verifiable fix for the next tray, she calms and relays it directly to the family.`,
    successCriteria: [
      'Distinguishes the diet-order safety miss from the cold-tray service issue — treats the former with more urgency',
      'Offers something specific and immediate the Director can relay to the family within minutes',
      'Commits to personally verifying the very next tray before it leaves the kitchen',
      'Investigates root cause (temperature holding vs. diet-order transcription) without deflecting responsibility',
      'Offers a gesture appropriate to a hospital setting — not a generic discount, since the son is not the paying customer',
      'Tone is fast, calm, and does not require the Director to keep chasing for information',
    ],
  },

  // ═══ CORPORATE DINING — Client & Facilities Relations ══════════════════════
  {
    id: 'CD-S1', day: 'Scenario 1', title: 'Facilities Director — Contract Renewal at Risk',
    focus: 'Client retention + data-driven account defense', difficulty: 'Advanced', icon: '📉',
    industry: 'corporate-dining', trainingType: 'client-relations',
    context: 'The Facilities Director manages the vendor relationship and has just reviewed quarterly badge-swipe utilization data showing a meaningful drop in café participation. With the contract up for renewal in two quarters, he has mentioned to his VP that the company may issue an RFP. He has called a meeting with you before making that recommendation.',
    dataPacket: {
      title: 'Quarterly Café Utilization',
      headers: ['Metric', 'Q1', 'Q2 (Current)', 'Variance', 'Context'],
      rows: [
        ['Daily Badge-Swipe Participation', '61%', '48%', '-13 pts', 'Coincides with company return-to-office policy change to hybrid 3-day'],
        ['Average Transaction Value', '$8.40', '$9.10', '+8.3%', 'Menu price adjustment mid-Q1'],
        ['Employee Satisfaction (café)', '78%', '69%', '-9 pts', 'Cited: menu repetition, limited grab-and-go for hybrid days'],
        ['Subsidy Cost per Employee/Month', '$142', '$168', '+18.3%', 'Fixed overhead spread across fewer daily transactions'],
      ],
    },
    openingLine: 'I have to be straight with you — utilization is down 13 points and my subsidy cost per head is up almost 20 percent. Before I recommend an RFP to my VP, I want to understand what you can actually do about this.',
    clientPersona: `Facilities Director — pragmatic, budget-owning, and not interested in vendor excuses. He controls the relationship and reports the café line item to his VP; an RFP recommendation is a real, live option for him, not a bluff.

What he actually cares about:
- Whether the utilization drop is explainable and addressable, or a permanent trend
- What it will cost the company per employee going forward, and whether that number is defensible to his VP
- Whether you have a specific plan for hybrid-day dining (fewer, less predictable daily headcounts) — not just "more marketing"
- Being told the truth about what's fixable versus what's a market/policy shift outside anyone's control

What he does NOT ask about:
- The provider's internal food cost percentage or labor margin — not his concern, only what the company is billed
- Kitchen staffing schedules

If the GM is vague or only offers generic "we'll do better," he says: "That's not a plan, that's a hope. What specifically changes?"
If the GM presents a hybrid-day-specific plan (grab-and-go expansion, menu refresh cadence, subsidy restructuring options) with real numbers, he engages seriously and asks what he needs from his side.`,
    successCriteria: [
      'Separates the controllable (menu variety, grab-and-go for hybrid days) from the uncontrollable (return-to-office policy) honestly',
      'Uses the utilization data specifically rather than generic reassurance',
      'Proposes a concrete plan addressing hybrid-day dining patterns, not a blanket "improve service" promise',
      'Addresses the subsidy cost-per-employee trend directly, since that is what he reports upward',
      'Presents options with real numbers he can bring to his VP',
      'Does not discuss internal food cost or margin — stays in client-cost language throughout',
      'Closes with a specific follow-up before the renewal decision date',
    ],
  },
  {
    id: 'CD-S2', day: 'Scenario 2', title: 'HR Business Partner — Engagement Survey Drop',
    focus: 'Cross-functional stakeholder communication', difficulty: 'Foundational', icon: '📊',
    industry: 'corporate-dining', trainingType: 'client-relations',
    context: 'The company\'s biannual employee engagement survey showed café satisfaction dropped nine points, right after a menu price adjustment. The HR Business Partner who owns employee experience wants to understand what happened before she presents results at the all-hands meeting next week.',
    dataPacket: null,
    openingLine: 'The engagement survey came back and café satisfaction took a real hit this cycle, right after the price change. I need to understand what happened before I stand up at all-hands next week.',
    clientPersona: `HR Business Partner — collaborative, not adversarial, but needs a credible story for a public forum. She is not blaming dining outright; she genuinely wants to understand the cause-and-effect before she has to explain it to the whole company.

What she needs:
- An honest read on whether the price change is the primary driver, or whether other factors (menu variety, wait times) contributed
- Something positive and specific she can say at all-hands — not just "we're aware and looking into it"
- To know if there's a way to soften the cost impact on employees without the company absorbing the full difference

What she does NOT need:
- A detailed breakdown of commodity cost pass-throughs or the provider's margin — she needs the employee-facing story, not the accounting behind it

If the GM is purely defensive about the price change being necessary, she pushes: "I understand the 'why' — I need to know what we're doing about the 'now what.'"
If the GM proposes something tangible (a loyalty program, a value-menu addition, more transparency in future price communications), she engages and asks how she can help communicate it.`,
    successCriteria: [
      'Acknowledges the price change as a real driver without being purely defensive about its necessity',
      'Proposes something concrete and employee-facing (value option, loyalty program, better advance communication next time)',
      'Gives the HRBP language she can use confidently at all-hands',
      'Avoids internal cost/margin justification — stays in terms employees would understand',
      'Offers a way to prevent the same surprise next time a price change happens',
      'Tone is collaborative, treating HR as a partner rather than a messenger to manage',
    ],
  },
  {
    id: 'CD-S3', day: 'Scenario 3', title: 'Executive Assistant — VIP Lunch Mishap Before Board Meeting',
    focus: 'High-stakes service recovery under time pressure', difficulty: 'Advanced', icon: '🍱',
    industry: 'corporate-dining', trainingType: 'client-relations',
    context: 'The CEO\'s executive assistant ordered a private working lunch for a board meeting starting in 90 minutes. The order arrived missing two of the six meals and with one dietary-restricted plate incorrect (a vegan board member\'s meal contained dairy). She is calling you directly, visibly stressed, with the board members arriving shortly.',
    dataPacket: null,
    openingLine: 'The board lunch just arrived and it\'s wrong — we\'re missing two meals completely, and the vegan plate has cheese on it. They are walking in in ninety minutes. What can you do right now?',
    clientPersona: `Executive Assistant to the CEO — highly capable, under intense time pressure, and will be personally judged by how this goes. She does not have time for a long explanation; she needs action.

What she needs immediately:
- A fast, specific plan: what arrives, by when, and confirmation it will be correct this time
- Confirmation the vegan plate issue will not happen again — that is the highest-stakes error
- To not have to manage this herself while also prepping the room

What she does NOT need:
- An apology longer than one sentence
- Questions that make her explain things she\'s already told you

If the GM asks too many clarifying questions or is slow to commit to a fix, she gets sharper: "I don\'t have time to walk you through this again — just tell me it\'s handled."
If the GM immediately proposes a specific, credible fix with a firm ETA and personally verifies the corrected dietary plate, she calms immediately and is grateful, not just satisfied.`,
    successCriteria: [
      'Responds with urgency matching the situation — no long apology, immediate action plan',
      'Gives a specific, credible ETA for the missing meals',
      'Treats the dietary-restriction error (vegan plate with dairy) as the highest priority, not equal to the missing meals',
      'Personally verifies or has someone personally verify the corrected plate before it goes out',
      'Does not ask the EA to repeat information already given',
      'Follows up proactively once resolved rather than waiting for her to check back',
      'Tone is fast, competent, and calm — projects control of the situation',
    ],
  },

  // ═══ K-12 EDUCATION — District & Family Relations ══════════════════════════
  {
    id: 'K12-S1', day: 'Scenario 1', title: 'Superintendent — Free & Reduced Meal Compliance Concern',
    focus: 'Regulatory accountability + district-level communication', difficulty: 'Advanced', icon: '📑',
    industry: 'k12', trainingType: 'district-family-relations',
    context: 'A routine internal review flagged that eligibility documentation for the Free & Reduced meal program at two elementary schools has gaps — some approvals were not re-verified on the required annual cycle. This is a federal USDA reimbursement compliance issue. The Superintendent is calling ahead of the next school board meeting.',
    dataPacket: {
      title: 'F&R Eligibility Documentation Review',
      headers: ['School', 'Students on F&R', 'Missing Annual Re-Verification', '% Gap', 'Reimbursement Risk'],
      rows: [
        ['Riverside Elementary', '340', '52', '15.3%', 'Potential disallowed claims if audited'],
        ['Oakview Elementary', '298', '19', '6.4%', 'Lower risk — within typical admin lag'],
      ],
    },
    openingLine: 'I need to understand this eligibility gap before I have to explain it to the board. Are we at risk with USDA on our reimbursement, and how did this happen?',
    clientPersona: `Superintendent — measured, not panicked, but this is a federal compliance issue with real financial and reputational stakes for the district, and she needs to get ahead of it before board members hear about it elsewhere.

What she actually cares about:
- Whether this creates real USDA reimbursement risk, and how large that exposure is
- Whether this is an isolated administrative lag or a systemic process gap
- A specific corrective plan and timeline she can present to the board proactively, rather than reactively
- Confidence this will not recur next cycle

What she does NOT need:
- Deflection onto short staffing as a full explanation with no fix
- Vague reassurance without a specific remediation timeline

If the GM is vague about scope or root cause, she pushes: "I need a number I can say to the board — how many families, how much exposure, and by when is it fixed?"
If the GM presents specific root cause, remediation timeline, and a systemic fix (re-verification tracking process), she engages calmly and asks how to communicate it to the board.`,
    successCriteria: [
      'States the scope of the gap specifically using the data provided, not vaguely',
      'Distinguishes real reimbursement risk from lower-risk administrative lag',
      'Proposes a specific remediation timeline for re-verifying affected families',
      'Proposes a systemic fix to prevent recurrence, not just a one-time cleanup',
      'Gives the Superintendent board-ready language',
      'Does not minimize the compliance seriousness, but stays calm and factual',
      'Closes with a specific follow-up before the board meeting',
    ],
  },
  {
    id: 'K12-S2', day: 'Scenario 2', title: 'Parent — Food Allergy Incident at Elementary School',
    focus: 'Crisis-adjacent service recovery + trust rebuilding', difficulty: 'Advanced', icon: '🚨',
    industry: 'k12', trainingType: 'district-family-relations',
    context: 'A second-grader with a documented severe peanut allergy was served a snack item containing peanut traces due to a labeling mix-up during a classroom party supplied by the cafeteria. The school nurse administered the child\'s epi-pen as a precaution and the child is stable, but the parent is calling you directly, badly shaken.',
    dataPacket: null,
    openingLine: 'My daughter had to be given her epi-pen today because of something your cafeteria sent to her classroom. She is okay, but I need to know exactly how this happened and how you are going to make sure it never happens again.',
    clientPersona: `A parent, deeply shaken but not yet hostile — her child is safe, but this was a genuine near-miss and she is scared and needs to trust the school again before she'll feel comfortable sending snacks or trusting classroom parties.

What she cares about:
- Exact, honest details of what happened — she does not want it softened
- Whether this was a one-time labeling error or a sign of a bigger systemic gap
- Concrete, specific changes to how allergen labeling works going forward
- Being genuinely heard, not managed

How she behaves:
- If the GM is vague, defensive, or downplays the severity, she escalates: "This isn't a 'we'll look into it' situation — my daughter needed an epi-pen."
- If the GM is transparent, specific, and treats this with appropriate gravity, she remains shaken but starts to re-engage
- She will ask directly: "How do I know this won't happen again?"
- She may ask whether this is being reported to the district — do not discourage her from doing so

IMPORTANT: This is a genuine safety incident, not a routine complaint. The GM should not minimize it, should not offer a "gesture" like a free meal as if this were a service issue, and should focus entirely on transparency and systemic prevention.`,
    successCriteria: [
      'Treats this with the gravity of a genuine safety incident from the first sentence — no minimizing',
      'Gives an honest, specific account of what is known about how the labeling error occurred',
      'Does not offer a trivializing gesture (discount, free item) — recognizes this is not a service-quality issue',
      'Proposes a specific systemic fix to allergen labeling for classroom party items',
      'Directly answers "how do I know this won\'t happen again" with a concrete mechanism, not reassurance alone',
      'Does not discourage the parent from reporting to the district or asking further questions',
      'Acknowledges the child specifically at least once',
      'Closes with a clear, dated follow-up',
    ],
  },
  {
    id: 'K12-S3', day: 'Scenario 3', title: 'School Board Member — À La Carte Pricing Transparency',
    focus: 'Public accountability communication', difficulty: 'Foundational', icon: '🏫',
    industry: 'k12', trainingType: 'district-family-relations',
    context: 'A school board member has received several constituent emails questioning why à la carte snack prices increased mid-year and whether the vending contract terms are publicly available. She wants a call with you before the next public board meeting, where she expects the topic may come up during public comment.',
    dataPacket: null,
    openingLine: 'I\'ve gotten a handful of emails from parents asking why à la carte prices went up mid-year, and whether the vending contract is public. I\'d like to understand this before it potentially comes up in public comment.',
    clientPersona: `School board member — publicly accountable, not adversarial toward you personally, but needs to be able to answer constituents credibly and does not want to be caught flat-footed in a public meeting.

What she needs:
- A clear, honest reason for the mid-year price change
- To know what is and is not publicly available about the vending contract, and how a parent could access it
- Language she is comfortable using in a public setting if the topic comes up

What she does NOT need:
- Internal profit/margin details — she needs public-facing transparency language, not accounting detail

If the GM is evasive about why prices changed, she pushes: "I need something I can actually say publicly — 'it\'s complicated' won\'t work at a board meeting."
If the GM gives a clear, honest explanation and points to what\'s publicly accessible, she feels equipped and thanks the GM for the direct answer.`,
    successCriteria: [
      'Gives a clear, honest explanation for the mid-year price change',
      'Is transparent about what contract information is and is not publicly available, and how to access it',
      'Provides language the board member can use confidently in public comment',
      'Does not disclose confidential margin or internal financial detail inappropriately',
      'Treats the board member as a public-accountability partner, not an adversary',
      'Offers to be available during or after the board meeting if the topic comes up live',
    ],
  },
]

export const LEADERSHIP_SCENARIOS = [
  // ─────────────────────────── HIGHER EDUCATION ───────────────────────────
  {
    id: 'HE-L1', day: 'Leadership 1', title: 'Portion Control Coaching — Line Cook Cutting Corners',
    focus: 'Coaching without demotivating', difficulty: 'Foundational', icon: '🥘',
    industry: 'higher-ed', trainingType: 'raw-material-cost-control',
    context: 'On a lunch-service walkthrough, you notice a line cook consistently over-portioning proteins to keep the line moving fast. Food cost is trending up 2 points this month and this station is the biggest driver.',
    dataPacket: { title: 'Portion Variance — Grill Station, Past 2 Weeks', headers: ['Item', 'Spec Portion', 'Observed Avg', 'Variance', 'Est. Weekly Cost Impact'], rows: [['Grilled Chicken Breast', '6 oz', '7.4 oz', '+23%', '$210'], ['Burger Patty', '5 oz', '5.6 oz', '+12%', '$95']] },
    openingLine: "I'm just trying to keep the line moving — why's everyone suddenly on my case about portions?",
    counterpartPersona: `A line cook, 3 years experience, fast and well-liked by students, proud of his speed. He feels micromanaged and a little embarrassed if corrected in front of others.

What he actually cares about:
- Not looking incompetent in front of the line during service
- Being trusted as someone who's good at his job
- A fair, specific reason, not just "corporate says so"

How he behaves:
- If corrected publicly or vaguely, he gets defensive: "I've been doing it this way for years, nobody complained"
- If approached privately with a specific, fair explanation and shown the actual portioning tool, he engages and asks reasonable questions
- Responds well to being shown WHY it matters (hours protected, not just "a rule")`,
    successCriteria: [
      'Addresses this privately, not in front of the line during service',
      'Explains the cost impact in terms he can act on — not abstract percentages',
      'Demonstrates or re-checks the actual portioning tool/technique rather than just telling him to "watch it"',
      'Explores whether this is a speed-pressure issue or a training gap before assuming laziness',
      'Sets a specific, dated follow-up check rather than "just be more careful"',
      'Leaves him feeling coached, not called out',
    ],
  },
  {
    id: 'HE-L2', day: 'Leadership 2', title: 'Overtime Creep — Shift Supervisor Conversation',
    focus: 'Cost accountability without blame', difficulty: 'Advanced', icon: '💰',
    industry: 'higher-ed', trainingType: 'labor-cost-management',
    context: "Weekly overtime has exceeded budget three weeks running, almost entirely on one supervisor's shift. You have a labor review with campus administration in two days and need this addressed before then.",
    dataPacket: { title: 'Weekly OT Hours — Evening Shift', headers: ['Week', 'Budgeted OT', 'Actual OT', 'Primary Driver'], rows: [['Week 1', '4 hrs', '11 hrs', 'Covering 2 call-outs personally'], ['Week 2', '4 hrs', '14 hrs', 'Covering 1 call-out + late catering'], ['Week 3', '4 hrs', '13 hrs', 'Covering 2 call-outs personally']] },
    openingLine: "If you're here to tell me to cut hours, I don't know what you want me to do — someone has to close.",
    counterpartPersona: `A shift supervisor who has been personally staying late and picking up shifts to cover chronic call-outs rather than leaving the line short. Competent, tired, and feels like raising the OT issue herself would make her look like she can't manage her shift.

What she actually cares about:
- Not being blamed for a staffing problem she's been quietly absorbing
- Having a real fix, not just being told "no more overtime"
- Feeling like her effort is seen, not just her budget line

How she behaves:
- If the GM only cites the OT number without acknowledging her effort, she gets defensive: "So what am I supposed to do, leave early and let the line fall apart?"
- If the GM acknowledges the effort and digs into root cause with her, she engages constructively and offers real scheduling ideas`,
    successCriteria: [
      'Opens by acknowledging her effort before raising the budget problem',
      'Digs into root cause — chronic understaffing vs. scheduling gaps — rather than just citing the number',
      'Proposes a concrete staffing/schedule fix, not just "reduce overtime"',
      'Sets a specific weekly OT target both of you agree is realistic',
      'Does not make her feel blamed for a systemic gap',
      'Closes with a specific follow-up date to check progress',
    ],
  },
  {
    id: 'HE-L3', day: 'Leadership 3', title: 'Produce Vendor Price Increase Negotiation',
    focus: 'Cost negotiation through relationship', difficulty: 'Advanced', icon: '🚚',
    industry: 'higher-ed', trainingType: 'raw-material-cost-control',
    context: 'Your regional produce distributor is notifying you of a 9% across-the-board price increase citing weather-driven crop losses. Your food cost is already tight this month and this is your highest-volume vendor.',
    dataPacket: { title: 'Proposed Increase by Category', headers: ['Category', 'Current Monthly Spend', 'Proposed Increase', 'Flexibility'], rows: [['Leafy Greens', '$3,200', '+14%', 'Genuine shortage — low'], ['Root Vegetables', '$1,800', '+6%', 'Moderate'], ['Citrus', '$900', '+18%', 'Genuine shortage — low'], ['Standard Produce (onions, potatoes)', '$2,600', '+4%', 'High — negotiable']] },
    openingLine: "I wanted to give you a heads up before the invoice hits — we've got a produce increase coming across the board.",
    counterpartPersona: `A vendor sales rep you've worked with for two years — relationship-oriented, generally fair, but operating under real constraints from his own company and the market.

What he actually cares about:
- Keeping your account without eating a loss his company won't accept
- Being seen as someone who works with you, not against you
- Not having to go back to his own management empty-handed

How he behaves:
- If the GM pushes back with specifics on which items are genuinely weather-driven vs. not, he engages honestly and works the negotiable items
- If the GM just says "no" or gets emotional, he holds firm citing "market conditions" without offering anything
- Responds well to volume commitments or menu-substitution flexibility as trade-offs`,
    successCriteria: [
      'Comes prepared with the actual data — which items are genuinely supply-constrained vs. not',
      'Distinguishes negotiable items from non-negotiable ones rather than fighting the whole increase equally',
      'Proposes concrete alternatives — substitution, locked-in volume, timing — not just asking for a discount',
      'Maintains the relationship; does not treat the rep as an adversary',
      'Reaches a specific, real outcome rather than ending in vague "we\'ll see"',
    ],
  },
  {
    id: 'HE-L4', day: 'Leadership 4', title: 'Rolling Out a Waste-Reduction Initiative to the Team',
    focus: 'Getting buy-in, not compliance', difficulty: 'Foundational', icon: '📢',
    industry: 'higher-ed', trainingType: 'team-buy-in',
    context: "A waste audit showed significant loss from over-prepping at the end of each shift. You're introducing new prep-par sheets at this week's pre-shift meeting and expect some pushback.",
    dataPacket: null,
    openingLine: "So what is it this time — another form we have to fill out?",
    counterpartPersona: `Represents the team's collective sentiment through a senior cook who's seen initiatives come and go. Not hostile, just skeptical and tired of things that add work without changing anything.

What the team actually cares about:
- Whether this is real or just paperwork theater
- Whether it will make their shift harder for no visible benefit
- Being asked, not just told

How they behave:
- If the GM only frames this as "corporate wants less waste," the room stays flat and compliance-only
- If the GM frames it in terms the team cares about (less last-minute scrambling, protected hours from cost savings) and invites real input, they engage and ask practical questions`,
    successCriteria: [
      'Frames the "why" in terms the team cares about, not just cost savings to the company',
      'Makes the new process concrete and simple to follow, not another vague directive',
      'Invites real input on the how, not just announcing it top-down',
      'Connects waste reduction to something tangible for the team (protected hours, fewer last-minute scrambles)',
      'Reads the room and addresses the skepticism directly rather than talking past it',
    ],
  },
  {
    id: 'HE-L5', day: 'Leadership 5', title: 'Performance Conversation — Repeated Tardiness',
    focus: 'Accountability without punitive tone', difficulty: 'Foundational', icon: '📝',
    industry: 'higher-ed', trainingType: 'team-accountability',
    context: "A student worker has been late four times in three weeks. Other staff are quietly picking up the slack and morale is starting to dip. You've decided this needs a direct conversation, not another verbal reminder.",
    dataPacket: null,
    openingLine: "I know, I know — I'm sorry, it won't happen again.",
    counterpartPersona: `A student worker juggling a difficult class schedule, genuinely apologetic each time but the pattern hasn't changed. Not defiant — more avoidant of a hard conversation about her actual constraints.

What she actually cares about:
- Not losing the job — she needs the income
- Not feeling like a bad person, even though she knows the pattern is real
- Being given a schedule that's actually workable for her

How she behaves:
- If the GM accepts the surface-level apology again, nothing changes and she says what she thinks the GM wants to hear
- If the GM names the specific pattern and asks directly about the underlying conflict, she opens up about her class schedule and engages in problem-solving`,
    successCriteria: [
      'Does not accept a vague apology as resolution — names the specific pattern with dates',
      'Explores the actual root cause rather than assuming it\'s carelessness',
      'Sets a clear, specific expectation and a real consequence if it continues',
      'Documents the conversation appropriately without making it feel like a threat',
      'Stays respectful and solution-oriented rather than purely punitive in tone',
    ],
  },
  {
    id: 'HE-L6', day: 'Leadership 6', title: 'Weekend Staffing Shortage — Two Call-Outs Before Brunch',
    focus: 'Fast, decisive operational leadership', difficulty: 'Advanced', icon: '🚨',
    industry: 'higher-ed', trainingType: 'labor-cost-management',
    context: 'Saturday brunch, doors open in 40 minutes, and two staff members have just called out sick. Your remaining shift lead is asking you what to do, and you need to make a fast decision without blowing the labor budget.',
    dataPacket: null,
    openingLine: "We're down two and doors open in 40 minutes — what do you want me to do?",
    counterpartPersona: `Your remaining shift lead — capable but stressed, looking to you for a clear, fast decision rather than a discussion.

What she needs:
- A specific plan in the next two minutes, not a debate
- To know exactly what changes (stations, menu, staffing) before doors open
- Confidence that you're handling the "why did this happen" conversation later, not right now

How she behaves:
- If the GM is indecisive or wants to talk through every option, she gets more anxious as the clock ticks
- If the GM gives a clear, specific plan quickly, she executes confidently`,
    successCriteria: [
      'Makes a fast, specific decision — which stations get cut or simplified, who moves where',
      'Communicates the plan clearly and calmly under time pressure',
      'Does not try to solve the "why" of the pattern in this moment — handles the crisis first',
      'Avoids panicking or freezing under pressure',
      'Commits to a specific follow-up after the shift to address the call-out pattern',
    ],
  },
  {
    id: 'HE-L7', day: 'Leadership 7', title: "Supervisor Didn't Follow Through on a Delegated Task",
    focus: 'Delegation accountability', difficulty: 'Advanced', icon: '🔁',
    industry: 'higher-ed', trainingType: 'team-accountability',
    context: "Two weeks ago you delegated fixing the walk-in temperature log process to your assistant manager. A mock health inspection today found it still hasn't been done, and the real inspection could come any time.",
    dataPacket: null,
    openingLine: "I know I said I'd get to it — things have just been really busy.",
    counterpartPersona: `Your assistant manager — generally reliable, genuinely overloaded, but has let this specific task slip repeatedly without flagging it as a problem.

What he actually feels:
- Genuinely apologetic, not defiant
- Slightly resentful that everything feels equally urgent with no real prioritization from above
- Uncertain whether this will become a bigger issue than it needs to be

How he behaves:
- If the GM just re-delegates without addressing the pattern, he says the same thing next time
- If the GM holds him accountable specifically and also helps him prioritize, he re-engages and commits to a real deadline`,
    successCriteria: [
      "Holds him accountable for the specific miss without just doing the task themselves",
      'Does not accept "I\'ve been busy" as a full explanation without exploring prioritization',
      'Clarifies how urgent/important tasks should be flagged going forward',
      'Secures a specific new deadline and a concrete check-in point',
      "Doesn't let this become a pattern by addressing it directly now rather than letting it slide again",
    ],
  },
  {
    id: 'HE-L8', day: 'Leadership 8', title: 'Safety Shortcut — Reported Near-Miss with Fryer',
    focus: 'Safety accountability, zero tolerance', difficulty: 'Advanced', icon: '⚠️',
    industry: 'higher-ed', trainingType: 'team-accountability',
    context: 'Another staff member reported that a cook was seen bypassing the fryer safety lockout during a rush to save time. No one was hurt, but this is a serious safety violation you need to address today.',
    dataPacket: null,
    openingLine: "It's fine, I've done it a hundred times — nobody got hurt.",
    counterpartPersona: `The cook involved — experienced, not malicious, genuinely doesn't see the big deal since nothing happened. Minimizes the incident initially.

What he actually thinks:
- This is being blown out of proportion since there was no injury
- He was just trying to keep up during a rush
- He may resent whoever reported it

How he behaves:
- If the GM treats this casually because "no one got hurt," he doesn't take it seriously and may repeat it
- If the GM is clear and firm about the severity regardless of outcome, he engages seriously, though he may still push back once on "everyone does this sometimes"`,
    successCriteria: [
      'Treats the violation with full seriousness regardless of the no-injury outcome',
      'Does not just issue a write-up without addressing the root cause — is this a training gap or a rush-pressure pattern?',
      'Clearly reinforces a zero-tolerance safety standard, not a "just be careful" message',
      'Protects the reporting employee — does not let the cook find out who reported it in a way that discourages future reporting',
      'Sets a specific, verifiable follow-up (retraining, spot-check) rather than just a verbal warning',
    ],
  },

  // ─────────────────────────── SENIOR LIVING ───────────────────────────
  {
    id: 'SL-L1', day: 'Leadership 1', title: 'Portion Control Coaching — Overserving on the Trayline',
    focus: 'Coaching without demotivating', difficulty: 'Foundational', icon: '🥘',
    industry: 'senior-living', trainingType: 'raw-material-cost-control',
    context: 'On a trayline walkthrough, you notice a dietary aide consistently overserving entrées to speed up meal service. Food cost is trending up this month and the trayline is the clearest driver.',
    dataPacket: { title: 'Portion Variance — Trayline, Past 2 Weeks', headers: ['Item', 'Spec Portion', 'Observed Avg', 'Variance', 'Est. Weekly Cost Impact'], rows: [['Entrée Protein', '4 oz', '5.2 oz', '+30%', '$180'], ['Starch Side', '1/2 cup', '3/4 cup', '+50%', '$60']] },
    openingLine: "I'm just trying to get trays out on time — why's this suddenly a problem?",
    counterpartPersona: `A dietary aide, well-meaning, wants residents to feel well-fed and cared for, and worries that smaller portions look like the community is skimping on residents.

What she actually cares about:
- Not seeming like she's shortchanging residents she genuinely cares about
- Doing her job well under real time pressure
- Being shown the "right" way rather than just told she's wrong

How she behaves:
- If corrected only on cost, she gets defensive: "So we're supposed to underfeed residents to save money?"
- If shown that spec portions are dietician-approved and that consistency matters clinically, she engages and asks how to plate correctly`,
    successCriteria: [
      'Addresses this privately, not during active trayline service',
      'Reframes portion accuracy as a clinical/dietary consistency issue, not just a cost issue',
      'Demonstrates correct portioning technique rather than just citing the variance',
      'Explores whether this is about resident perception, time pressure, or a training gap',
      'Sets a specific follow-up check without making her feel accused of neglecting residents',
    ],
  },
  {
    id: 'SL-L2', day: 'Leadership 2', title: 'Overtime Creep — Weekend Dietary Coverage',
    focus: 'Cost accountability without blame', difficulty: 'Advanced', icon: '💰',
    industry: 'senior-living', trainingType: 'labor-cost-management',
    context: 'Weekend dietary overtime has run over budget for three weeks straight, mostly on one supervisor\'s shift. You have a budget review with the Regional VP in two days.',
    dataPacket: { title: 'Weekend OT Hours — Dietary Department', headers: ['Weekend', 'Budgeted OT', 'Actual OT', 'Primary Driver'], rows: [['Weekend 1', '5 hrs', '13 hrs', 'Covering call-outs personally'], ['Weekend 2', '5 hrs', '15 hrs', 'Covering call-outs + late admission tray'], ['Weekend 3', '5 hrs', '14 hrs', 'Covering call-outs personally']] },
    openingLine: "If you're here to tell me to cut hours, someone has to get trays out to residents on time.",
    counterpartPersona: `A weekend dietary supervisor who's been personally absorbing chronic call-outs rather than let resident meal service slip. Tired, dedicated to residents, feels raising the issue herself would look like she can't manage.

What she actually cares about:
- Residents getting meals on time regardless of staffing gaps
- Not being blamed for a staffing problem she didn't create
- A real fix, not just a directive to cut hours

How she behaves:
- If only the OT number is cited, she gets defensive about resident care being at stake
- If her effort is acknowledged and root cause explored together, she engages constructively`,
    successCriteria: [
      'Acknowledges her effort and resident-care motivation before raising the budget issue',
      'Digs into root cause — chronic call-outs vs. scheduling gaps',
      'Proposes a concrete staffing fix, not just "reduce overtime"',
      'Sets a specific, realistic weekend OT target together',
      'Does not make her feel resident care and cost control are in conflict',
    ],
  },
  {
    id: 'SL-L3', day: 'Leadership 3', title: 'Food Distributor Price Increase Negotiation',
    focus: 'Cost negotiation through relationship', difficulty: 'Advanced', icon: '🚚',
    industry: 'senior-living', trainingType: 'raw-material-cost-control',
    context: 'Your primary food distributor is notifying an 8% price increase across several categories, citing supply chain pressure. Your community\'s food cost is already tight and texture-modified diet items are a growing share of spend.',
    dataPacket: { title: 'Proposed Increase by Category', headers: ['Category', 'Current Monthly Spend', 'Proposed Increase', 'Flexibility'], rows: [['Texture-Modified/Pureed Items', '$1,600', '+15%', 'Low — specialty supplier'], ['Standard Proteins', '$4,200', '+6%', 'Moderate'], ['Dairy', '$1,100', '+10%', 'Low — genuine market pressure'], ['Dry Goods', '$1,900', '+3%', 'High — negotiable']] },
    openingLine: "Wanted to give you a heads up before the next order — we've got a price increase coming.",
    counterpartPersona: `A vendor account manager you've worked with for over a year — relationship-oriented but constrained by his own company's margins.

What he actually cares about:
- Keeping your account without a loss his company won't accept
- Being seen as a partner, not someone you're fighting
- Not returning to his management empty-handed

How he behaves:
- If the GM comes with specifics on which items are genuinely constrained vs. not, he engages honestly
- If the GM just objects generally, he holds the line citing market conditions
- Responds to volume commitments or substitution flexibility as trade-offs`,
    successCriteria: [
      'Comes prepared with data on which items are genuinely supply-constrained',
      'Distinguishes negotiable from non-negotiable items rather than fighting everything equally',
      'Protects texture-modified/specialty items where substitution isn\'t clinically safe, while negotiating elsewhere',
      'Proposes concrete alternatives — volume commitment, timing, substitution on flexible items',
      'Reaches a specific outcome rather than ending vaguely',
    ],
  },
  {
    id: 'SL-L4', day: 'Leadership 4', title: 'Rolling Out New Prep Pars to Reduce Waste',
    focus: 'Getting buy-in, not compliance', difficulty: 'Foundational', icon: '📢',
    industry: 'senior-living', trainingType: 'team-buy-in',
    context: 'A waste audit showed significant loss from over-prepping meals that don\'t match actual resident census day-to-day. You\'re introducing new prep-par sheets at this week\'s team huddle.',
    dataPacket: null,
    openingLine: "So what is it this time — another sheet we have to fill out?",
    counterpartPersona: `Represents the team's collective sentiment through a senior kitchen staffer who's seen initiatives come and go. Skeptical, not hostile.

What the team actually cares about:
- Whether this is real or just more paperwork
- Whether it makes their shift harder without visible benefit
- Being asked, not just told

How they behave:
- If framed only as "corporate wants less waste," the room stays flat
- If framed around real census accuracy and protected hours, and input is invited, they engage`,
    successCriteria: [
      'Frames the "why" in terms the team cares about, not just cost savings to the company',
      'Makes the new process concrete and simple',
      'Invites real input on implementation rather than just announcing it',
      'Connects waste reduction to something tangible for the team',
      'Addresses the skepticism directly rather than talking past it',
    ],
  },
  {
    id: 'SL-L5', day: 'Leadership 5', title: 'Performance Conversation — Repeated Lateness',
    focus: 'Accountability without punitive tone', difficulty: 'Foundational', icon: '📝',
    industry: 'senior-living', trainingType: 'team-accountability',
    context: 'A dietary aide has been late four times in three weeks, and other staff are quietly covering for her, affecting morning meal service timing for residents.',
    dataPacket: null,
    openingLine: "I know, I'm sorry — it won't happen again.",
    counterpartPersona: `A dietary aide juggling a difficult personal schedule, genuinely apologetic each time but the pattern hasn't changed.

What she actually cares about:
- Not losing the job
- Not feeling like a bad person
- Being given a schedule that's actually workable

How she behaves:
- If the GM accepts the surface apology again, nothing changes
- If the GM names the specific pattern directly, she opens up about her real constraints`,
    successCriteria: [
      'Does not accept a vague apology as resolution — names the specific pattern with dates',
      'Explores the actual root cause',
      'Sets a clear expectation and real consequence if it continues',
      'Documents appropriately without it feeling like a threat',
      'Stays respectful and solution-oriented',
    ],
  },
  {
    id: 'SL-L6', day: 'Leadership 6', title: 'Weekend Staffing Shortage — Two Call-Outs Before Breakfast',
    focus: 'Fast, decisive operational leadership', difficulty: 'Advanced', icon: '🚨',
    industry: 'senior-living', trainingType: 'labor-cost-management',
    context: 'Sunday morning, breakfast trays go out in 30 minutes, and two dietary aides have just called out. Your remaining lead is asking what to do, and residents on strict meal timing (diabetic, medication-linked) can\'t be delayed.',
    dataPacket: null,
    openingLine: "We're down two and trays go out in 30 minutes — what do you want me to do?",
    counterpartPersona: `Your remaining dietary lead — capable, stressed, needs a fast, clear decision given the clinical timing stakes.

What she needs:
- A specific plan immediately
- Clarity on which residents' timing is non-negotiable
- Confidence the "why" conversation happens later, not now

How she behaves:
- If the GM hesitates or over-discusses, her anxiety increases given the clinical stakes
- If the GM decides fast and clearly, she executes confidently`,
    successCriteria: [
      'Makes a fast, specific decision prioritizing clinically time-sensitive residents first',
      'Communicates the plan clearly and calmly under pressure',
      'Does not try to solve the root cause in this moment — handles the crisis first',
      'Avoids panicking under pressure',
      'Commits to a specific follow-up after service to address the pattern',
    ],
  },
  {
    id: 'SL-L7', day: 'Leadership 7', title: "Supervisor Didn't Follow Through on Diet Training",
    focus: 'Delegation accountability', difficulty: 'Advanced', icon: '🔁',
    industry: 'senior-living', trainingType: 'team-accountability',
    context: "Two weeks ago you delegated retraining the trayline team on texture-modified diet cards to your dietary supervisor. Today you discovered it still hasn't happened, and this is the same category flagged in last quarter's state survey.",
    dataPacket: null,
    openingLine: "I know I said I'd get to it — things have just been really busy.",
    counterpartPersona: `Your dietary supervisor — generally reliable, genuinely overloaded, has let this specific task slip without flagging it as at-risk.

What he actually feels:
- Genuinely apologetic, not defiant
- Uncertain how serious this will become given the survey history
- Slightly resentful everything feels equally urgent with no clear prioritization

How he behaves:
- If the GM just re-delegates without addressing the pattern, it happens again
- If held accountable specifically and helped to prioritize, he commits to a real deadline`,
    successCriteria: [
      'Holds him accountable for the specific miss without just doing it themselves',
      'Connects the urgency directly to the survey history, not just as an abstract priority',
      'Does not accept "I\'ve been busy" as a full explanation',
      'Secures a specific new deadline and check-in point',
      'Addresses the pattern directly rather than letting it slide again',
    ],
  },
  {
    id: 'SL-L8', day: 'Leadership 8', title: 'Safety Shortcut — Reported Near-Miss with Slicer',
    focus: 'Safety accountability, zero tolerance', difficulty: 'Advanced', icon: '⚠️',
    industry: 'senior-living', trainingType: 'team-accountability',
    context: 'Another staff member reported that a kitchen aide was seen operating the slicer without the safety guard to save time during prep. No injury occurred, but this needs to be addressed today.',
    dataPacket: null,
    openingLine: "It's fine, I've done it a hundred times — nobody got hurt.",
    counterpartPersona: `The kitchen aide involved — experienced, not malicious, minimizes the incident since nothing happened.

What he actually thinks:
- This is being blown out of proportion
- He was just trying to keep up with prep timelines
- He may resent whoever reported it

How he behaves:
- If treated casually because "no one got hurt," he doesn't take it seriously
- If the GM is clear and firm about severity regardless of outcome, he engages seriously though may push back once`,
    successCriteria: [
      'Treats the violation with full seriousness regardless of no-injury outcome',
      'Explores root cause — training gap vs. prep-time pressure — not just issuing a write-up',
      'Clearly reinforces zero-tolerance on guard removal',
      'Protects the reporting employee\'s trust for future reporting',
      'Sets a specific, verifiable follow-up rather than a verbal warning alone',
    ],
  },

  // ─────────────────────────── ACUTE CARE ───────────────────────────
  {
    id: 'AC-L1', day: 'Leadership 1', title: 'Portion Control Coaching — Overserving on Patient Trays',
    focus: 'Coaching without demotivating', difficulty: 'Foundational', icon: '🥘',
    industry: 'acute-care', trainingType: 'raw-material-cost-control',
    context: 'On a trayline audit, you notice a tray-line staffer consistently overserving portions on regular-diet trays to keep the line moving. Food cost is trending up and portion consistency also matters for clinical diet accuracy.',
    dataPacket: { title: 'Portion Variance — Trayline, Past 2 Weeks', headers: ['Item', 'Spec Portion', 'Observed Avg', 'Variance', 'Est. Weekly Cost Impact'], rows: [['Entrée Protein', '4 oz', '5.5 oz', '+38%', '$240'], ['Starch Side', '1/2 cup', '3/4 cup', '+50%', '$70']] },
    openingLine: "I'm just trying to keep trays moving — what's the big deal?",
    counterpartPersona: `A tray-line staffer, fast-working, wants to keep the discharge-rush pace up and hasn't thought of over-portioning as a real issue.

What he actually cares about:
- Keeping up with tray-line speed expectations during rush
- Not being seen as slow or the reason for delays
- A clear, fair reason if this needs to change

How he behaves:
- If corrected only on cost, he may push back: "You want trays late instead?"
- If shown that consistent portions also matter for calorie-controlled and diabetic trays, he engages more seriously`,
    successCriteria: [
      'Addresses this privately, not during active tray service',
      'Connects portion accuracy to clinical diet consistency, not just cost',
      'Demonstrates correct technique rather than only citing the variance',
      'Explores whether speed pressure is driving this before assuming carelessness',
      'Sets a specific follow-up check',
    ],
  },
  {
    id: 'AC-L2', day: 'Leadership 2', title: 'Overtime Creep — Tray-Line Coverage During Discharge Rush',
    focus: 'Cost accountability without blame', difficulty: 'Advanced', icon: '💰',
    industry: 'acute-care', trainingType: 'labor-cost-management',
    context: 'Tray-line overtime has exceeded budget for three weeks running, concentrated around the midday discharge rush. You have a cost review with the hospital CFO\'s office in two days.',
    dataPacket: { title: 'Weekly OT Hours — Tray Line', headers: ['Week', 'Budgeted OT', 'Actual OT', 'Primary Driver'], rows: [['Week 1', '3 hrs', '10 hrs', 'Discharge-rush volume overlap'], ['Week 2', '3 hrs', '12 hrs', 'Discharge-rush + 1 call-out'], ['Week 3', '3 hrs', '11 hrs', 'Discharge-rush volume overlap']] },
    openingLine: "If you're here about overtime, someone has to make sure trays go out on time for patient care.",
    counterpartPersona: `Your tray-line supervisor, who's been staying late to cover the discharge-rush overlap rather than risk late trays affecting patient care timing.

What she actually cares about:
- Patient-facing timing not slipping, since that has clinical consequences
- Not being blamed for a structural staffing/scheduling gap
- A real fix, not just a directive to cut hours

How she behaves:
- If only the OT number is cited, she gets defensive about patient care being at risk
- If her effort is acknowledged and root cause explored together, she engages constructively`,
    successCriteria: [
      'Acknowledges her patient-care motivation before raising the budget issue',
      'Digs into the specific root cause — discharge-rush volume overlap with staffing',
      'Proposes a concrete schedule fix (shift stagger, temporary support during rush), not just "reduce hours"',
      'Sets a specific, realistic weekly OT target together',
      "Doesn't frame cost control and patient care as being in conflict",
    ],
  },
  {
    id: 'AC-L3', day: 'Leadership 3', title: 'Food Distributor Price Increase Negotiation',
    focus: 'Cost negotiation through relationship', difficulty: 'Advanced', icon: '🚚',
    industry: 'acute-care', trainingType: 'raw-material-cost-control',
    context: 'Your hospital food distributor is notifying a 7% increase across proteins and dairy, citing market pressure. Therapeutic diet items (renal, cardiac) are a growing share of spend and harder to substitute.',
    dataPacket: { title: 'Proposed Increase by Category', headers: ['Category', 'Current Monthly Spend', 'Proposed Increase', 'Flexibility'], rows: [['Therapeutic Diet Items (renal/cardiac)', '$2,100', '+12%', 'Low — clinically specific'], ['Standard Proteins', '$5,400', '+6%', 'Moderate'], ['Dairy', '$1,300', '+9%', 'Low — market pressure'], ['Dry Goods', '$2,200', '+3%', 'High — negotiable']] },
    openingLine: "Wanted to flag this before the next order — we've got a price increase coming.",
    counterpartPersona: `A vendor account manager, relationship-oriented but constrained by his own company's margins and genuine market conditions on some items.

What he actually cares about:
- Keeping the hospital account without an unsustainable loss
- Being seen as a partner
- Not returning to his own leadership empty-handed

How he behaves:
- If the GM comes with specifics distinguishing genuine constraints from padded increases, he engages honestly
- If the GM just objects broadly, he holds the line`,
    successCriteria: [
      'Comes prepared with data distinguishing genuinely constrained items from flexible ones',
      'Protects therapeutic/clinical diet items where substitution isn\'t clinically safe, negotiating elsewhere',
      'Proposes concrete trade-offs — volume, timing, substitution on flexible items',
      'Maintains the relationship rather than treating this adversarially',
      'Reaches a specific outcome',
    ],
  },
  {
    id: 'AC-L4', day: 'Leadership 4', title: 'Rolling Out New Prep Pars to Reduce Waste',
    focus: 'Getting buy-in, not compliance', difficulty: 'Foundational', icon: '📢',
    industry: 'acute-care', trainingType: 'team-buy-in',
    context: 'A waste audit showed significant over-prepping relative to actual census and NPO/diet-order changes. You\'re introducing new prep-par sheets tied to daily census at today\'s huddle.',
    dataPacket: null,
    openingLine: "So what is it this time — another sheet to fill out?",
    counterpartPersona: `Represents the team's collective sentiment through a senior tray-line staffer, skeptical of yet another process change.

What the team actually cares about:
- Whether this is real or just more paperwork
- Whether it makes an already fast-paced shift harder
- Being asked, not just told

How they behave:
- If framed only as "reduce waste for the hospital," the room stays flat
- If tied to real census/diet-order accuracy and protected hours, they engage`,
    successCriteria: [
      'Frames the "why" in terms the team cares about',
      'Makes the process concrete and tied to real census data, not arbitrary',
      'Invites real input on implementation',
      'Connects waste reduction to something tangible for the team',
      'Addresses skepticism directly',
    ],
  },
  {
    id: 'AC-L5', day: 'Leadership 5', title: 'Performance Conversation — Repeated Lateness',
    focus: 'Accountability without punitive tone', difficulty: 'Foundational', icon: '📝',
    industry: 'acute-care', trainingType: 'team-accountability',
    context: 'A tray-line staffer has been late four times in three weeks, delaying the start of morning tray assembly and affecting timing for patients on strict meal schedules.',
    dataPacket: null,
    openingLine: "I know, I'm sorry — it won't happen again.",
    counterpartPersona: `A tray-line staffer with real personal scheduling constraints, apologetic each time but the pattern hasn't changed.

What she actually cares about:
- Not losing the job
- Not feeling like a bad person
- A workable schedule

How she behaves:
- If the GM accepts the surface apology again, nothing changes
- If the GM names the specific pattern directly, she opens up about her real constraints`,
    successCriteria: [
      'Does not accept a vague apology as resolution — names the specific pattern',
      'Explores the actual root cause',
      'Sets a clear expectation and real consequence, noting the clinical timing stakes',
      'Documents appropriately without it feeling like a threat',
      'Stays respectful and solution-oriented',
    ],
  },
  {
    id: 'AC-L6', day: 'Leadership 6', title: 'Weekend Staffing Shortage — Two Call-Outs Before Breakfast Trays',
    focus: 'Fast, decisive operational leadership', difficulty: 'Advanced', icon: '🚨',
    industry: 'acute-care', trainingType: 'labor-cost-management',
    context: 'Sunday morning, breakfast trays including insulin-timed diabetic trays go out in 30 minutes, and two tray-line staff have called out. Your remaining supervisor needs a fast decision.',
    dataPacket: null,
    openingLine: "We're down two and trays go out in 30 minutes — what do you want me to do?",
    counterpartPersona: `Your remaining supervisor — capable, stressed, aware that insulin-timed trays cannot be late.

What she needs:
- A specific plan immediately
- Clarity on which trays are clinically non-negotiable on timing
- Confidence the "why" conversation happens later

How she behaves:
- If the GM hesitates, her anxiety increases given the clinical stakes
- If the GM decides fast and clearly, she executes confidently`,
    successCriteria: [
      'Makes a fast decision prioritizing insulin-timed and other clinically time-sensitive trays first',
      'Communicates the plan clearly under pressure',
      'Handles the crisis first rather than the root-cause conversation',
      'Avoids panicking',
      'Commits to a specific follow-up after service',
    ],
  },
  {
    id: 'AC-L7', day: 'Leadership 7', title: "Supervisor Didn't Follow Through on Allergen Retraining",
    focus: 'Delegation accountability', difficulty: 'Advanced', icon: '🔁',
    industry: 'acute-care', trainingType: 'team-accountability',
    context: "Two weeks ago you delegated allergen-labeling retraining to your tray-line supervisor after a documented cross-contact finding. Today's mock Joint Commission walk-through found it still hasn't happened.",
    dataPacket: null,
    openingLine: "I know I said I'd get to it — things have just been really busy.",
    counterpartPersona: `Your tray-line supervisor — generally reliable, genuinely overloaded, let this specific task slip without flagging it as at-risk.

What he actually feels:
- Genuinely apologetic, not defiant
- Uncertain how serious this becomes given the survey stakes
- Slightly resentful everything feels equally urgent

How he behaves:
- If the GM just re-delegates without addressing the pattern, it happens again
- If held accountable specifically and helped prioritize, he commits to a real deadline`,
    successCriteria: [
      'Holds him accountable for the specific miss without just doing it themselves',
      'Connects urgency directly to the survey/compliance stakes',
      'Does not accept "I\'ve been busy" as a full explanation',
      'Secures a specific new deadline and check-in point',
      'Addresses the pattern directly rather than letting it slide',
    ],
  },
  {
    id: 'AC-L8', day: 'Leadership 8', title: 'Safety Shortcut — Reported Glove-Change Near-Miss',
    focus: 'Safety accountability, zero tolerance', difficulty: 'Advanced', icon: '⚠️',
    industry: 'acute-care', trainingType: 'team-accountability',
    context: 'Another staff member reported that a tray-line worker handled an allergen-flagged tray without a glove change to save time. No incident occurred, but this needs to be addressed today given the clinical risk.',
    dataPacket: null,
    openingLine: "It's fine, nothing happened — I do it fast on purpose.",
    counterpartPersona: `The tray-line worker involved — experienced, not malicious, minimizes the incident since no patient was harmed.

What he actually thinks:
- This is being blown out of proportion
- He was just trying to keep pace during rush
- He may resent whoever reported it

How he behaves:
- If treated casually because "nothing happened," he doesn't take it seriously
- If the GM is clear and firm about severity given the clinical risk, he engages seriously though may push back once`,
    successCriteria: [
      'Treats the violation with full seriousness given the clinical cross-contact risk',
      'Explores root cause — training gap vs. rush pressure',
      'Clearly reinforces zero-tolerance on glove-change protocol',
      "Protects the reporting employee's trust for future reporting",
      'Sets a specific, verifiable follow-up, not just a verbal warning',
    ],
  },

  // ─────────────────────────── CORPORATE DINING ───────────────────────────
  {
    id: 'CD-L1', day: 'Leadership 1', title: 'Portion Control Coaching — Overserving at the Grill Station',
    focus: 'Coaching without demotivating', difficulty: 'Foundational', icon: '🥘',
    industry: 'corporate-dining', trainingType: 'raw-material-cost-control',
    context: 'On a lunch walkthrough, you notice a grill-station associate consistently over-portioning to keep the line fast during the midday rush. Food cost is trending up and this station is the biggest driver.',
    dataPacket: { title: 'Portion Variance — Grill Station, Past 2 Weeks', headers: ['Item', 'Spec Portion', 'Observed Avg', 'Variance', 'Est. Weekly Cost Impact'], rows: [['Protein Entrée', '5 oz', '6.3 oz', '+26%', '$190'], ['Grain Side', '1/2 cup', '3/4 cup', '+50%', '$55']] },
    openingLine: "I'm just trying to keep the line moving during the rush — what's the issue?",
    counterpartPersona: `A grill-station associate, fast and popular with the regulars, proud of his speed and generosity.

What he actually cares about:
- Not looking slow or stingy in front of regular customers he knows by name
- Being trusted as good at his job
- A fair, specific reason, not just "corporate says so"

How he behaves:
- If corrected publicly or vaguely, he gets defensive
- If approached privately with a specific explanation and shown the portioning tool, he engages`,
    successCriteria: [
      'Addresses this privately, not during active service',
      'Explains the cost impact in terms he can act on',
      'Demonstrates the correct portioning tool/technique',
      'Explores whether this is speed pressure or a training gap',
      'Sets a specific follow-up check',
    ],
  },
  {
    id: 'CD-L2', day: 'Leadership 2', title: 'Overtime Creep — Café Coverage on Hybrid Days',
    focus: 'Cost accountability without blame', difficulty: 'Advanced', icon: '💰',
    industry: 'corporate-dining', trainingType: 'labor-cost-management',
    context: 'Café overtime has exceeded budget for three weeks, concentrated on the days employees are in-office under the hybrid schedule. You have a cost review with the Facilities Director in two days.',
    dataPacket: { title: 'Weekly OT Hours — Café Team', headers: ['Week', 'Budgeted OT', 'Actual OT', 'Primary Driver'], rows: [['Week 1', '3 hrs', '9 hrs', 'Unpredictable hybrid-day volume spikes'], ['Week 2', '3 hrs', '11 hrs', 'Volume spikes + 1 call-out'], ['Week 3', '3 hrs', '10 hrs', 'Unpredictable hybrid-day volume spikes']] },
    openingLine: "If you're here about overtime, I don't know how else to handle these unpredictable Tuesday and Thursday spikes.",
    counterpartPersona: `A café shift lead who's been staying late to cover unpredictable hybrid-day volume spikes rather than let service slip.

What she actually cares about:
- Service not falling apart on unpredictable high-volume days
- Not being blamed for scheduling unpredictability outside her control
- A real fix, not just "cut hours"

How she behaves:
- If only the OT number is cited, she gets defensive
- If her effort is acknowledged and root cause explored together, she engages constructively`,
    successCriteria: [
      'Acknowledges her effort before raising the budget issue',
      'Digs into root cause — hybrid-day volume unpredictability',
      'Proposes a concrete fix (flexible on-call staffing, data-driven scheduling by day-of-week pattern), not just "reduce OT"',
      'Sets a specific, realistic weekly OT target together',
      'Does not make her feel blamed for a scheduling pattern she doesn\'t control',
    ],
  },
  {
    id: 'CD-L3', day: 'Leadership 3', title: 'Coffee & Produce Distributor Price Increase Negotiation',
    focus: 'Cost negotiation through relationship', difficulty: 'Advanced', icon: '🚚',
    industry: 'corporate-dining', trainingType: 'raw-material-cost-control',
    context: 'Your coffee and produce distributor is notifying an 8% increase citing commodity pressure. Your café\'s food cost is tight and coffee is a high-visibility, high-loyalty item for employees.',
    dataPacket: { title: 'Proposed Increase by Category', headers: ['Category', 'Current Monthly Spend', 'Proposed Increase', 'Flexibility'], rows: [['Specialty Coffee Beans', '$1,400', '+11%', 'Low — genuine commodity pressure'], ['Produce', '$2,600', '+7%', 'Moderate'], ['Dairy/Milk Alternatives', '$900', '+9%', 'Low'], ['Dry Goods', '$1,300', '+3%', 'High — negotiable']] },
    openingLine: "Wanted to flag this before your next order — we've got a price increase coming.",
    counterpartPersona: `A vendor account manager, relationship-oriented but constrained by real commodity market pressure on some items.

What he actually cares about:
- Keeping the account without an unsustainable loss
- Being seen as a partner
- Not returning to his own leadership empty-handed

How he behaves:
- If the GM comes prepared distinguishing genuine constraints from flexible items, he engages honestly
- If the GM just objects broadly, he holds the line`,
    successCriteria: [
      'Comes prepared with data distinguishing genuinely constrained items from flexible ones',
      'Protects the coffee program\'s quality/consistency where it matters most to employee loyalty',
      'Proposes concrete trade-offs on flexible items',
      'Maintains the relationship rather than treating it adversarially',
      'Reaches a specific outcome',
    ],
  },
  {
    id: 'CD-L4', day: 'Leadership 4', title: 'Rolling Out New Prep Pars for Low-Traffic Hybrid Days',
    focus: 'Getting buy-in, not compliance', difficulty: 'Foundational', icon: '📢',
    industry: 'corporate-dining', trainingType: 'team-buy-in',
    context: 'A waste audit showed significant over-prepping on low-traffic hybrid days (Mondays/Fridays). You\'re introducing new day-of-week prep pars at today\'s pre-shift huddle.',
    dataPacket: null,
    openingLine: "So what is it this time — another sheet to fill out?",
    counterpartPersona: `Represents the team's collective sentiment through a senior café associate, skeptical of another process change.

What the team actually cares about:
- Whether this is real or just more paperwork
- Whether it makes their shift harder
- Being asked, not just told

How they behave:
- If framed only as "reduce waste for the company," the room stays flat
- If tied to real day-of-week volume data and protected hours, they engage`,
    successCriteria: [
      'Frames the "why" in terms the team cares about',
      'Makes the process concrete and tied to real day-of-week data',
      'Invites real input on implementation',
      'Connects waste reduction to something tangible for the team',
      'Addresses skepticism directly',
    ],
  },
  {
    id: 'CD-L5', day: 'Leadership 5', title: 'Performance Conversation — Repeated Lateness',
    focus: 'Accountability without punitive tone', difficulty: 'Foundational', icon: '📝',
    industry: 'corporate-dining', trainingType: 'team-accountability',
    context: 'A café associate has been late four times in three weeks, and other staff are quietly covering, delaying the morning opening for employees who count on early coffee service.',
    dataPacket: null,
    openingLine: "I know, I'm sorry — it won't happen again.",
    counterpartPersona: `A café associate with real personal scheduling constraints, apologetic each time but the pattern hasn't changed.

What he actually cares about:
- Not losing the job
- Not feeling like a bad person
- A workable schedule

How he behaves:
- If the GM accepts the surface apology again, nothing changes
- If the GM names the specific pattern directly, he opens up about his real constraints`,
    successCriteria: [
      'Does not accept a vague apology as resolution — names the specific pattern',
      'Explores the actual root cause',
      'Sets a clear expectation and real consequence if it continues',
      'Documents appropriately without it feeling like a threat',
      'Stays respectful and solution-oriented',
    ],
  },
  {
    id: 'CD-L6', day: 'Leadership 6', title: 'Staffing Shortage Before a VIP Executive Lunch',
    focus: 'Fast, decisive operational leadership', difficulty: 'Advanced', icon: '🚨',
    industry: 'corporate-dining', trainingType: 'labor-cost-management',
    context: 'A VIP executive lunch starts in 45 minutes and two café staff have called out. Your remaining lead is asking for direction, and this event is highly visible to leadership.',
    dataPacket: null,
    openingLine: "We're down two and the VIP lunch starts in 45 minutes — what do you want me to do?",
    counterpartPersona: `Your remaining shift lead — capable, stressed, aware of how visible this event is.

What she needs:
- A specific plan immediately
- Clarity on what gets prioritized versus simplified
- Confidence the "why" conversation happens later

How she behaves:
- If the GM hesitates, her anxiety increases given the visibility
- If the GM decides fast and clearly, she executes confidently`,
    successCriteria: [
      'Makes a fast, specific decision on reallocating staff to protect the VIP event',
      'Communicates the plan clearly under pressure',
      'Handles the crisis first rather than the root-cause conversation',
      'Avoids panicking given the visibility of the event',
      'Commits to a specific follow-up after the event',
    ],
  },
  {
    id: 'CD-L7', day: 'Leadership 7', title: "Supervisor Didn't Follow Through on Allergen Labeling",
    focus: 'Delegation accountability', difficulty: 'Advanced', icon: '🔁',
    industry: 'corporate-dining', trainingType: 'team-accountability',
    context: "Two weeks ago you delegated fixing allergen labeling on grab-and-go items to your shift supervisor after an employee near-miss. Today you found the labeling still hasn't been updated.",
    dataPacket: null,
    openingLine: "I know I said I'd get to it — things have just been really busy.",
    counterpartPersona: `Your shift supervisor — generally reliable, genuinely overloaded, let this specific task slip without flagging it as at-risk.

What he actually feels:
- Genuinely apologetic, not defiant
- Uncertain how serious this becomes
- Slightly resentful everything feels equally urgent

How he behaves:
- If the GM just re-delegates without addressing the pattern, it happens again
- If held accountable specifically and helped prioritize, he commits to a real deadline`,
    successCriteria: [
      'Holds him accountable for the specific miss without just doing it themselves',
      'Connects urgency directly to the near-miss and employee safety stakes',
      'Does not accept "I\'ve been busy" as a full explanation',
      'Secures a specific new deadline and check-in point',
      'Addresses the pattern directly rather than letting it slide',
    ],
  },
  {
    id: 'CD-L8', day: 'Leadership 8', title: 'Safety Shortcut — Reported Slicer Near-Miss',
    focus: 'Safety accountability, zero tolerance', difficulty: 'Advanced', icon: '⚠️',
    industry: 'corporate-dining', trainingType: 'team-accountability',
    context: 'Another staff member reported that a prep cook was seen operating the slicer without the guard to save time during rush. No injury occurred, but this needs to be addressed today.',
    dataPacket: null,
    openingLine: "It's fine, I've done it a hundred times — nobody got hurt.",
    counterpartPersona: `The prep cook involved — experienced, not malicious, minimizes the incident since nothing happened.

What he actually thinks:
- This is being blown out of proportion
- He was just trying to keep up with prep during rush
- He may resent whoever reported it

How he behaves:
- If treated casually because "no one got hurt," he doesn't take it seriously
- If the GM is clear and firm about severity, he engages seriously though may push back once`,
    successCriteria: [
      'Treats the violation with full seriousness regardless of the no-injury outcome',
      'Explores root cause — training gap vs. rush pressure',
      'Clearly reinforces zero-tolerance on guard removal',
      "Protects the reporting employee's trust for future reporting",
      'Sets a specific, verifiable follow-up rather than a verbal warning alone',
    ],
  },

  // ─────────────────────────── K-12 ───────────────────────────
  {
    id: 'K12-L1', day: 'Leadership 1', title: 'Portion Control Coaching — Overserving on the Lunch Line',
    focus: 'Coaching without demotivating', difficulty: 'Foundational', icon: '🥘',
    industry: 'k12', trainingType: 'raw-material-cost-control',
    context: 'On a lunch-line walkthrough, you notice a cafeteria worker consistently overserving entrées to keep the line moving during the short lunch period. Food cost is trending up and reimbursable-meal portion compliance also matters for USDA requirements.',
    dataPacket: { title: 'Portion Variance — Lunch Line, Past 2 Weeks', headers: ['Item', 'Spec Portion', 'Observed Avg', 'Variance', 'Est. Weekly Cost Impact'], rows: [['Entrée Protein', '3 oz', '4.2 oz', '+40%', '$165'], ['Vegetable Side', '1/2 cup', '3/4 cup', '+50%', '$45']] },
    openingLine: "I'm just trying to keep the line moving — the kids only get 20 minutes to eat.",
    counterpartPersona: `A cafeteria worker, fast and well-liked by students, genuinely wants kids to feel fed and cared for.

What she actually cares about:
- Not seeming like she's shortchanging students during their short lunch period
- Being trusted as good at her job
- A fair, specific reason, not just "the district says so"

How she behaves:
- If corrected only on cost, she gets defensive: "So we're supposed to underfeed kids to save money?"
- If shown that reimbursable meal specs are a USDA compliance requirement, not just a cost rule, she engages more seriously`,
    successCriteria: [
      'Addresses this privately, not during active lunch service',
      'Frames portion accuracy as a USDA reimbursement compliance issue, not just cost',
      'Demonstrates correct portioning technique',
      'Explores whether this is time pressure or a training gap',
      'Sets a specific follow-up check without making her feel accused of shortchanging kids',
    ],
  },
  {
    id: 'K12-L2', day: 'Leadership 2', title: 'Overtime Creep — Cafeteria Coverage During Testing Week',
    focus: 'Cost accountability without blame', difficulty: 'Advanced', icon: '💰',
    industry: 'k12', trainingType: 'labor-cost-management',
    context: 'Cafeteria overtime has exceeded budget for three weeks running during standardized testing week, when schedules and lunch timing shift unpredictably. You have a budget review with the Director of Business Services in two days.',
    dataPacket: { title: 'Weekly OT Hours — Cafeteria Staff', headers: ['Week', 'Budgeted OT', 'Actual OT', 'Primary Driver'], rows: [['Week 1', '4 hrs', '11 hrs', 'Shifted testing-week lunch schedules'], ['Week 2', '4 hrs', '13 hrs', 'Shifted schedules + 1 call-out'], ['Week 3', '4 hrs', '12 hrs', 'Shifted testing-week lunch schedules']] },
    openingLine: "If you're here about overtime, someone has to make these shifted lunch times work.",
    counterpartPersona: `A cafeteria manager who's been staying late to adjust to unpredictable testing-week lunch schedule changes rather than let service slip.

What she actually cares about:
- Meal service not falling apart during a disruptive week for the school
- Not being blamed for a scheduling disruption she didn't create
- A real fix, not just "cut hours"

How she behaves:
- If only the OT number is cited, she gets defensive
- If her effort is acknowledged and root cause explored together, she engages constructively`,
    successCriteria: [
      'Acknowledges her effort before raising the budget issue',
      'Digs into root cause — testing-week schedule disruption',
      'Proposes a concrete fix (advance schedule coordination with school admin, temporary support), not just "reduce OT"',
      'Sets a specific, realistic weekly OT target together',
      'Does not make her feel blamed for a scheduling disruption outside her control',
    ],
  },
  {
    id: 'K12-L3', day: 'Leadership 3', title: 'USDA Commodity Distributor Price Increase Negotiation',
    focus: 'Cost negotiation through relationship', difficulty: 'Advanced', icon: '🚚',
    industry: 'k12', trainingType: 'raw-material-cost-control',
    context: 'Your commodity distributor is notifying a 7% increase citing market pressure on several USDA-eligible items. Your district\'s food cost is tight and reimbursement rates don\'t automatically adjust with cost.',
    dataPacket: { title: 'Proposed Increase by Category', headers: ['Category', 'Current Monthly Spend', 'Proposed Increase', 'Flexibility'], rows: [['USDA Commodity Proteins', '$3,100', '+9%', 'Low — commodity market pressure'], ['Produce', '$1,700', '+6%', 'Moderate'], ['Dairy', '$1,200', '+8%', 'Low'], ['Dry Goods', '$1,500', '+3%', 'High — negotiable']] },
    openingLine: "Wanted to give you a heads up before the next order — we've got a price increase coming.",
    counterpartPersona: `A vendor account manager, relationship-oriented but constrained by real commodity market pressure and his own company's margins.

What he actually cares about:
- Keeping the district's account without an unsustainable loss
- Being seen as a partner
- Not returning to his own leadership empty-handed

How he behaves:
- If the GM comes prepared distinguishing genuine constraints from flexible items, he engages honestly
- If the GM just objects broadly, he holds the line`,
    successCriteria: [
      'Comes prepared with data distinguishing genuinely constrained items from flexible ones',
      'Understands and references reimbursement-rate constraints in the negotiation',
      'Proposes concrete trade-offs on flexible items',
      'Maintains the relationship rather than treating it adversarially',
      'Reaches a specific outcome',
    ],
  },
  {
    id: 'K12-L4', day: 'Leadership 4', title: 'Rolling Out New Prep Pars to Reduce Waste',
    focus: 'Getting buy-in, not compliance', difficulty: 'Foundational', icon: '📢',
    industry: 'k12', trainingType: 'team-buy-in',
    context: 'A waste audit showed significant over-prepping relative to actual daily participation counts. You\'re introducing new prep-par sheets tied to attendance data at today\'s staff meeting.',
    dataPacket: null,
    openingLine: "So what is it this time — another sheet to fill out?",
    counterpartPersona: `Represents the team's collective sentiment through a senior cafeteria worker, skeptical of another process change.

What the team actually cares about:
- Whether this is real or just more paperwork
- Whether it makes their already tight lunch-period shift harder
- Being asked, not just told

How they behave:
- If framed only as "reduce waste for the district," the room stays flat
- If tied to real attendance data and protected hours, they engage`,
    successCriteria: [
      'Frames the "why" in terms the team cares about',
      'Makes the process concrete and tied to real attendance data',
      'Invites real input on implementation',
      'Connects waste reduction to something tangible for the team',
      'Addresses skepticism directly',
    ],
  },
  {
    id: 'K12-L5', day: 'Leadership 5', title: 'Performance Conversation — Repeated Lateness',
    focus: 'Accountability without punitive tone', difficulty: 'Foundational', icon: '📝',
    industry: 'k12', trainingType: 'team-accountability',
    context: 'A cafeteria worker has been late four times in three weeks, and other staff are quietly covering, compressing prep time before the tight lunch period.',
    dataPacket: null,
    openingLine: "I know, I'm sorry — it won't happen again.",
    counterpartPersona: `A cafeteria worker with real personal scheduling constraints, apologetic each time but the pattern hasn't changed.

What she actually cares about:
- Not losing the job
- Not feeling like a bad person
- A workable schedule

How she behaves:
- If the GM accepts the surface apology again, nothing changes
- If the GM names the specific pattern directly, she opens up about her real constraints`,
    successCriteria: [
      'Does not accept a vague apology as resolution — names the specific pattern',
      'Explores the actual root cause',
      'Sets a clear expectation and real consequence if it continues',
      'Documents appropriately without it feeling like a threat',
      'Stays respectful and solution-oriented',
    ],
  },
  {
    id: 'K12-L6', day: 'Leadership 6', title: 'Staffing Shortage on a Testing-Day Breakfast Rush',
    focus: 'Fast, decisive operational leadership', difficulty: 'Advanced', icon: '🚨',
    industry: 'k12', trainingType: 'labor-cost-management',
    context: 'It\'s standardized testing day, breakfast service (required before testing starts) begins in 30 minutes, and two cafeteria staff have called out. Your remaining lead needs a fast decision.',
    dataPacket: null,
    openingLine: "We're down two and breakfast has to be done before testing starts — what do you want me to do?",
    counterpartPersona: `Your remaining cafeteria lead — capable, stressed, aware that testing schedules can't slip.

What she needs:
- A specific plan immediately
- Clarity on what gets simplified without missing the testing-day deadline
- Confidence the "why" conversation happens later

How she behaves:
- If the GM hesitates, her anxiety increases given the testing deadline
- If the GM decides fast and clearly, she executes confidently`,
    successCriteria: [
      'Makes a fast, specific decision that protects the testing-day deadline',
      'Communicates the plan clearly under pressure',
      'Handles the crisis first rather than the root-cause conversation',
      'Avoids panicking given the schedule constraint',
      'Commits to a specific follow-up after service',
    ],
  },
  {
    id: 'K12-L7', day: 'Leadership 7', title: "Supervisor Didn't Follow Through on Allergen Retraining",
    focus: 'Delegation accountability', difficulty: 'Advanced', icon: '🔁',
    industry: 'k12', trainingType: 'team-accountability',
    context: "Two weeks ago you delegated allergen-labeling retraining to your kitchen manager after a classroom-party labeling near-miss. Today you found the retraining still hasn't happened.",
    dataPacket: null,
    openingLine: "I know I said I'd get to it — things have just been really busy.",
    counterpartPersona: `Your kitchen manager — generally reliable, genuinely overloaded, let this specific task slip without flagging it as at-risk.

What he actually feels:
- Genuinely apologetic, not defiant
- Uncertain how serious this becomes given the near-miss
- Slightly resentful everything feels equally urgent

How he behaves:
- If the GM just re-delegates without addressing the pattern, it happens again
- If held accountable specifically and helped prioritize, he commits to a real deadline`,
    successCriteria: [
      'Holds him accountable for the specific miss without just doing it themselves',
      'Connects urgency directly to the near-miss and student safety stakes',
      'Does not accept "I\'ve been busy" as a full explanation',
      'Secures a specific new deadline and check-in point',
      'Addresses the pattern directly rather than letting it slide',
    ],
  },
  {
    id: 'K12-L8', day: 'Leadership 8', title: 'Safety Shortcut — Reported Slicer Near-Miss in Prep Kitchen',
    focus: 'Safety accountability, zero tolerance', difficulty: 'Advanced', icon: '⚠️',
    industry: 'k12', trainingType: 'team-accountability',
    context: 'Another staff member reported that a kitchen worker was seen using the slicer without the guard to save prep time before the lunch rush. No injury occurred, but this needs to be addressed today.',
    dataPacket: null,
    openingLine: "It's fine, I've done it a hundred times — nobody got hurt.",
    counterpartPersona: `The kitchen worker involved — experienced, not malicious, minimizes the incident since nothing happened.

What he actually thinks:
- This is being blown out of proportion
- He was just trying to keep up with prep before the lunch rush
- He may resent whoever reported it

How he behaves:
- If treated casually because "no one got hurt," he doesn't take it seriously
- If the GM is clear and firm about severity, he engages seriously though may push back once`,
    successCriteria: [
      'Treats the violation with full seriousness regardless of the no-injury outcome',
      'Explores root cause — training gap vs. prep-time pressure',
      'Clearly reinforces zero-tolerance on guard removal',
      "Protects the reporting employee's trust for future reporting",
      'Sets a specific, verifiable follow-up rather than a verbal warning alone',
    ],
  },
]

// ─── Industry Configuration ─────────────────────────────────────────────────
// Every module that isn't the scenario library (Stakeholder Mapping, Financial
// Storytelling, QBR Builder, Diagnostic, Reference Sheets) reads its content
// from here, keyed by the industry chosen on /industry. Add a new industry by
// adding a new key here — no page component needs to change.
//
// Shape per industry:
//   accountLabel / accountPlaceholder — the "Account / ___" field across pages
//   siteTerm            — short noun used inline in coaching copy ("campus", "community"...)
//   decisionMakerTitle   — who the GM is translating numbers for, used in financial coaching copy
//   stakeholderRoles     — formal stakeholder table for the Stakeholder Mapping module
//   financialMetrics     — the P&L translation table for the Financial Storytelling module
//   financialChallenges  — mock challenge lines for Financial Storytelling Exercise 2B
//   qbrSections           — QBR Builder section list (id stays constant across industries so state keys are stable)
//   qbrPersonas           — boardroom executives for QBR Delivery
//   diagnosticQuestions   — Pre-Course Diagnostic self-assessment items

export const INDUSTRY_CONFIG = {
  'higher-ed': {
    accountLabel: 'Account / Campus',
    accountPlaceholder: 'e.g. Riverside State University',
    siteTerm: 'campus',
    decisionMakerTitle: 'CFO',
    stakeholderRoles: [
      { key: 'president',     role: 'President / Chancellor',      cares: 'Reputation, student experience, enrollment impact' },
      { key: 'cfo',           role: 'CFO / VP Finance',             cares: 'Contract performance, budget, cost transparency — signs the contract' },
      { key: 'vp_student',    role: 'VP Student Life / Dean',       cares: 'Student satisfaction, complaints, inclusivity, programming' },
      { key: 'vp_enrollment', role: 'VP Enrollment / Admissions',   cares: 'Admissions tours, parent impressions, dining as recruitment tool' },
      { key: 'events',        role: 'Director of Events',           cares: 'Catering execution, donor dinners, high-visibility events — first to hear failures' },
      { key: 'facilities',    role: 'Director of Facilities',       cares: 'Kitchen conditions, code compliance, maintenance requests — reports directly to CFO' },
      { key: 'residence_life',role: 'Director Residence Life',      cares: 'Meal plan participation, student complaints, after-hours access' },
      { key: 'athletics',     role: 'Athletics Director',           cares: 'Team meal timing, travel meals, training table quality' },
      { key: 'student_rep',   role: 'SGA / Student Rep',            cares: 'Menu variety, hours, price, student voice in decisions' },
    ],
    financialMetrics: [
      { id: 'foodCostPct',   label: 'Food Cost %',              placeholder: 'e.g. 38.6%',        internal: 'Food cost as a % of revenue',
        defaultValue: '38.6%', defaultTranslation: '' },
      { id: 'foodCostChg',   label: 'Food Cost Change',         placeholder: 'e.g. +4.4 pts',      internal: 'Change in food cost % vs prior period in percentage points',
        defaultValue: '+4.4 pts', defaultTranslation: 'Our food cost increased 4.4 percentage points this period. Of that, 2.6 points are driven by USDA protein market increases — a national trend outside our control. The remaining 1.8 points are operational, and we have already corrected that through a supplier change effective June 1.' },
      { id: 'laborPct',      label: 'Labor %',                  placeholder: 'e.g. 31.4%',         internal: 'Labor as a % of revenue',
        defaultValue: '31.4%', defaultTranslation: 'Labor is running at 31.4% of revenue, up 1.6 percentage points. This reflects the 6.8% wage and benefit increase we absorbed this year — roughly in line with the market.' },
      { id: 'boardRevenue',  label: 'Board Dining Revenue Δ',   placeholder: 'e.g. -1.9%',         internal: 'Board dining revenue percent change vs prior period',
        defaultValue: '-1.9%', defaultTranslation: 'Residential dining revenue declined 1.9%, driven by a 2.1 percentage point drop in meal plan participation. We are addressing this through a Fall re-engagement campaign targeting students who reduced their plan.' },
      { id: 'retailRevenue', label: 'Retail Revenue Δ',         placeholder: 'e.g. +12.2%',        internal: 'Retail revenue percent change vs prior period',
        defaultValue: '+12.2%', defaultTranslation: 'Retail grew 12.2% — strong performance, though I want to flag that retail carries roughly half the margin of board dining. Revenue growth here does not translate dollar-for-dollar to the bottom line.' },
      { id: 'mealPlan',      label: 'Meal Plan Participation Δ', placeholder: 'e.g. -2.1 pts',     internal: 'Change in meal plan participation rate in percentage points',
        defaultValue: '-2.1 pts', defaultTranslation: '' },
      { id: 'cpiImpact',     label: 'CPI / Market Impact',      placeholder: 'e.g. +8.4% protein', internal: 'Market-driven cost increases outside your control',
        defaultValue: '+8.4% protein (USDA)', defaultTranslation: 'Protein costs increased 8.4% according to USDA national data — this is a market condition, not an operational one. It accounts for 2.6 of the 4.4 percentage points of food cost increase this period.' },
    ],
    financialChallenges: [
      "Revenue is up over 2%. You're outperforming. And now you're telling me you need more labor dollars? Help me understand that.",
      "Food cost is up almost five points. That's a significant move. Walk me through what's driving it.",
      "Meal plan participation is down again. Students are declining. Should I be worried about the contract?",
      "I'm looking at retail revenue up 12% but board dining down nearly 2%. What does that mean for our margins?",
    ],
    qbrSections: [
      { id: 'executiveSummary', label: 'Executive Summary', desc: 'Lead with the headline — what is the one thing leadership should take away from this QBR?',
        defaultValue: 'Q2 closed with 2.9% revenue growth against a challenging cost environment. Retail significantly outperformed at +12.2%, offsetting a modest board dining decline. Food cost increased 4.4 points — 2.6 of which are non-controllable CPI-driven protein costs. One contract scope item is pending your direction before the Fall semester.' },
      { id: 'financialPerformance', label: 'Financial Performance', desc: 'Revenue, food cost, labor — in client language, not operator language.',
        defaultValue: 'Total revenue of $847,200 represents 2.9% growth year-over-year. Retail revenue grew 12.2% to $312,000, driven by Starbucks and grab-and-go traffic. Board dining declined 1.9% as meal plan participation dropped 2.1 percentage points — a trend we are addressing through a Fall re-engagement campaign. Food cost of 38.6% reflects 2.6 percentage points of USDA protein market pressure and 1.8 percentage points of operational variance we have already corrected through a supplier change effective June 1.' },
      { id: 'experienceSection', label: 'Student Experience', desc: 'Satisfaction data, what it means, and what you are doing about it.',
        defaultValue: 'Spring satisfaction came in at 66%, an 8 percentage point decline from Fall. Speed of service drove the largest drop at 12 percentage points, concentrated at the grill and deli stations during peak lunch hours. We have implemented a revised station staffing model and added a second deli line effective this week. Our recovery target is 71% by the end of Q3, measured through the mid-semester pulse survey.' },
      { id: 'strategicInitiatives', label: 'Strategic Initiatives', desc: 'What are you building or improving that creates value beyond the contract scope?',
        defaultValue: '' },
      { id: 'lookingAhead', label: 'Looking Ahead', desc: 'What decisions do you need from leadership in the next 30-60 days?',
        defaultValue: 'Two items need your direction before August 1. First, the extended hours pilot at the Hub — we have priced three options ranging from $18K to $34K annually and need a budget decision to confirm Fall staffing. Second, the Fall meal plan pricing structure — given the 3.5% increase last year and current satisfaction data, we recommend holding pricing flat and would like your alignment before we communicate to students.' },
    ],
    qbrPersonas: [
      { id: 'cfo', label: 'CFO / VP Finance', icon: '💼', style: 'Focused on what the university pays and what it receives in return. Will probe billing increases, commodity pass-throughs, equipment maintenance reserves, retail commissions, and capital expenditure implications. Will NOT ask about the provider\'s internal margins or food cost percentages — that is confidential. Expects the GM to speak in client dollars, not operator metrics.' },
      { id: 'vp_student', label: 'VP Student Life', icon: '🎓', style: 'Cares about student satisfaction, retention impact, and whether dining supports enrollment goals. Will push hard on survey declines, ask for specific action plans with timelines, and probe whether the dining program reflects the university\'s brand.' },
      { id: 'president', label: 'President / Chancellor', icon: '🏛️', style: 'Focused on institutional reputation, donor relationships, and enrollment. Wants the headline story — are we ahead of problems or behind them? Expects the GM to speak like a strategic partner, not a vendor reporting numbers.' },
    ],
    diagnosticQuestions: [
      { id: 'financial',    label: 'Explaining billing increases to a university CFO in client language' },
      { id: 'challenge',    label: 'Responding to a CFO who questions a scope expansion request' },
      { id: 'contract',     label: 'Reading and understanding your own contract' },
      { id: 'stakeholder',  label: 'Identifying who informally influences decisions at your campus' },
      { id: 'executive',    label: 'Delivering a structured update to an executive under pressure' },
      { id: 'recovery',     label: 'Having a direct conversation about a service failure' },
      { id: 'qbr',          label: 'Presenting a QBR to a mixed executive audience' },
      { id: 'scope',        label: 'Saying "let me price that" when a client asks for more service' },
      { id: 'retention',    label: 'Seeing client retention risk signals early enough to respond' },
      { id: 'relationships',label: 'Building genuine relationships above your primary contact' },
    ],
  },

  'senior-living': {
    accountLabel: 'Account / Community',
    accountPlaceholder: 'e.g. Willowbrook Senior Living',
    siteTerm: 'community',
    decisionMakerTitle: 'Executive Director',
    stakeholderRoles: [
      { key: 'executive_director', role: 'Executive Director',                cares: 'Community reputation, occupancy, family satisfaction — top on-site decision-maker' },
      { key: 'cfo',                role: 'Regional VP Operations / CFO',      cares: 'Contract performance, budget, cost transparency — signs the contract' },
      { key: 'director_nursing',   role: 'Director of Nursing',               cares: 'Clinical coordination, resident safety, regulatory survey readiness' },
      { key: 'dietician',          role: 'Dietician / Clinical Nutrition Mgr',cares: 'Diet orders, texture-modified diets, individual nutrition care plans' },
      { key: 'activities',         role: 'Director of Life Enrichment',       cares: 'Dining as part of resident experience and community programming' },
      { key: 'admissions',         role: 'Director of Admissions & Marketing',cares: 'Dining as a differentiator on tours; first impressions for prospective families' },
      { key: 'facilities',         role: 'Director of Facilities',            cares: 'Kitchen conditions, code compliance, equipment reliability' },
      { key: 'family_council',     role: 'Family Council Chair',              cares: 'Transparency, being heard, dining quality and variety for residents' },
      { key: 'resident_council',   role: 'Resident Council President',        cares: 'Menu variety, dining hours, resident voice in decisions' },
    ],
    financialMetrics: [
      { id: 'foodCostPct',   label: 'Food Cost %',                    placeholder: 'e.g. 38.6%',        internal: 'Food cost as a % of revenue',
        defaultValue: '38.6%', defaultTranslation: '' },
      { id: 'foodCostChg',   label: 'Food Cost Change',               placeholder: 'e.g. +4.4 pts',      internal: 'Change in food cost % vs prior period in percentage points',
        defaultValue: '+4.4 pts', defaultTranslation: 'Our food cost increased 4.4 percentage points this period. Of that, 2.6 points are driven by USDA protein market increases — a national trend outside our control. The remaining 1.8 points are operational, and we have already corrected that through a supplier change effective June 1.' },
      { id: 'laborPct',      label: 'Labor %',                        placeholder: 'e.g. 31.4%',         internal: 'Labor as a % of revenue',
        defaultValue: '31.4%', defaultTranslation: 'Labor is running at 31.4% of revenue, up 1.6 percentage points. This reflects the 6.8% wage and benefit increase we absorbed this year — roughly in line with the market.' },
      { id: 'boardRevenue',  label: 'Community Dining Revenue Δ',     placeholder: 'e.g. -1.9%',         internal: 'Resident dining revenue percent change vs prior period',
        defaultValue: '-1.9%', defaultTranslation: 'Resident dining revenue declined 1.9%, tracking a 2.1 percentage point dip in occupancy this quarter rather than a dining-specific issue. We are supporting the admissions team\'s re-engagement push with tour-day dining showcases.' },
      { id: 'retailRevenue', label: 'Ancillary & Guest Meal Revenue Δ',placeholder: 'e.g. +12.2%',        internal: 'Guest meals, private dining, and ancillary revenue percent change vs prior period',
        defaultValue: '+12.2%', defaultTranslation: 'Guest and private dining revenue grew 12.2% — strong performance, though I want to flag that ancillary dining carries roughly half the margin of resident board revenue. Growth here does not translate dollar-for-dollar to the bottom line.' },
      { id: 'mealPlan',      label: 'Occupancy / Census Δ',            placeholder: 'e.g. -2.1 pts',     internal: 'Change in occupancy rate in percentage points',
        defaultValue: '-2.1 pts', defaultTranslation: '' },
      { id: 'cpiImpact',     label: 'CPI / Market Impact',            placeholder: 'e.g. +8.4% protein', internal: 'Market-driven cost increases outside your control',
        defaultValue: '+8.4% protein (USDA)', defaultTranslation: 'Protein costs increased 8.4% according to USDA national data — this is a market condition, not an operational one. It accounts for 2.6 of the 4.4 percentage points of food cost increase this period.' },
    ],
    financialChallenges: [
      "Occupancy is down again this quarter, and I'm hearing dining satisfaction might be part of why families are choosing other communities. Walk me through what you're seeing.",
      "Food cost is up almost five points. That's a real number for our budget. What's driving it?",
      "We had another survey citation this year. Should the board be worried about our regulatory standing?",
      "Ancillary and guest meal revenue is up but our core resident dining revenue is down. What does that mean for the community's margin?",
    ],
    qbrSections: [
      { id: 'executiveSummary', label: 'Executive Summary', desc: 'Lead with the headline — what is the one thing leadership should take away from this QBR?',
        defaultValue: 'Q2 closed with resident dining revenue tracking occupancy softness rather than a dining performance issue. Guest and private dining significantly outperformed at +12.2%, partially offsetting the core decline. Food cost increased 4.4 points — 2.6 of which are non-controllable CPI-driven protein costs. One survey finding requires your sign-off on a corrective action plan.' },
      { id: 'financialPerformance', label: 'Financial Performance', desc: 'Revenue, food cost, labor — in client language, not operator language.',
        defaultValue: 'Total dining revenue of $847,200 represents 2.9% growth year-over-year. Guest and ancillary dining grew 12.2% to $312,000. Core resident dining declined 1.9% as occupancy dropped 2.1 percentage points this quarter. Food cost of 38.6% reflects 2.6 percentage points of USDA protein market pressure and 1.8 percentage points of operational variance we have already corrected through a supplier change effective June 1.' },
      { id: 'experienceSection', label: 'Resident & Family Experience', desc: 'Satisfaction data, what it means, and what you are doing about it.',
        defaultValue: 'Spring resident satisfaction came in at 66%, an 8 percentage point decline from Fall. Menu variety and speed at peak dining hours drove the largest drop. We have implemented a revised dining-room staffing model and added a resident menu-tasting panel effective this week. Our recovery target is 71% by the end of Q3, measured through the mid-quarter resident survey.' },
      { id: 'strategicInitiatives', label: 'Strategic Initiatives', desc: 'What are you building or improving that creates value beyond the contract scope?',
        defaultValue: '' },
      { id: 'lookingAhead', label: 'Looking Ahead', desc: 'What decisions do you need from leadership in the next 30-60 days?',
        defaultValue: 'Two items need your direction before August 1. First, the tour-day dining showcase — we have priced three options ranging from $8K to $22K annually and need a budget decision to support admissions. Second, the Fall texture-modified diet documentation process — given this year\'s survey finding, we recommend a formal nursing-dietary reconciliation cadence and would like your alignment before rollout.' },
    ],
    qbrPersonas: [
      { id: 'executive_director', label: 'Executive Director', icon: '🏡', style: 'Focused on community reputation, family trust, and occupancy. Will probe resident/family satisfaction trends, survey readiness, and whether dining is helping or hurting tours. Expects the GM to speak in resident- and family-facing terms, not operator metrics.' },
      { id: 'regional_vp', label: 'Regional VP Operations / CFO', icon: '💼', style: 'Focused on what the community pays and receives in return. Will probe billing increases, commodity pass-throughs, capital/equipment reserves, and occupancy-linked revenue trends. Will NOT ask about the provider\'s internal margins or food cost percentages.' },
      { id: 'director_nursing', label: 'Director of Nursing', icon: '🩺', style: 'Focused on clinical coordination and regulatory readiness — diet order accuracy, texture-modified diet documentation, and how dining supports the interdisciplinary care team. Pushes hard on any open survey findings.' },
    ],
    diagnosticQuestions: [
      { id: 'financial',    label: 'Explaining billing increases to an Executive Director or Regional VP in client language' },
      { id: 'challenge',    label: 'Responding to a Regional VP who questions a scope expansion request' },
      { id: 'contract',     label: 'Reading and understanding your own contract' },
      { id: 'stakeholder',  label: 'Identifying who informally influences decisions at your community' },
      { id: 'executive',    label: 'Delivering a structured update to an executive under pressure' },
      { id: 'recovery',     label: 'Having a direct conversation about a service failure or safety concern' },
      { id: 'qbr',          label: 'Presenting a QBR to a mixed executive audience' },
      { id: 'scope',        label: 'Saying "let me price that" when a client asks for more service' },
      { id: 'retention',    label: 'Seeing occupancy and satisfaction risk signals early enough to respond' },
      { id: 'relationships',label: 'Building genuine relationships with families and residents, not just administration' },
    ],
  },

  'acute-care': {
    accountLabel: 'Account / Facility',
    accountPlaceholder: 'e.g. St. Anne Regional Medical Center',
    siteTerm: 'facility',
    decisionMakerTitle: 'CFO',
    stakeholderRoles: [
      { key: 'cno',                role: 'CNO (Chief Nursing Officer)',        cares: 'Patient safety, clinical timing, nursing satisfaction with meal service' },
      { key: 'cfo',                role: 'CFO / VP Finance',                   cares: 'Contract performance, budget, cost transparency — signs the contract' },
      { key: 'nutrition_director', role: 'Director of Nutrition & Food Svcs',  cares: 'Therapeutic diet orders, clinical coordination — dining\'s internal clinical partner' },
      { key: 'infection_prevention',role: 'Infection Preventionist',           cares: 'Food safety, cross-contamination risk, survey readiness' },
      { key: 'patient_experience', role: 'Patient Experience Director',        cares: 'Patient and family satisfaction, service recovery, HCAHPS scores' },
      { key: 'nurse_manager',      role: 'Nurse Manager (unit-level)',         cares: 'Tray timing, coordination with medication and discharge schedules' },
      { key: 'supply_chain',       role: 'Materials Management / Supply Chain',cares: 'Vendor reliability, equipment maintenance, procurement' },
      { key: 'compliance',         role: 'Joint Commission / Compliance Liaison',cares: 'Regulatory readiness, documentation, corrective action plans' },
      { key: 'physician_champion', role: 'Physician Champion (Clinical Nutrition)',cares: 'Clinical diet accuracy, physician order compliance' },
    ],
    financialMetrics: [
      { id: 'foodCostPct',   label: 'Food Cost %',                       placeholder: 'e.g. 38.6%',        internal: 'Food cost as a % of revenue',
        defaultValue: '38.6%', defaultTranslation: '' },
      { id: 'foodCostChg',   label: 'Food Cost Change',                  placeholder: 'e.g. +4.4 pts',      internal: 'Change in food cost % vs prior period in percentage points',
        defaultValue: '+4.4 pts', defaultTranslation: 'Our food cost increased 4.4 percentage points this period. Of that, 2.6 points are driven by USDA protein market increases — a national trend outside our control. The remaining 1.8 points are operational, and we have already corrected that through a supplier change effective June 1.' },
      { id: 'laborPct',      label: 'Labor %',                           placeholder: 'e.g. 31.4%',         internal: 'Labor as a % of revenue',
        defaultValue: '31.4%', defaultTranslation: 'Labor is running at 31.4% of revenue, up 1.6 percentage points. This reflects the 6.8% wage and benefit increase we absorbed this year — roughly in line with the market.' },
      { id: 'boardRevenue',  label: 'Patient Meal Program Billing Δ',    placeholder: 'e.g. -1.9%',         internal: 'Patient meal program billing percent change vs prior period',
        defaultValue: '-1.9%', defaultTranslation: 'Patient meal program billing declined 1.9%, tracking a census dip this quarter rather than a service issue. Tray delivery timing has held steady through the change.' },
      { id: 'retailRevenue', label: 'Retail / Café Revenue Δ',           placeholder: 'e.g. +12.2%',        internal: 'Staff and visitor cafeteria revenue percent change vs prior period',
        defaultValue: '+12.2%', defaultTranslation: 'Staff and visitor café revenue grew 12.2% — strong performance, though it carries roughly half the margin of the patient meal program. Growth here does not translate dollar-for-dollar to the bottom line.' },
      { id: 'mealPlan',      label: 'On-Time Tray Delivery Rate Δ',      placeholder: 'e.g. -2.1 pts',      internal: 'Change in on-time tray delivery rate in percentage points',
        defaultValue: '-2.1 pts', defaultTranslation: '' },
      { id: 'cpiImpact',     label: 'CPI / Market Impact',               placeholder: 'e.g. +8.4% protein', internal: 'Market-driven cost increases outside your control',
        defaultValue: '+8.4% protein (USDA)', defaultTranslation: 'Protein costs increased 8.4% according to USDA national data — this is a market condition, not an operational one. It accounts for 2.6 of the 4.4 percentage points of food cost increase this period.' },
    ],
    financialChallenges: [
      "Meal program billing is up again this period. Help me understand what's driving that increase for the hospital.",
      "Food cost is up almost five points. Walk me through what's behind it.",
      "We've had two late-tray incidents this month that touched patient care timing. Should I be worried about a pattern?",
      "Retail café revenue is up but our patient meal program billing is climbing too. What does that mean for our overall food services spend?",
    ],
    qbrSections: [
      { id: 'executiveSummary', label: 'Executive Summary', desc: 'Lead with the headline — what is the one thing leadership should take away from this QBR?',
        defaultValue: 'Q2 closed with patient meal program billing tracking a modest census dip rather than a service issue. Retail café revenue significantly outperformed at +12.2%, partially offsetting the core decline. Food cost increased 4.4 points — 2.6 of which are non-controllable CPI-driven protein costs. One tray-timing corrective action is pending your review before the next Joint Commission mock survey.' },
      { id: 'financialPerformance', label: 'Financial Performance', desc: 'Revenue, food cost, labor — in client language, not operator language.',
        defaultValue: 'Total food services revenue of $847,200 represents 2.9% growth year-over-year. Retail café revenue grew 12.2% to $312,000, driven by staff and visitor traffic. Patient meal program billing declined 1.9% alongside a census dip. Food cost of 38.6% reflects 2.6 percentage points of USDA protein market pressure and 1.8 percentage points of operational variance we have already corrected through a supplier change effective June 1.' },
      { id: 'experienceSection', label: 'Patient & Clinical Experience', desc: 'Satisfaction and timing data, what it means, and what you are doing about it.',
        defaultValue: 'On-time tray delivery came in at 66% during peak discharge windows, an 8 percentage point decline from last quarter, concentrated on med-surg during the midday discharge rush. We have implemented a revised tray-line staffing model for that window effective this week. Our recovery target is 92% on-time delivery by end of Q3, tracked through the daily tray-timing log.' },
      { id: 'strategicInitiatives', label: 'Strategic Initiatives', desc: 'What are you building or improving that creates value beyond the contract scope?',
        defaultValue: '' },
      { id: 'lookingAhead', label: 'Looking Ahead', desc: 'What decisions do you need from leadership in the next 30-60 days?',
        defaultValue: 'Two items need your direction before August 1. First, the discharge-rush tray-line staffing adjustment — we have priced three options ranging from $18K to $34K annually and need a budget decision. Second, the allergen cross-contact corrective action plan flagged by Infection Prevention — we recommend a documented tray-check protocol with a follow-up audit and would like your alignment before the mock survey.' },
    ],
    qbrPersonas: [
      { id: 'cfo', label: 'CFO / VP Finance', icon: '💼', style: 'Focused on what the hospital pays and receives in return. Will probe billing increases, commodity pass-throughs, equipment maintenance reserves, and capital expenditure implications. Will NOT ask about the provider\'s internal margins or food cost percentages.' },
      { id: 'cno', label: 'CNO (Chief Nursing Officer)', icon: '🩺', style: 'Focused on patient safety and clinical timing — tray delivery windows, coordination with med/discharge schedules, and nursing satisfaction with the food service partnership. Pushes hard on any pattern of clinical-timing misses.' },
      { id: 'patient_experience', label: 'Patient Experience Director', icon: '💬', style: 'Focused on patient and family satisfaction and HCAHPS impact. Will push for specific, verifiable service-recovery mechanisms and wants language she can relay directly to families.' },
    ],
    diagnosticQuestions: [
      { id: 'financial',    label: 'Explaining billing increases to a hospital CFO in client language' },
      { id: 'challenge',    label: 'Responding to a CFO who questions a scope expansion request' },
      { id: 'contract',     label: 'Reading and understanding your own contract' },
      { id: 'stakeholder',  label: 'Identifying who informally influences decisions at your facility' },
      { id: 'executive',    label: 'Delivering a structured update to an executive under pressure' },
      { id: 'recovery',     label: 'Having a direct conversation about a patient-facing service failure' },
      { id: 'qbr',          label: 'Presenting a QBR to a mixed executive audience' },
      { id: 'scope',        label: 'Saying "let me price that" when a client asks for more service' },
      { id: 'retention',    label: 'Seeing client retention risk signals early enough to respond' },
      { id: 'relationships',label: 'Building genuine relationships above your primary contact, including with nursing' },
    ],
  },

  'corporate-dining': {
    accountLabel: 'Account / Corporate Site',
    accountPlaceholder: 'e.g. Meridian Technologies HQ',
    siteTerm: 'corporate site',
    decisionMakerTitle: 'Facilities Director',
    stakeholderRoles: [
      { key: 'facilities_director', role: 'Facilities Director',              cares: 'Contract performance, budget, vendor relationship — signs the contract' },
      { key: 'vp_workplace',        role: 'VP Real Estate & Workplace Exp.',  cares: 'Café as part of the broader workplace and return-to-office strategy' },
      { key: 'hr_partner',          role: 'HR Business Partner',              cares: 'Employee engagement, satisfaction survey results, communication' },
      { key: 'executive_assistant', role: 'Executive Assistant to Leadership',cares: 'Flawless execution of VIP and executive dining, board-level events' },
      { key: 'site_ops',            role: 'Site Operations Manager',          cares: 'Day-to-day café operations, facilities coordination' },
      { key: 'engagement_committee',role: 'Employee Engagement Committee Lead',cares: 'Employee-facing programming, feedback loop, morale' },
      { key: 'sustainability',      role: 'Sustainability / ESG Officer',     cares: 'Waste reduction, sourcing, sustainability reporting' },
      { key: 'badge_admin',         role: 'IT / Badge Systems Administrator', cares: 'Badge-swipe and payment system reliability and data accuracy' },
      { key: 'executive_sponsor',   role: 'C-Suite Executive Sponsor',        cares: 'Café as a talent and retention asset; high-visibility events' },
    ],
    financialMetrics: [
      { id: 'foodCostPct',   label: 'Food Cost %',                     placeholder: 'e.g. 38.6%',        internal: 'Food cost as a % of revenue',
        defaultValue: '38.6%', defaultTranslation: '' },
      { id: 'foodCostChg',   label: 'Food Cost Change',                placeholder: 'e.g. +4.4 pts',      internal: 'Change in food cost % vs prior period in percentage points',
        defaultValue: '+4.4 pts', defaultTranslation: 'Our food cost increased 4.4 percentage points this period. Of that, 2.6 points are driven by USDA protein market increases — a national trend outside our control. The remaining 1.8 points are operational, and we have already corrected that through a supplier change effective June 1.' },
      { id: 'laborPct',      label: 'Labor %',                         placeholder: 'e.g. 31.4%',         internal: 'Labor as a % of revenue',
        defaultValue: '31.4%', defaultTranslation: 'Labor is running at 31.4% of revenue, up 1.6 percentage points. This reflects the 6.8% wage and benefit increase we absorbed this year — roughly in line with the market.' },
      { id: 'boardRevenue',  label: 'Café Subsidy Cost per Employee Δ',placeholder: 'e.g. +18.3%',        internal: 'Change in company subsidy cost per employee per month',
        defaultValue: '+18.3%', defaultTranslation: 'Subsidy cost per employee is up 18.3%, driven by fixed overhead spreading across fewer daily transactions as badge-swipe participation declined. This is a hybrid-schedule effect, not a cost-control issue, and we have a plan to address it directly.' },
      { id: 'retailRevenue', label: 'Grab-and-Go / Retail Revenue Δ',  placeholder: 'e.g. +12.2%',        internal: 'Retail and grab-and-go revenue percent change vs prior period',
        defaultValue: '+12.2%', defaultTranslation: 'Grab-and-go revenue grew 12.2% — strong performance, driven by hybrid-day demand, though it carries a different margin profile than sit-down café service.' },
      { id: 'mealPlan',      label: 'Badge-Swipe Participation Δ',     placeholder: 'e.g. -2.1 pts',      internal: 'Change in daily badge-swipe café participation rate in percentage points',
        defaultValue: '-2.1 pts', defaultTranslation: '' },
      { id: 'cpiImpact',     label: 'CPI / Market Impact',             placeholder: 'e.g. +8.4% protein', internal: 'Market-driven cost increases outside your control',
        defaultValue: '+8.4% protein (USDA)', defaultTranslation: 'Protein costs increased 8.4% according to USDA national data — this is a market condition, not an operational one. It accounts for 2.6 of the 4.4 percentage points of food cost increase this period.' },
    ],
    financialChallenges: [
      "Badge-swipe participation is down 13 points and my subsidy cost per employee is up almost 20%. Before I recommend an RFP, convince me this is fixable.",
      "Food cost is up almost five points. Walk me through what's driving it.",
      "Retail revenue is up 12% but overall café utilization is down. What does that actually tell us?",
      "The engagement survey showed a real drop in café satisfaction right after the price change. Should I be worried heading into renewal?",
    ],
    qbrSections: [
      { id: 'executiveSummary', label: 'Executive Summary', desc: 'Lead with the headline — what is the one thing leadership should take away from this QBR?',
        defaultValue: 'Q2 closed with badge-swipe participation down 13 points, tracking the shift to hybrid 3-day schedules, which pushed subsidy cost per employee up 18.3%. Grab-and-go revenue significantly outperformed at +12.2%. Food cost increased 4.4 points — 2.6 of which are non-controllable CPI-driven protein costs. One extended-hours pilot decision is pending your direction.' },
      { id: 'financialPerformance', label: 'Financial Performance', desc: 'Revenue, food cost, labor — in client language, not operator language.',
        defaultValue: 'Total café revenue of $847,200 represents 2.9% growth year-over-year. Grab-and-go revenue grew 12.2% to $312,000, driven by hybrid-day traffic. Badge-swipe participation dropped 13 points, coinciding with the return-to-office policy change, pushing subsidy cost per employee up 18.3%. Food cost of 38.6% reflects 2.6 percentage points of USDA protein market pressure and 1.8 percentage points of operational variance we have already corrected through a supplier change effective June 1.' },
      { id: 'experienceSection', label: 'Employee Experience', desc: 'Satisfaction data, what it means, and what you are doing about it.',
        defaultValue: 'Café satisfaction came in at 69% on the biannual engagement survey, a 9 percentage point decline, concentrated on menu repetition and limited grab-and-go options on hybrid days. We have implemented an expanded grab-and-go line and a new menu rotation cadence effective this week. Our recovery target is 76% on the next engagement survey cycle.' },
      { id: 'strategicInitiatives', label: 'Strategic Initiatives', desc: 'What are you building or improving that creates value beyond the contract scope?',
        defaultValue: '' },
      { id: 'lookingAhead', label: 'Looking Ahead', desc: 'What decisions do you need from leadership in the next 30-60 days?',
        defaultValue: 'Two items need your direction before August 1. First, the hybrid-day grab-and-go expansion — we have priced three options ranging from $18K to $34K annually and need a budget decision. Second, the subsidy structure for hybrid schedules — given the participation trend, we recommend a per-visit model over the current flat subsidy and would like your alignment before communicating to employees.' },
    ],
    qbrPersonas: [
      { id: 'facilities_director', label: 'Facilities Director', icon: '📋', style: 'Focused on what the company pays and receives in return. Will probe utilization trends, subsidy cost per employee, and whether an RFP recommendation is warranted. Will NOT ask about the provider\'s internal margins or food cost percentages.' },
      { id: 'hr_partner', label: 'HR Business Partner', icon: '💬', style: 'Focused on employee engagement and satisfaction. Will push for a credible, employee-facing story on any survey decline and specific plans she can present at an all-hands.' },
      { id: 'executive_sponsor', label: 'C-Suite Executive Sponsor', icon: '🏢', style: 'Focused on the café as a talent and retention asset, and on flawless execution of high-visibility executive events. Wants the headline story — is the café an asset or a liability right now?' },
    ],
    diagnosticQuestions: [
      { id: 'financial',    label: 'Explaining subsidy cost increases to a Facilities Director in client language' },
      { id: 'challenge',    label: 'Responding to a Facilities Director who questions a scope expansion request' },
      { id: 'contract',     label: 'Reading and understanding your own contract' },
      { id: 'stakeholder',  label: 'Identifying who informally influences decisions at your corporate site' },
      { id: 'executive',    label: 'Delivering a structured update to an executive under pressure' },
      { id: 'recovery',     label: 'Having a direct conversation about a service failure, including VIP events' },
      { id: 'qbr',          label: 'Presenting a QBR to a mixed executive audience' },
      { id: 'scope',        label: 'Saying "let me price that" when a client asks for more service' },
      { id: 'retention',    label: 'Seeing RFP and contract-renewal risk signals early enough to respond' },
      { id: 'relationships',label: 'Building genuine relationships above your primary contact' },
    ],
  },

  'k12': {
    accountLabel: 'Account / District',
    accountPlaceholder: 'e.g. Meridian Unified School District',
    siteTerm: 'district',
    decisionMakerTitle: 'Superintendent',
    stakeholderRoles: [
      { key: 'superintendent',     role: 'Superintendent',                    cares: 'District reputation, board relations, compliance risk — ultimate decision-maker' },
      { key: 'cfo',                role: 'Director of Business Services/CFO', cares: 'Contract performance, budget, USDA reimbursement — signs the contract' },
      { key: 'nutrition_director', role: 'Director of Nutrition Services',    cares: 'Menu compliance, F&R eligibility, USDA program administration' },
      { key: 'principal',          role: 'Principal (site-level)',            cares: 'Cafeteria operations, student behavior and scheduling at their school' },
      { key: 'school_nurse',       role: 'School Nurse',                      cares: 'Allergy management, 504 plans, health-related food incidents' },
      { key: 'student_services',   role: 'Director of Student Services',      cares: 'Allergy and 504 accommodations, special dietary needs' },
      { key: 'board_member',       role: 'School Board Member',               cares: 'Public accountability, transparency, constituent concerns' },
      { key: 'pta_chair',          role: 'PTA / Parent Advisory Chair',       cares: 'Menu variety, transparency, parent voice in decisions' },
      { key: 'facilities',         role: 'Facilities / Maintenance Director', cares: 'Kitchen conditions, code compliance, equipment reliability' },
    ],
    financialMetrics: [
      { id: 'foodCostPct',   label: 'Food Cost %',                        placeholder: 'e.g. 38.6%',        internal: 'Food cost as a % of revenue',
        defaultValue: '38.6%', defaultTranslation: '' },
      { id: 'foodCostChg',   label: 'Food Cost Change',                   placeholder: 'e.g. +4.4 pts',      internal: 'Change in food cost % vs prior period in percentage points',
        defaultValue: '+4.4 pts', defaultTranslation: 'Our food cost increased 4.4 percentage points this period. Of that, 2.6 points are driven by USDA protein market increases — a national trend outside our control. The remaining 1.8 points are operational, and we have already corrected that through a supplier change effective June 1.' },
      { id: 'laborPct',      label: 'Labor %',                            placeholder: 'e.g. 31.4%',         internal: 'Labor as a % of revenue',
        defaultValue: '31.4%', defaultTranslation: 'Labor is running at 31.4% of revenue, up 1.6 percentage points. This reflects the 6.8% wage and benefit increase we absorbed this year — roughly in line with the market.' },
      { id: 'boardRevenue',  label: 'Reimbursable Meal Program Revenue Δ',placeholder: 'e.g. -1.9%',        internal: 'USDA reimbursable meal program revenue percent change vs prior period',
        defaultValue: '-1.9%', defaultTranslation: 'Reimbursable meal program revenue declined 1.9%, driven by a 2.1 percentage point drop in daily participation. We are addressing this through a Fall re-engagement campaign at the two schools with the largest drop.' },
      { id: 'retailRevenue', label: 'À La Carte Revenue Δ',               placeholder: 'e.g. +12.2%',        internal: 'À la carte and vending revenue percent change vs prior period',
        defaultValue: '+12.2%', defaultTranslation: 'À la carte revenue grew 12.2% following the mid-year price adjustment — strong performance, though I want to flag that à la carte carries a different margin profile than the reimbursable program.' },
      { id: 'mealPlan',      label: 'Daily Meal Participation Rate Δ',    placeholder: 'e.g. -2.1 pts',      internal: 'Change in average daily participation (ADP) in percentage points',
        defaultValue: '-2.1 pts', defaultTranslation: '' },
      { id: 'cpiImpact',     label: 'CPI / Market Impact',                placeholder: 'e.g. +8.4% protein', internal: 'Market-driven cost increases outside your control',
        defaultValue: '+8.4% protein (USDA)', defaultTranslation: 'Protein costs increased 8.4% according to USDA national data — this is a market condition, not an operational one. It accounts for 2.6 of the 4.4 percentage points of food cost increase this period.' },
    ],
    financialChallenges: [
      "Daily meal participation is down again. Should I be worried about our USDA reimbursement position?",
      "Food cost is up almost five points. Walk me through what's driving it, since commodity prices are the first thing the board will ask about.",
      "À la carte revenue changed mid-year along with pricing. Help me understand the reimbursement risk if participation keeps dropping.",
      "We had a reimbursement documentation gap flagged this year. Should the board be concerned about our compliance standing?",
    ],
    qbrSections: [
      { id: 'executiveSummary', label: 'Executive Summary', desc: 'Lead with the headline — what is the one thing leadership should take away from this QBR?',
        defaultValue: 'Q2 closed with 2.9% revenue growth against a challenging cost environment. À la carte significantly outperformed at +12.2% following the mid-year price adjustment, offsetting a modest decline in reimbursable meal program revenue. Food cost increased 4.4 points — 2.6 of which are non-controllable CPI-driven protein costs. One F&R eligibility documentation item is pending your direction before the next board meeting.' },
      { id: 'financialPerformance', label: 'Financial Performance', desc: 'Revenue, food cost, labor — in client language, not operator language.',
        defaultValue: 'Total program revenue of $847,200 represents 2.9% growth year-over-year. À la carte revenue grew 12.2% to $312,000 following the mid-year price adjustment. Reimbursable meal program revenue declined 1.9% as daily participation dropped 2.1 percentage points — a trend we are addressing through a Fall re-engagement campaign at the two affected schools. Food cost of 38.6% reflects 2.6 percentage points of USDA protein market pressure and 1.8 percentage points of operational variance we have already corrected through a supplier change effective June 1.' },
      { id: 'experienceSection', label: 'Student & Family Experience', desc: 'Satisfaction data, what it means, and what you are doing about it.',
        defaultValue: 'Spring satisfaction came in at 66%, an 8 percentage point decline from Fall. Menu variety and lunch-line speed drove the largest drop, concentrated at two elementary schools during peak lunch periods. We have implemented a revised staffing model and added a second serving line effective this week. Our recovery target is 71% by the end of Q3, measured through the mid-semester family survey.' },
      { id: 'strategicInitiatives', label: 'Strategic Initiatives', desc: 'What are you building or improving that creates value beyond the contract scope?',
        defaultValue: '' },
      { id: 'lookingAhead', label: 'Looking Ahead', desc: 'What decisions do you need from leadership in the next 30-60 days?',
        defaultValue: 'Two items need your direction before August 1. First, the F&R eligibility re-verification tracking process — we have priced two options and need a decision to confirm rollout before the next audit cycle. Second, the Fall à la carte pricing structure — given current participation data, we recommend holding pricing flat and would like your alignment before we communicate to families.' },
    ],
    qbrPersonas: [
      { id: 'superintendent', label: 'Superintendent', icon: '🏛️', style: 'Focused on district reputation, board relations, and getting ahead of problems before they reach the board. Wants the headline story and board-ready language on any compliance or participation issue.' },
      { id: 'business_services', label: 'Director of Business Services / CFO', icon: '💼', style: 'Focused on what the district pays and receives in return — reimbursement exposure, billing, and budget. Will NOT ask about the provider\'s internal margins or food cost percentages.' },
      { id: 'board_member', label: 'School Board Member', icon: '📣', style: 'Focused on public accountability and constituent concerns. Wants language that is credible and transparent enough to use in a public board meeting.' },
    ],
    diagnosticQuestions: [
      { id: 'financial',    label: 'Explaining reimbursement or billing changes to a Superintendent in client language' },
      { id: 'challenge',    label: 'Responding to a Superintendent or Business Services Director who questions a scope expansion request' },
      { id: 'contract',     label: 'Reading and understanding your own contract' },
      { id: 'stakeholder',  label: 'Identifying who informally influences decisions at your district' },
      { id: 'executive',    label: 'Delivering a structured update to an executive under pressure' },
      { id: 'recovery',     label: 'Having a direct conversation about a service failure or safety incident' },
      { id: 'qbr',          label: 'Presenting a QBR to a mixed executive audience' },
      { id: 'scope',        label: 'Saying "let me price that" when a client asks for more service' },
      { id: 'retention',    label: 'Seeing client retention and compliance risk signals early enough to respond' },
      { id: 'relationships',label: 'Building genuine relationships above your primary contact, including with families' },
    ],
  },
}

// ─── Industry config helpers ────────────────────────────────────────────────
// sessionStorage is only available client-side, so pages read the selected
// industry in a useEffect (see the pattern already used on /training-type)
// and default to 'higher-ed' until that runs. getIndustryConfig always
// falls back to 'higher-ed' for an unknown/missing id so a page never
// renders with an undefined config.

export function getSelectedIndustryId() {
  if (typeof window === 'undefined') return 'higher-ed'
  return sessionStorage.getItem('selectedIndustry') || 'higher-ed'
}

export function getIndustryConfig(industryId) {
  return INDUSTRY_CONFIG[industryId] || INDUSTRY_CONFIG['higher-ed']
}

// ─── Shared API call ──────────────────────────────────────────────────────────
export async function callAI({ system, messages, max_tokens = 1200 }) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages, max_tokens }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.content?.map(b => b.text || '').join('') || ''
}
