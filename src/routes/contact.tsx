import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { Phone, Mail, MessageSquare, Send, Copy, Check, Sparkles, Code2, Globe, ShieldCheck, ArrowRight, User, Users, Film, Palette, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout, AppBand, pageHead } from '@/components/streaming';
import { toast } from 'sonner';
import teamPhoto from '@/assets/team.jpg';
import manojPhoto from '@/assets/manoj-thota.jpg';

export const Route = createFileRoute('/contact')({
  head: () => pageHead('Contact & Team | Tadka4U', 'Get in touch with Manoj Thota and the team behind Tadka4U.'),
  component: Contact,
});

function Contact() {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      toast.success('Thank you! Your message has been sent to Manoj Thota.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 900);
  };

  return (
    <PageLayout>
      <main className="inner-page contact-page">
        <section className="contact-hero-card">
          <div className="contact-avatar-container">
            <div className="contact-avatar-ring">
              <img
                src={manojPhoto}
                alt="Manoj Thota - Designer & Developer"
                className="contact-avatar-img"
                width={160}
                height={160}
              />
            </div>
            <div className="contact-status-pill">
              <span className="contact-status-dot" />
              Available for projects
            </div>
          </div>

          <div className="contact-hero-info">
            <div className="eyebrow">
              <Sparkles className="size-3.5 text-primary" />
              <span>DESIGNER & FULL-STACK DEVELOPER</span>
            </div>
            <h1>Manoj Thota</h1>
            <p className="contact-tagline">
              Creator and developer of <strong>Tadka4U</strong>. Specializing in crafting high-impact streaming web applications, intuitive user interfaces, and high-performance digital products.
            </p>

            <div className="contact-quick-actions">
              <Button variant="cinema" asChild>
                <a href="tel:+12272585696">
                  <Phone className="size-4" />
                  Call +1 227 258 5696
                </a>
              </Button>
              <Button variant="glass" asChild>
                <a href="mailto:thotamanojnaidu@gmail.com?subject=Tadka4U%20Inquiry">
                  <Mail className="size-4" />
                  Email Manoj
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Our Team Section */}
        <section className="contact-team-section">
          <div className="contact-team-header">
            <div className="eyebrow">
              <Users className="size-3.5 text-primary" />
              <span>OUR TEAM</span>
            </div>
            <h2>The Team Behind Tadka4U</h2>
            <p className="contact-team-subtitle">
              Passionate creators, developers, and visionaries building cinematic, high-impact vertical drama experiences for audiences worldwide.
            </p>
          </div>

          <div className="team-photo-showcase">
            <div className="team-photo-frame">
              <img
                src={teamPhoto}
                alt="Tadka4U Team"
                className="team-photo-img"
                loading="eager"
              />
              <div className="team-photo-gradient" />
              <div className="team-photo-overlay-content">
                <div className="team-photo-tag">
                  <span className="team-photo-pulse-dot" />
                  <span>Tadka4U Team</span>
                </div>
                <p className="team-photo-quote">
                  "Building immersive short-format entertainment, one frame at a time."
                </p>
              </div>
            </div>
          </div>

          <div className="team-pillars-grid">
            <div className="team-pillar-card">
              <div className="team-pillar-icon engineering">
                <Laptop className="size-5" />
              </div>
              <h4>Engineering & Architecture</h4>
              <p>Scalable cloud infrastructure, ultra-fast video delivery, and reactive modern web experiences.</p>
            </div>

            <div className="team-pillar-card">
              <div className="team-pillar-icon design">
                <Palette className="size-5" />
              </div>
              <h4>Product Design & UX</h4>
              <p>Cinematic aesthetics, dark-mode immersion, and seamless navigation tailored for drama fans.</p>
            </div>

            <div className="team-pillar-card">
              <div className="team-pillar-icon creative">
                <Film className="size-5" />
              </div>
              <h4>Creative Direction</h4>
              <p>Curating binge-worthy vertical mini-series, rich emotional narratives, and fresh episodic content.</p>
            </div>
          </div>
        </section>

        <section className="contact-grid">
          <div className="contact-card">
            <div className="contact-card-icon phone">
              <Phone className="size-5" />
            </div>
            <h3>Direct Phone</h3>
            <p className="contact-card-value">+1 227 258 5696</p>
            <p className="contact-card-desc">Call or message directly for collaborations, inquiries, or opportunities.</p>
            <div className="contact-card-buttons">
              <Button variant="cinema" size="sm" asChild>
                <a href="tel:+12272585696">Call Now</a>
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={() => copyToClipboard('+12272585696', 'Phone number')}
              >
                {copiedField === 'Phone number' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copiedField === 'Phone number' ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-card-icon email">
              <Mail className="size-5" />
            </div>
            <h3>Email Address</h3>
            <p className="contact-card-value">thotamanojnaidu@gmail.com</p>
            <p className="contact-card-desc">Official email address for design consultations and project proposals.</p>
            <div className="contact-card-buttons">
              <Button variant="cinema" size="sm" asChild>
                <a href="mailto:thotamanojnaidu@gmail.com">Send Email</a>
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={() => copyToClipboard('thotamanojnaidu@gmail.com', 'Email')}
              >
                {copiedField === 'Email' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copiedField === 'Email' ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-card-icon handle">
              <User className="size-5" />
            </div>
            <h3>Handle & Profile</h3>
            <p className="contact-card-value">thotamanojnaidu</p>
            <p className="contact-card-desc">Connect across platforms with user handle @thotamanojnaidu.</p>
            <div className="contact-card-buttons">
              <Button
                variant="glass"
                size="sm"
                className="w-full"
                onClick={() => copyToClipboard('thotamanojnaidu', 'Handle')}
              >
                {copiedField === 'Handle' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copiedField === 'Handle' ? 'Copied Handle' : 'Copy @thotamanojnaidu'}
              </Button>
            </div>
          </div>
        </section>

        <section className="contact-form-section">
          <div className="contact-form-card">
            <div className="contact-form-header">
              <div className="eyebrow">
                <MessageSquare className="size-3.5 text-primary" />
                <span>DIRECT MESSAGE</span>
              </div>
              <h2>Send a message to Manoj</h2>
              <p className="section-subtitle">
                Have a question or looking to build a new product? Leave your message below.
              </p>
            </div>

            <form onSubmit={handleSendMessage} className="contact-form">
              <div className="form-row-2">
                <div className="form-field">
                  <label htmlFor="contact-name">Your Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="contact-input"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="contact-email">Email Address</label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. sarah@example.com"
                    className="contact-input"
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="contact-subject">Subject</label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Collaboration on next streaming platform"
                  className="contact-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share details about your inquiry or project..."
                  className="contact-textarea"
                />
              </div>

              <Button variant="cinema" type="submit" disabled={isSending} className="w-full sm:w-auto">
                <Send className="size-4" />
                {isSending ? 'Sending message...' : 'Send Message'}
              </Button>
            </form>
          </div>
        </section>

        <AppBand />
      </main>
    </PageLayout>
  );
}
