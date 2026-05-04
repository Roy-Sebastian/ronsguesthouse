'use client';

import PublicFooter from '@/components/layout/PublicFooter';
import PublicNavbar from '@/components/layout/PublicNavbar';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { apiFetch } from '@/lib/apiFetch';
import {
  CheckCircle,
  Mail,
  MapPin,
  Phone,
  Send,
} from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await apiFetch('/public/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send message');
      }
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch {
      setError('Failed to send your message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-gray-900 font-sans selection:bg-red-900 selection:text-white">
      <PublicNavbar />

      {/* Hero Header */}
      <section className="bg-white text-gray-900 pt-32 pb-20 px-4 border-b border-gray-100">
        <ScrollReveal>
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif mb-4">Contact Us</h1>
            <div className="w-16 h-0.5 bg-red-800 mx-auto mb-6" />
            <p className="text-gray-600 font-light max-w-2xl mx-auto">
              We look forward to welcoming you. Reach out for reservations, inquiries, or bespoke requests.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* Main Content */}
      <section className="py-24 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">

        {/* Contact Info */}
        <div className="lg:w-1/3">
          <ScrollReveal>
            <h2 className="text-3xl font-serif mb-8">Get In Touch</h2>
            <p className="text-gray-600 font-light mb-12">
              Whether you're planning a grand event, looking for a luxurious getaway, or need assistance modifying your reservation, our dedicated concierge team is at your service.
            </p>

            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <MapPin className="text-red-800 w-6 h-6 shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-1">Address</h4>
                  <p className="text-gray-600 font-light">Jl. Perwira Gg. Kaliaga No.5, Gundaling I<br />Kec. Berastagi, Kabupaten Karo, Sumatera Utara 22156</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Phone className="text-red-800 w-6 h-6 shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-1">Phone</h4>
                  <p className="text-gray-600 font-light">+62 852-7158-2388</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Mail className="text-red-800 w-6 h-6 shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-1">Email</h4>
                  <p className="text-gray-600 font-light">info@ronsguesthouse.com</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Contact Form */}
        <div className="lg:w-2/3 bg-white p-8 md:p-12 shadow-[0_0_40px_rgba(0,0,0,0.03)] border border-gray-100 relative">
          <ScrollReveal>
            <h3 className="text-2xl font-serif mb-8">Send a Message</h3>

            {success && (
              <div className="mb-8 bg-green-50 text-green-900 border border-green-200 p-4 flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-light text-sm">Your message has been received. We will contact you shortly.</span>
              </div>
            )}

            {error && (
              <div className="mb-8 bg-red-50 text-red-900 border border-red-200 p-4 text-sm font-light">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border-b border-gray-300 py-2 bg-transparent focus:outline-none focus:border-red-800 transition-colors font-light text-gray-900 placeholder-gray-300"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border-b border-gray-300 py-2 bg-transparent focus:outline-none focus:border-red-800 transition-colors font-light text-gray-900 placeholder-gray-300"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border-b border-gray-300 py-2 bg-transparent focus:outline-none focus:border-red-800 transition-colors font-light text-gray-900 placeholder-gray-300"
                    placeholder="+62 812..."
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Subject *</label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full border-b border-gray-300 py-2 bg-transparent focus:outline-none focus:border-red-800 transition-colors font-light text-gray-900 placeholder-gray-300"
                    placeholder="Reservation Inquiry"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Message *</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full border-b border-gray-300 py-2 bg-transparent focus:outline-none focus:border-red-800 transition-colors font-light text-gray-900 placeholder-gray-300 resize-none"
                  placeholder="How can we assist you?"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center px-8 py-4 bg-red-800 hover:bg-black text-white text-xs font-bold uppercase tracking-[0.2em] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Message'} <Send className="w-4 h-4 ml-2" />
              </button>
            </form>
          </ScrollReveal>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
