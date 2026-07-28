// src/components/universal/UniversalOnboardingWizard.tsx
import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Building2, User, Globe, Mail, Phone, MapPin, Briefcase, Calendar,
  Sparkles, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw,
  Zap, HelpCircle, Layers, Settings, ShieldCheck, Database
} from 'lucide-react';
import { OnboardingAnswers, BusinessStage, BusinessModelType, SystemCategory, PainPointCategory, GoalCategory } from '../../types/universal-onboarding.ts';
import { DEMO_PROFILES } from '../../lib/demo-profiles.ts';

interface Props {
  onComplete: (answers: OnboardingAnswers) => void;
  initialAnswers?: OnboardingAnswers;
}

const DEFAULT_ANSWERS: OnboardingAnswers = {
  businessName: '',
  ownerName: '',
  businessDescription: '',
  industry: 'Resale & E-Commerce',
  subIndustrySpecialty: '',
  location: '',
  serviceArea: '',
  website: '',
  email: '',
  phone: '',
  yearsOperating: '1-3 years',

  stage: 'Established solo business',
  businessModel: ['Products'],
  customBusinessModelNotes: '',

  productsServicesOffered: '',
  typicalCustomer: '',
  customerDiscoveryMethods: ['Word of mouth'],
  customerContactMethods: ['Email', 'Phone call'],
  salesBookingProcess: 'Customer contacts owner -> Offer made -> Payment -> Delivery',
  paymentCollectionMethod: 'Credit Card / Online',
  schedulingProcess: 'Manual calendar',
  customerFollowUpMethod: 'Manual follow-up',
  inventoryHandling: 'Manual tracking',
  marketingHandling: 'Word of mouth',
  recordStorageMethod: 'Spreadsheets',
  teamSizeCount: '1 (Solo Owner)',
  currentSoftwareList: [],

  systemsUsed: ['Gmail or business email', 'Spreadsheets'],
  otherSystemsNotes: '',

  painPoints: ['Too much repetitive work', 'Slow customer replies'],
  customPainPointNotes: '',

  goals: ['Save time', 'Increase revenue', 'Automate repetitive work'],
  customGoalNotes: '',

  monthlyBudgetRange: '$100 - $300 / month',
  techComfortLevel: 'Medium',
  preferredAutomationLevel: 'Human-in-the-loop Approval',
  actionsRequiringApproval: ['Confirming high-value orders or quotes', 'Publishing public content'],
  privacyComplianceConcerns: 'Standard customer privacy',
  forbiddenConnections: [],
  immediatePriority: 'Automate repetitive tasks and capture missed opportunities',
  desiredTimeline: 'Immediate'
};

export const UniversalOnboardingWizard: React.FC<Props> = ({ onComplete, initialAnswers }) => {
  const [answers, setAnswers] = useState<OnboardingAnswers>(initialAnswers || DEFAULT_ANSWERS);
  const [step, setStep] = useState<number>(1);
  const totalSteps = 8;

  const handleInputChange = (field: keyof OnboardingAnswers, value: any) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: keyof OnboardingAnswers, item: string) => {
    setAnswers(prev => {
      const currentList = (prev[field] as string[]) || [];
      const exists = currentList.includes(item);
      const updated = exists ? currentList.filter(i => i !== item) : [...currentList, item];
      return { ...prev, [field]: updated };
    });
  };

  const loadDemoPreset = (key: string) => {
    const preset = DEMO_PROFILES[key];
    if (preset) {
      setAnswers(JSON.parse(JSON.stringify(preset.answers)));
    }
  };

  const isStepValid = () => {
    if (step === 1) return answers.businessName.trim().length > 0;
    return true;
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(prev => prev + 1);
    else onComplete(answers);
  };

  const prevStep = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto space-y-8 font-sans">
      {/* Preset Quick Loader Header */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-amber-400" />
            <h3 className="font-extrabold text-sm tracking-tight">Quick Demo Profile Loader</h3>
          </div>
          <p className="text-xs text-slate-300">Populate the onboarding engine instantly with real test profiles:</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadDemoPreset('joshua_jardin')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            1. Joshua Jardin (Reseller)
          </button>
          <button
            type="button"
            onClick={() => loadDemoPreset('ricardos_restaurant')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            2. Ricardo's (Restaurant)
          </button>
          <button
            type="button"
            onClick={() => loadDemoPreset('apex_plumbing')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            3. Apex Plumbing (Contractor)
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span className="uppercase tracking-wider text-sky-600">
            Step {step} of {totalSteps}
          </span>
          <span>{Math.round((step / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-900 transition-all duration-300 rounded-full"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: BUSINESS IDENTITY */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 size={22} className="text-sky-600" /> Business Identity
            </h2>
            <p className="text-xs text-slate-500 mt-1">Tell us about your business baseline details.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Business Name *</label>
              <input
                type="text"
                required
                value={answers.businessName}
                onChange={e => handleInputChange('businessName', e.target.value)}
                placeholder="E.g. Jardin Goods & Resale"
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Owner or Primary Contact</label>
              <input
                type="text"
                value={answers.ownerName}
                onChange={e => handleInputChange('ownerName', e.target.value)}
                placeholder="E.g. Joshua Jardin"
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Business Description</label>
              <textarea
                rows={2}
                value={answers.businessDescription}
                onChange={e => handleInputChange('businessDescription', e.target.value)}
                placeholder="What does your business do? E.g. Solo resale business sourcing vintage clothing and collectibles..."
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Industry</label>
              <input
                type="text"
                value={answers.industry}
                onChange={e => handleInputChange('industry', e.target.value)}
                placeholder="E.g. Resale & E-Commerce, Restaurant, Plumbing"
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Sub-Industry or Specialty</label>
              <input
                type="text"
                value={answers.subIndustrySpecialty}
                onChange={e => handleInputChange('subIndustrySpecialty', e.target.value)}
                placeholder="E.g. eBay Resale, Fine Italian Dining, Emergency Drain Cleaning"
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Location & Service Area</label>
              <input
                type="text"
                value={answers.location}
                onChange={e => handleInputChange('location', e.target.value)}
                placeholder="E.g. San Diego, CA / Nationwide Shipping"
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Years Operating</label>
              <select
                value={answers.yearsOperating}
                onChange={e => handleInputChange('yearsOperating', e.target.value)}
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-sky-500 focus:border-sky-500 bg-white"
              >
                <option value="Less than 1 year">Less than 1 year</option>
                <option value="1-3 years">1-3 years</option>
                <option value="3-5 years">3-5 years</option>
                <option value="5-10 years">5-10 years</option>
                <option value="10+ years">10+ years</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 2: BUSINESS STAGE */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase size={22} className="text-sky-600" /> Business Stage
            </h2>
            <p className="text-xs text-slate-500 mt-1">Select the operational stage that best describes your current size.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              'Idea', 'New business', 'Side hustle', 'Established solo business',
              'Small team', 'Growing company', 'Multi-location company', 'Enterprise'
            ].map((stg) => (
              <button
                key={stg}
                type="button"
                onClick={() => handleInputChange('stage', stg as BusinessStage)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  answers.stage === stg
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm font-bold'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="text-xs font-bold">{stg}</span>
                {answers.stage === stg && <CheckCircle2 size={16} className="text-emerald-400 mt-2" />}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* STEP 3: BUSINESS MODEL */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers size={22} className="text-sky-600" /> Business Model
            </h2>
            <p className="text-xs text-slate-500 mt-1">Select all revenue channels that apply to your operations.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              'Products', 'Services', 'Subscriptions', 'Appointments', 'Projects',
              'Retail', 'E-commerce', 'Marketplace selling', 'Food service', 'Events',
              'Mixed business models', 'Custom model'
            ].map((model) => {
              const selected = answers.businessModel.includes(model as BusinessModelType);
              return (
                <button
                  key={model}
                  type="button"
                  onClick={() => handleArrayToggle('businessModel', model)}
                  className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    selected
                      ? 'border-sky-600 bg-sky-50 text-sky-950 font-black shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span>{model}</span>
                  {selected && <CheckCircle2 size={16} className="text-sky-600" />}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* STEP 4: OPERATIONS */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Settings size={22} className="text-sky-600" /> Operational Workflows
            </h2>
            <p className="text-xs text-slate-500 mt-1">Explain how sales, bookings, and operations currently take place.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Products or Services Offered</label>
              <input
                type="text"
                value={answers.productsServicesOffered}
                onChange={e => handleInputChange('productsServicesOffered', e.target.value)}
                placeholder="E.g. Vintage clothing, plush toys, collectibles, cosmetics"
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Typical Customer Profile</label>
              <input
                type="text"
                value={answers.typicalCustomer}
                onChange={e => handleInputChange('typicalCustomer', e.target.value)}
                placeholder="E.g. Online deal hunters, local diners, homeowners needing plumbing repairs"
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">How Sales / Bookings Occur</label>
              <input
                type="text"
                value={answers.salesBookingProcess}
                onChange={e => handleInputChange('salesBookingProcess', e.target.value)}
                placeholder="E.g. Order placed on marketplace, phone dispatch call, table reservation"
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Inventory or Service Handling</label>
              <input
                type="text"
                value={answers.inventoryHandling}
                onChange={e => handleInputChange('inventoryHandling', e.target.value)}
                placeholder="E.g. Home storage space with unlisted backlog, truck stock, food distributor"
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 5: CURRENT SYSTEMS */}
      {step === 5 && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Database size={22} className="text-sky-600" /> Current Tools & Software
            </h2>
            <p className="text-xs text-slate-500 mt-1">Select all platforms and software your business currently uses.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              'Gmail or business email', 'Google Calendar', 'Microsoft Outlook', 'Website',
              'CRM', 'Phone system', 'Text messaging', 'Accounting software',
              'Payment processor', 'E-commerce platform', 'Online marketplaces', 'Social media',
              'Inventory system', 'Scheduling software', 'Point-of-sale system', 'Spreadsheets',
              'Paper or manual processes'
            ].map((sys) => {
              const selected = answers.systemsUsed.includes(sys as SystemCategory);
              return (
                <button
                  key={sys}
                  type="button"
                  onClick={() => handleArrayToggle('systemsUsed', sys)}
                  className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    selected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span>{sys}</span>
                  {selected && <CheckCircle2 size={16} className="text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* STEP 6: PAIN POINTS */}
      {step === 6 && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <AlertCircle size={22} className="text-amber-500" /> Operational Pain Points
            </h2>
            <p className="text-xs text-slate-500 mt-1">Select the top operational bottlenecks holding your business back.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              'Missed calls', 'Slow customer replies', 'Too much repetitive work', 'Poor follow-up',
              'Lack of leads', 'Low sales', 'Scheduling problems', 'Unorganized records',
              'Inventory problems', 'Marketing inconsistency', 'Customer service problems', 'Employee coordination',
              'Reporting problems', 'Too much owner involvement'
            ].map((pain) => {
              const selected = answers.painPoints.includes(pain as PainPointCategory);
              return (
                <button
                  key={pain}
                  type="button"
                  onClick={() => handleArrayToggle('painPoints', pain)}
                  className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    selected
                      ? 'border-amber-600 bg-amber-50 text-amber-950 font-black shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span>{pain}</span>
                  {selected && <CheckCircle2 size={16} className="text-amber-600" />}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* STEP 7: GOALS */}
      {step === 7 && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles size={22} className="text-sky-600" /> Business Goals
            </h2>
            <p className="text-xs text-slate-500 mt-1">What primary outcomes do you want to achieve with an AI workforce?</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              'Increase revenue', 'Save time', 'Reduce missed opportunities', 'Improve customer service',
              'Organize operations', 'Automate repetitive work', 'Hire fewer administrative staff',
              'Grow to another location', 'Build an online presence', 'Improve marketing',
              'Improve customer retention', 'Launch a new business'
            ].map((goal) => {
              const selected = answers.goals.includes(goal as GoalCategory);
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => handleArrayToggle('goals', goal)}
                  className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    selected
                      ? 'border-sky-600 bg-sky-50 text-sky-950 font-black shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span>{goal}</span>
                  {selected && <CheckCircle2 size={16} className="text-sky-600" />}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* STEP 8: CONSTRAINTS & BOUNDARIES */}
      {step === 8 && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck size={22} className="text-indigo-600" /> Automation Boundaries & Budget
            </h2>
            <p className="text-xs text-slate-500 mt-1">Define human approval boundaries and preferred automation levels.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Monthly AI Budget Range</label>
              <select
                value={answers.monthlyBudgetRange}
                onChange={e => handleInputChange('monthlyBudgetRange', e.target.value)}
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-sky-500 focus:border-sky-500 bg-white"
              >
                <option value="$50 - $150 / month">$50 - $150 / month</option>
                <option value="$150 - $300 / month">$150 - $300 / month</option>
                <option value="$300 - $750 / month">$300 - $750 / month</option>
                <option value="$750+ / month">$750+ / month</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Preferred Automation Level</label>
              <select
                value={answers.preferredAutomationLevel}
                onChange={e => handleInputChange('preferredAutomationLevel', e.target.value)}
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-sky-500 focus:border-sky-500 bg-white"
              >
                <option value="Full Human Control">Full Human Control (Drafts Only)</option>
                <option value="Human-in-the-loop Approval">Human-in-the-loop Approval (Recommended)</option>
                <option value="High Autonomous Operations">High Autonomous Operations</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Immediate Priority Goal</label>
              <input
                type="text"
                value={answers.immediatePriority}
                onChange={e => handleInputChange('immediatePriority', e.target.value)}
                placeholder="E.g. Automate unlisted inventory draft creation or 24/7 call intake"
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation Footer */}
      <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={prevStep}
          disabled={step === 1}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
            step === 1
              ? 'opacity-40 cursor-not-allowed text-slate-400 border-slate-200'
              : 'text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer'
          }`}
        >
          <ArrowLeft size={16} /> Previous
        </button>

        <button
          type="button"
          onClick={nextStep}
          disabled={!isStepValid()}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          {step === totalSteps ? 'Design AI Workforce' : 'Continue'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
