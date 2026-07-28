import { useState } from 'react';
import { Sparkles, Building, Sliders, FileText, CheckCircle, Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { BusinessProfile } from '../types';

interface OnboardingProps {
  onOnboardComplete: (business: BusinessProfile) => void;
}

export default function Onboarding({ onOnboardComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Profile fields
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('Home Services');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [tone, setTone] = useState<'professional' | 'friendly' | 'casual' | 'enthusiastic'>('friendly');
  const [description, setDescription] = useState('');

  // Services fields
  const [services, setServices] = useState<{ name: string; price: string; duration: string; description: string }[]>([
    { name: 'General Consultation', price: '$49 diagnostic fee', duration: '1 hour', description: 'Initial site check-up, problem logging, and flat-rate quotation.' }
  ]);
  const [srvName, setSrvName] = useState('');
  const [srvPrice, setSrvPrice] = useState('');
  const [srvDur, setSrvDur] = useState('');
  const [srvDesc, setSrvDesc] = useState('');

  // FAQs fields
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([
    { question: 'What are your working hours?', answer: 'We are open from Monday to Saturday, 7:00 AM - 7:00 PM.' }
  ]);
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');

  const handleAddService = () => {
    if (!srvName.trim()) return;
    setServices(prev => [...prev, { name: srvName, price: srvPrice || 'Custom quote', duration: srvDur || '1 hour', description: srvDesc }]);
    setSrvName('');
    setSrvPrice('');
    setSrvDur('');
    setSrvDesc('');
  };

  const handleRemoveService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddFAQ = () => {
    if (!faqQ.trim() || !faqA.trim()) return;
    setFaqs(prev => [...prev, { question: faqQ, answer: faqA }]);
    setFaqQ('');
    setFaqA('');
  };

  const handleRemoveFAQ = (index: number) => {
    setFaqs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/business/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          industry,
          website,
          phone,
          email,
          address,
          tone,
          description,
          services,
          faqs,
          widgetColor: '#0284c7',
          widgetGreeting: `Hi there! I'm ${name}'s AI assistant. Ask me anything about our services, pricing, or schedules!`,
          widgetPlaceholder: 'Ask a question...'
        }),
      });
      const data = await res.json();
      if (data.success && data.business) {
        onOnboardComplete(data.business);
      }
    } catch (err) {
      console.error('Failed to onboard business:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-100 shadow-md rounded-2xl p-6 sm:p-8 space-y-8 select-none">
      {/* Stepper indicators */}
      <div className="flex items-center justify-between border-b border-slate-50 pb-5">
        <div className="flex items-center gap-1.5 bg-sky-50 text-sky-800 border border-sky-100/50 px-3 py-1 rounded-full text-xs font-semibold">
          <Sparkles size={12} className="animate-pulse" /> Employee Training Hub
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className={`h-6 w-6 rounded-full flex items-center justify-center border ${step >= 1 ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200'}`}>1</span>
          <span className="h-px w-6 bg-slate-200" />
          <span className={`h-6 w-6 rounded-full flex items-center justify-center border ${step >= 2 ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200'}`}>2</span>
          <span className="h-px w-6 bg-slate-200" />
          <span className={`h-6 w-6 rounded-full flex items-center justify-center border ${step >= 3 ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200'}`}>3</span>
        </div>
      </div>

      {/* Step 1: Business profile details */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-1.5">
              <Building size={18} className="text-sky-600" /> Step 1: Company Profile
            </h3>
            <p className="text-xs text-slate-500 mt-1">This teaches your AI employee who they represent, where they are, and how customers can contact you.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Registered Business Name *</label>
              <input
                type="text"
                required
                value={name}
                placeholder="E.g. Smile Dental, Sparkle CleaningAustin"
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Industry / Sector</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-sky-500"
              >
                <option value="Home Services">Home Services (Plumbing, HVAC, Electrical)</option>
                <option value="Medical & Health">Medical, Dental, or Chiropractic</option>
                <option value="Legal & Finance">Legal, Consulting, or Tax Advisory</option>
                <option value="Creative Agency">Digital Agency, Design, or Software</option>
                <option value="Education">Tutors, Coaching, or Classes</option>
                <option value="Local Store">Retail, Fitness, or Local Salon</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Website URL (Optional)</label>
              <input
                type="url"
                value={website}
                placeholder="https://mysite.com"
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Email</label>
              <input
                type="email"
                value={email}
                placeholder="support@mycompany.com"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Phone Number</label>
              <input
                type="tel"
                value={phone}
                placeholder="(512) 555-1234"
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Office / Physical Address</label>
              <input
                type="text"
                value={address}
                placeholder="102 Main St, Austin, TX 78701"
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => { if (name.trim()) setStep(2); }}
              disabled={!name.trim()}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              Continue <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Employee tone and custom FAQs */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-1.5">
              <Sliders size={18} className="text-sky-600" /> Step 2: AI Employee Tone & FAQs
            </h3>
            <p className="text-xs text-slate-500 mt-1">Configure the employee's vocal personality and answer critical company questions so they can consult visitors accurately.</p>
          </div>

          <div className="space-y-4">
            {/* Speech tone toggle */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Conversation Tone / Personality</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['professional', 'friendly', 'casual', 'enthusiastic'] as const).map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                      tone === t ? 'bg-slate-800 border-slate-800 text-white shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Business Pitch & General Mission Statement *</label>
              <p className="text-[10px] text-slate-400">Describe what your business does, your specialization, experience, or standard pricing values so the AI is highly intelligent.</p>
              <textarea
                required
                rows={4}
                value={description}
                placeholder="E.g. We are a family-owned dentist clinic focused on high-quality cosmetic dentistry, gentle cleanings, and emergency crown procedures. We use advanced technology and offer transparent affordable packages..."
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-sky-500"
              />
            </div>

            {/* Custom FAQs training */}
            <div className="space-y-3 pt-3 border-t border-slate-50">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Training FAQs (Frequently Asked Questions)</h4>
                <p className="text-[10px] text-slate-500">Provide direct question-answer details for common visitor inquiries.</p>
              </div>

              {/* Added FAQs list */}
              {faqs.length > 0 && (
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {faqs.map((f, i) => (
                    <div key={i} className="flex items-start justify-between bg-slate-50 border border-slate-100 p-3 rounded-lg text-xs leading-relaxed gap-2">
                      <div>
                        <p className="font-bold text-slate-800">Q: {f.question}</p>
                        <p className="text-slate-600 text-[11px] mt-0.5">A: {f.answer}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFAQ(i)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* FAQ Entry Form */}
              <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200">
                <input
                  type="text"
                  placeholder="Is there a diagnostic fee?"
                  value={faqQ}
                  onChange={(e) => setFaqQ(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Yes, we charge a flat $49 diagnostics fee..."
                  value={faqA}
                  onChange={(e) => setFaqA(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddFAQ}
                    className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer"
                  >
                    <Plus size={12} /> Learn FAQ
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-800 px-4 py-2 text-xs font-semibold"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              onClick={() => { if (description.trim()) setStep(3); }}
              disabled={!description.trim()}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              Continue <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Menu of services offered */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-1.5">
              <FileText size={18} className="text-sky-600" /> Step 3: Core Service Catalog
            </h3>
            <p className="text-xs text-slate-500 mt-1">Teach your employee the actual services they are selling. Your AI will present these services dynamically to convert inquiries into booked calendars.</p>
          </div>

          <div className="space-y-4">
            {/* Added Services Lists */}
            {services.length > 0 && (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {services.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-3 rounded-lg text-xs gap-3">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800">{s.name}</p>
                      <p className="text-slate-500 text-[11px]">
                        Price: <span className="font-semibold text-slate-700">{s.price}</span> | Est. Duration:{' '}
                        <span className="font-semibold text-slate-700">{s.duration}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 italic line-clamp-1">{s.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveService(i)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Service Entry Form */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 space-y-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  type="text"
                  placeholder="Service Name (e.g. Tooth Whitening)"
                  value={srvName}
                  onChange={(e) => setSrvName(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Price (e.g. $250 flat fee)"
                  value={srvPrice}
                  onChange={(e) => setSrvPrice(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Duration (e.g. 1.5 hours)"
                  value={srvDur}
                  onChange={(e) => setSrvDur(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none"
                />
              </div>
              <input
                type="text"
                placeholder="Service details: custom laser procedure with whitening gels for sensitive teeth..."
                value={srvDesc}
                onChange={(e) => setSrvDesc(e.target.value)}
                className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddService}
                  className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer"
                >
                  <Plus size={12} /> Add to Catalog
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-800 px-4 py-2 text-xs font-semibold"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || services.length === 0}
              className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              {loading ? 'Hiring...' : 'Launch AI Employee'} <CheckCircle size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
