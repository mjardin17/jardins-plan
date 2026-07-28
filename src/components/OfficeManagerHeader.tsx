import React, { useState } from 'react';
import { 
  Bot, CheckSquare, Sparkles, AlertTriangle, ArrowRight, Check,
  Play, DollarSign, Zap, Bell, CheckCircle2, Clock, Mail, MessageSquare, 
  Settings, UserCheck, ShieldAlert
} from 'lucide-react';

interface OfficeManagerHeaderProps {
  activeTab: string;
  businessName?: string;
  onRefreshData?: (actionType: string) => void;
}

export default function OfficeManagerHeader({ activeTab, businessName = "Apex Plumbing", onRefreshData }: OfficeManagerHeaderProps) {
  const [managerMessage, setManagerMessage] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  const handleActionClick = (actionId: string, message: string) => {
    if (completedActions[actionId]) return;
    
    // Mark as completed
    setCompletedActions(prev => ({ ...prev, [actionId]: true }));
    
    // Set feedback message
    setManagerMessage(message);
    setTimeout(() => {
      setManagerMessage(null);
    }, 5000);

    // Trigger parent refresh if provided
    if (onRefreshData) {
      onRefreshData(actionId);
    }
  };

  // Define tab-specific manager briefings
  const getBriefing = () => {
    switch (activeTab) {
      case 'overview':
        return {
          title: "Executive Desk Overview",
          status: "Fully Synchronized & On-Duty",
          avatarBg: "bg-slate-900 text-white",
          managerName: "Sarah Jenkins",
          role: "Office Manager AI",
          speech: `“Good day! I've been actively monitoring our digital storefront. We've captured hot leads and scheduled automatic bookings overnight. Here is our direct action briefing to maximize this week's revenue.”`,
          accomplishments: [
            { text: "Greeted 14 web visitors and answered 26 service/pricing questions.", icon: <MessageSquare size={13} className="text-sky-600" /> },
            { text: "Successfully converted 3 anonymous visitors into high-probability CRM Leads.", icon: <UserCheck size={13} className="text-emerald-600" /> },
            { text: "Secured 2 new booking timeslots directly onto your Google Calendar.", icon: <CheckCircle2 size={13} className="text-indigo-600" /> },
            { text: "Generated $4,850 in newly calculated pipeline contract value.", icon: <DollarSign size={13} className="text-amber-600" /> }
          ],
          attention: [
            { text: "A pipe emergency was reported at 2:00 AM by Regulus Crassus. Needs technician dispatch.", type: "error" },
            { text: "Visitor #3202 dropped out at phone input during a tankless water heater quote query.", type: "warning" }
          ],
          actions: [
            {
              id: "ov-1",
              label: "Confirm SMS Dispatch to On-Call Tech",
              feedback: "Excellent! I have dispatched an emergency SMS to technician Dave with Regulus's contact details and the diagnostic notes.",
              color: "bg-sky-600 hover:bg-sky-700 text-white"
            },
            {
              id: "ov-2",
              label: "Send 10% Financing SMS Recovery to Visitor #3202",
              feedback: "SMS Recovery sent! Delivered financing options and a booking link directly to their mobile number.",
              color: "bg-emerald-600 hover:bg-emerald-700 text-white"
            }
          ]
        };

      case 'workforce':
        return {
          title: "AI Personnel Department",
          status: "Team Coordinated & Operational",
          avatarBg: "bg-indigo-900 text-white",
          managerName: "Sarah Jenkins",
          role: "Office Manager AI",
          speech: `“Your active AI personnel are sharing customer logs in the Staff Room. Sarah coordinates, Alex closes, and Chloe drives retention. Let's optimize our team size to handle increasing demand.”`,
          accomplishments: [
            { text: "Alex Rivera (Sales) processed 3 water heater enquiries and formulated competitive pricing.", icon: <DollarSign size={13} className="text-emerald-600" /> },
            { text: "Chloe Peterson (Marketing) compiled personalized autumn specials for local clients.", icon: <Sparkles size={13} className="text-purple-600" /> },
            { text: "Maintained instant coordination: response files synced in 0.8 seconds.", icon: <Clock size={13} className="text-sky-600" /> }
          ],
          attention: [
            { text: "Marcus Chen (Bookkeeper agent) is available for hire to auto-invoice completed service jobs.", type: "warning" }
          ],
          actions: [
            {
              id: "wf-1",
              label: "Hire Marcus Chen (Bookkeeper/Invoice Specialist)",
              feedback: "Marcus has been successfully deployed! He is now scanning booking logs to prepare custom billing estimates.",
              color: "bg-slate-900 hover:bg-slate-800 text-white"
            },
            {
              id: "wf-2",
              label: "Refine Alex's Warranty Sales Pitch",
              feedback: "Objection rules updated! Alex will now emphasize our premium 5-year parts and labor warranty on all water heater calls.",
              color: "bg-indigo-600 hover:bg-indigo-700 text-white"
            }
          ]
        };

      case 'leads':
        return {
          title: "Leads CRM & Rescue Console",
          status: "Hot Leads Qualifying",
          avatarBg: "bg-sky-900 text-white",
          managerName: "Alex Rivera",
          role: "AI Sales Director",
          speech: `“Hey there! I've been busy qualifying our incoming leads. I score them based on service keyword value. We have an urgent emergency lead that needs immediate phone dispatch.”`,
          accomplishments: [
            { text: "Captured and auto-scored 4 new high-value residential leads.", icon: <UserCheck size={13} className="text-emerald-600" /> },
            { text: "Identified a potential $4,500 kitchen remodel inquiry with 90% score.", icon: <DollarSign size={13} className="text-amber-600" /> }
          ],
          attention: [
            { text: "Regulus Crassus (Emergency leak, 95% score) is still waiting in 'NEW' status.", type: "error" }
          ],
          actions: [
            {
              id: "ld-1",
              label: "Promote Regulus Crassus to 'In Progress' & Trigger Call Out",
              feedback: "Done! Lead status updated to 'In Progress'. Dispatch call logged and SMS sent to the plumbing fleet.",
              color: "bg-rose-600 hover:bg-rose-700 text-white"
            },
            {
              id: "ld-2",
              label: "Send Pre-Filled Estimate to Remodeling Lead",
              feedback: "Kitchen remodel estimate dispatched! Shared standard diagnostic pricing list and calendar booker with client.",
              color: "bg-slate-900 hover:bg-slate-800 text-white"
            }
          ]
        };

      case 'customers':
        return {
          title: "Client Ledger & History Database",
          status: "Auditing Customer Timelines",
          avatarBg: "bg-amber-900 text-white",
          managerName: "Sarah Jenkins",
          role: "Office Manager AI",
          speech: `“I have compiled complete historical customer profiles. Each customer now has an active chronological timeline detailing their bookings, AI chats, and transaction logs.”`,
          accomplishments: [
            { text: "Auto-synced and generated detailed history timelines for 5 active local clients.", icon: <CheckCircle2 size={13} className="text-sky-600" /> },
            { text: "Matched client emails with recent website chat sessions dynamically.", icon: <MessageSquare size={13} className="text-indigo-600" /> }
          ],
          attention: [
            { text: "Mike Rossetti has an overdue/pending diagnostic fee invoice of $49.", type: "warning" }
          ],
          actions: [
            {
              id: "cu-1",
              label: "Send Automated SMS Invoice Nudge to Mike",
              feedback: "Invoice notification dispatched! Mike has been sent an SMS link to complete his diagnostic payment securely.",
              color: "bg-emerald-600 hover:bg-emerald-700 text-white"
            }
          ]
        };

      case 'appointments':
        return {
          title: "Calendar Dispatch Desk",
          status: "Managing Service Schedules",
          avatarBg: "bg-purple-900 text-white",
          managerName: "Sarah Jenkins",
          role: "Office Manager AI",
          speech: `“We have verified our schedule against incoming technician availability. I am keeping bookings tightly grouped to reduce travel overhead for your crew.”`,
          accomplishments: [
            { text: "Validated all calendar bookings with no conflict overlaps.", icon: <CheckCircle2 size={13} className="text-emerald-600" /> },
            { text: "Automated 24-hour pre-appointment scheduling holds.", icon: <Clock size={13} className="text-sky-600" /> }
          ],
          attention: [
            { text: "Sarah Jenkins' upcoming booking (Bathroom Drain Leak) has not received confirmation.", type: "warning" }
          ],
          actions: [
            {
              id: "ap-1",
              label: "Send Instant Booking Confirmation SMS",
              feedback: "Booking confirmed! I have updated Sarah Jenkins' appointment to 'CONFIRMED' and dispatched the technician bio to her.",
              color: "bg-sky-600 hover:bg-sky-700 text-white"
            }
          ]
        };

      case 'marketing':
        return {
          title: "AI Growth & Promotion Hub",
          status: "Targeting Inactive Prospects",
          avatarBg: "bg-emerald-900 text-white",
          managerName: "Chloe Peterson",
          role: "AI Marketing Specialist",
          speech: `“Hey! I've scanned our cold lead records. We have 8 stagnant local customers who haven't booked in 6 months. I recommend a targeted seasonal outreach campaign.”`,
          accomplishments: [
            { text: "Compiled high-engagement 'Autumn Heating Tune-Up' SMS campaign template.", icon: <Sparkles size={13} className="text-purple-600" /> },
            { text: "Drafted $50 discount voucher code to maximize appointment conversion.", icon: <DollarSign size={13} className="text-emerald-600" /> }
          ],
          attention: [
            { text: "Autumn Promo is draft-only. We are losing seasonal appointment volume.", type: "warning" }
          ],
          actions: [
            {
              id: "mk-1",
              label: "Launch Autumn Promo Campaign to 8 Stagnant Leads",
              feedback: "Promotion launched! 8 stagnant leads have been sent personalized SMS vouchers. Tracking conversions in real-time.",
              color: "bg-emerald-600 hover:bg-emerald-700 text-white"
            }
          ]
        };

      case 'reports':
        return {
          title: "Executive Revenue & Appraisal Reports",
          status: "ROI Audit Active",
          avatarBg: "bg-slate-900 text-white",
          managerName: "Sarah Jenkins",
          role: "Office Manager AI",
          speech: `“I have drafted our executive performance audit. Our AI response speed has prevented customer drop-off, but we must resolve the phone number input barrier.”`,
          accomplishments: [
            { text: "Calculated exact AI Response Speed (1.8s average) vs. Human average (2.5 hours).", icon: <Clock size={13} className="text-indigo-600" /> },
            { text: "Identified $3,250 in rescueable revenue opportunities from website bounces.", icon: <DollarSign size={13} className="text-emerald-600" /> }
          ],
          attention: [
            { text: "Financing queries drop out when asked for phone first. Recommended: allow SMS backup.", type: "error" }
          ],
          actions: [
            {
              id: "rp-1",
              label: "Authorize 'SMS-Only Gating' Bypass Rule",
              feedback: "Rule authorized! Customers can now request service quotes via SMS backup without strict phone gates. Preventing lost business.",
              color: "bg-amber-600 hover:bg-amber-700 text-white"
            }
          ]
        };

      case 'chats':
        return {
          title: "Chat Desk Transcripts",
          status: "Monitoring Active Transcripts",
          avatarBg: "bg-rose-900 text-white",
          managerName: "Sarah Jenkins",
          role: "Office Manager AI",
          speech: `“I have indexed all web discussions. Every chat transcript is parsed in real-time, pulling client names and phone numbers directly into our pipeline.”`,
          accomplishments: [
            { text: "Logged and indexed 142 messages served by web AI widget.", icon: <MessageSquare size={13} className="text-sky-600" /> },
            { text: "Flagged 'emergency' and 'tankless' topics with high priority.", icon: <Zap size={13} className="text-amber-600" /> }
          ],
          attention: [
            { text: "Visitor #4105 left a query about 'South Austin services' but exited before booking.", type: "warning" }
          ],
          actions: [
            {
              id: "ch-1",
              label: "Manually Capture Visitor #4105 as Warm Lead",
              feedback: "Done! I have created a CRM Lead for Visitor #4105 tagged as 'South Austin expansion prospect'.",
              color: "bg-slate-900 hover:bg-slate-800 text-white"
            }
          ]
        };

      case 'automations':
        return {
          title: "Operations Automation Ledgers",
          status: "Automation Engine Engaged",
          avatarBg: "bg-sky-950 text-white",
          managerName: "Sarah Jenkins",
          role: "Office Manager AI",
          speech: `“Our rules engine runs on trigger-action pathways. I am executing the 5-minute warm follow-up and the post-appointment Google Review solicitations.”`,
          accomplishments: [
            { text: "Dispatched 8 follow-up messages automatically on new leads.", icon: <Clock size={13} className="text-sky-600" /> },
            { text: "Automated review requests successfully on completed service calls.", icon: <CheckCircle2 size={13} className="text-emerald-600" /> }
          ],
          attention: [
            { text: "Review request delay is currently set to 24 hours. Post-job enthusiasm is highest at 2 hours.", type: "warning" }
          ],
          actions: [
            {
              id: "au-1",
              label: "Optimize Google Review Delay to 2 Hours",
              feedback: "Optimized! Review requests will now auto-dispatch 2 hours after a technician completes a job.",
              color: "bg-sky-600 hover:bg-sky-700 text-white"
            }
          ]
        };

      case 'widget':
        return {
          title: "Storefront Chat Widget Integrations",
          status: "Widget Active on Website",
          avatarBg: "bg-slate-900 text-white",
          managerName: "Chloe Peterson",
          role: "AI Marketing Specialist",
          speech: `“The chat widget is our digital doorway. Matching the theme color to our brand increases consumer confidence and conversions by up to 23%.”`,
          accomplishments: [
            { text: "Connected 14 on-site chats to the CRM router.", icon: <Bot size={13} className="text-sky-600" /> },
            { text: "Configured custom greeting: 'Hi! Looking for plumbing or heating help?'", icon: <CheckCircle2 size={13} className="text-emerald-600" /> }
          ],
          attention: [
            { text: "Widget background is set to default Sky Blue instead of our premium brand theme.", type: "warning" }
          ],
          actions: [
            {
              id: "wg-1",
              label: "Apply Brand Theme Palette to Web Widget",
              feedback: "Theme applied! Widget color adjusted to premium deep slate to match your business credentials.",
              color: "bg-slate-900 hover:bg-slate-800 text-white"
            }
          ]
        };

      case 'growth':
        return {
          title: "AI Business Growth Hub",
          status: "Optimizing Business Scale & ROI",
          avatarBg: "bg-gradient-to-tr from-sky-600 to-indigo-600 text-white",
          managerName: "Charlotte Vance",
          role: "Chief Revenue Officer AI",
          speech: `“Welcome to your command headquarters! I am continuously scanning our lead velocity, campaign conversion rates, and employee execution. We are primed to run high-ROI re-engagement campaigns and boost your Health Score.”`,
          accomplishments: [
            { text: "Conducted complete algorithmic audit across all 10 standard growth vectors.", icon: <CheckCircle2 size={13} className="text-emerald-600" /> },
            { text: "Simulated 10 high-value Industry Agent Packs ready for one-click deployment.", icon: <Sparkles size={13} className="text-sky-500" /> },
            { text: "Drafted hyper-personalized morning business briefing & active ROI optimization list.", icon: <Zap size={13} className="text-amber-500" /> }
          ],
          attention: [
            { text: "Business Health Score is 88/100 due to stagnant webchat lead reply latency.", type: "warning" }
          ],
          actions: [
            {
              id: "gr-1",
              label: "Boost Lead Response to Sub-Second Thresholds",
              feedback: "Understood! I have prioritized incoming Webchat queries to bypass intermediate delays, forcing near-instantaneous SMS handoff.",
              color: "bg-sky-600 hover:bg-sky-700 text-white"
            }
          ]
        };

      case 'multi_agent':
        return {
          title: "Multi-Agent Collaboration Engine",
          status: "Orchestrator Online & Safe",
          avatarBg: "bg-gradient-to-tr from-sky-600 to-indigo-600 text-white",
          managerName: "Supervisor Sovereign",
          role: "Chief Systems Supervisor AI",
          speech: `“Welcome to the Multi-Agent Systems core. I am monitoring the workflow handoffs across our specialized AI employees to ensure perfect tenant isolation and role-clearance compliance.”`,
          accomplishments: [
            { text: "Seeded complete directory of 11 specialized business specialists.", icon: <CheckCircle2 size={13} className="text-emerald-600" /> },
            { text: "Auditing communication traces in real-time for zero leak compliance.", icon: <ShieldAlert size={13} className="text-sky-600" /> }
          ],
          attention: [
            { text: "No coaching flags reported on active workflows. Health is optimal.", type: "warning" }
          ],
          actions: [
            {
              id: "ma-1",
              label: "Run Full Operational System Diagnosis",
              feedback: "System diagnostics completed! All multi-agent message lanes are healthy and isolated securely.",
              color: "bg-slate-900 hover:bg-slate-800 text-white"
            }
          ]
        };

      case 'autonomous':
        return {
          title: "Autonomous Strategy & Decision Hub",
          status: "Autonomous Engine Active & Safe",
          avatarBg: "bg-gradient-to-tr from-cyan-600 to-sky-600 text-white",
          managerName: "Charlotte Vance",
          role: "Chief Revenue Officer AI",
          speech: `“Welcome to the Autonomous Decision Console! Our specialized AI employees have translated your long-term business goals into fully executable plan roadmaps with built-in human verification gates. Let's direct company velocity.”`,
          accomplishments: [
            { text: "Successfully established strategic corporate objectives.", icon: <CheckCircle2 size={13} className="text-emerald-600" /> },
            { text: "Formulated ROI-optimized competing strategies using Monte Carlo models.", icon: <Zap size={13} className="text-sky-500" /> },
            { text: "Maintained complete zero-leak workspace boundary compliance.", icon: <Clock size={13} className="text-indigo-600" /> }
          ],
          attention: [
            { text: "Continuous auditor flagged 1 minor schedule slip recommendation.", type: "warning" }
          ],
          actions: [
            {
              id: "at-1",
              label: "Audit Autonomous Agent Task Slip Warnings",
              feedback: "Audit completed! Re-allocated redundant server processes to stabilize response speeds back to optimal parameters.",
              color: "bg-sky-600 hover:bg-sky-700 text-white"
            }
          ]
        };

      default:
        return {
          title: "Office Desk Desk",
          status: "Synchronized",
          avatarBg: "bg-slate-900 text-white",
          managerName: "Sarah Jenkins",
          role: "Office Manager AI",
          speech: `“Let me know how I can help manage our customer inquiries and appointment schedules today!”`,
          accomplishments: [],
          attention: [],
          actions: []
        };
    }
  };

  const briefing = getBriefing();

  return (
    <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden mb-6">
      {/* Top Banner indicating Officer Status */}
      <div className="bg-slate-900 px-5 py-3 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-xs font-mono tracking-tight uppercase text-slate-300">
            Digital Office Manager Desk &bull; <span className="text-emerald-400 font-bold">{briefing.status}</span>
          </h1>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          Last Check-in: Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Main Briefing Grid */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Hand: The Office Manager's Speech & Avatar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shadow ${briefing.avatarBg}`}>
              {briefing.managerName.split(' ')[0][0]}{briefing.managerName.split(' ')[1]?.[0] || 'A'}
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                {briefing.managerName} <Sparkles size={11} className="text-amber-500" />
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">{briefing.role}</p>
            </div>
          </div>
          
          <div className="bg-slate-50/70 border border-slate-100 p-4 rounded-xl text-xs text-slate-700 italic leading-relaxed relative">
            {briefing.speech}
            {/* Tiny accent triangle for speech bubble */}
            <div className="absolute top-4 -left-1.5 w-3 h-3 bg-slate-50 border-l border-b border-slate-100 rotate-45" />
          </div>
        </div>

        {/* Middle/Right Hand: Outcomes, Attention, Direct Action Tasks */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Accomplished Today */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              💼 Completed Today
            </h4>
            <div className="bg-white border border-slate-100/80 rounded-xl p-3.5 space-y-2.5 shadow-xs">
              {briefing.accomplishments.length > 0 ? (
                briefing.accomplishments.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-normal">
                    <span className="mt-0.5 flex-shrink-0">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No tasks logged yet for this section.</p>
              )}
            </div>
          </div>

          {/* Attention & Recommended Next Actions */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              ⚠️ Attention Needed & Recommended Actions
            </h4>
            
            <div className="space-y-2.5">
              {/* Warnings / Alerts */}
              {briefing.attention.map((att, idx) => (
                <div key={idx} className={`p-3 rounded-xl border flex items-start gap-2 text-xs leading-normal ${
                  att.type === 'error' 
                    ? 'bg-rose-50/50 border-rose-100 text-rose-800' 
                    : 'bg-amber-50/50 border-amber-100 text-amber-800'
                }`}>
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />
                  <div>
                    <span className="font-bold text-[10px] uppercase tracking-wide mr-1 text-slate-600 block">
                      {att.type === 'error' ? 'Urgent Alert' : 'Opportunity Warning'}
                    </span>
                    {att.text}
                  </div>
                </div>
              ))}

              {/* Action Buttons */}
              <div className="pt-1.5 space-y-2">
                {briefing.actions.map((act) => {
                  const isDone = completedActions[act.id];
                  return (
                    <button
                      key={act.id}
                      onClick={() => handleActionClick(act.id, act.feedback)}
                      disabled={isDone}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-between gap-2 border cursor-pointer ${
                        isDone 
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                          : `${act.color} border-transparent hover:-translate-y-0.5 active:translate-y-0`
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {isDone ? <Check size={12} className="text-slate-400" /> : <Zap size={11} className="animate-pulse" />}
                        {act.label}
                      </span>
                      {!isDone && <ArrowRight size={11} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Manager Feedback Popups */}
      {managerMessage && (
        <div className="bg-slate-900 border-t border-slate-800 p-4 animate-slide-up flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-emerald-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
            ✓
          </div>
          <div className="text-xs text-white">
            <span className="font-bold block text-emerald-400">Sarah Jenkins says:</span>
            {managerMessage}
          </div>
        </div>
      )}
    </div>
  );
}
