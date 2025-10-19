'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { EmailData } from '@/types/event.d';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (emailData: EmailData) => void;
}

export default function SendEmailModal({ isOpen, onClose, onSubmit }: SendEmailModalProps) {
  const [formData, setFormData] = useState<EmailData>({
    to: '',
    subject: '',
    body: '',
    cc: '',
    bcc: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      setFormData({
        to: '',
        subject: '',
        body: '',
        cc: '',
        bcc: '',
      });
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] pt-20">
      <div className="bg-theme-background border-theme-border border rounded-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto shadow-2xl backdrop-blur-sm">
        <h2 className="text-xl font-semibold mb-4 text-theme-foreground">Send Email</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="to" className="block text-sm font-medium mb-1 text-theme-foreground">
              To *
            </label>
            <input
              type="email"
              id="to"
              name="to"
              value={formData.to}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border-theme-border border rounded-md bg-theme-background text-theme-foreground placeholder-theme-muted-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all duration-200"
              placeholder="recipient@example.com"
            />
          </div>

          <div>
            <label htmlFor="cc" className="block text-sm font-medium mb-1 text-theme-foreground">
              CC
            </label>
            <input
              type="email"
              id="cc"
              name="cc"
              value={formData.cc}
              onChange={handleChange}
              className="w-full px-3 py-2 border-theme-border border rounded-md bg-theme-background text-theme-foreground placeholder-theme-muted-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all duration-200"
              placeholder="cc@example.com"
            />
          </div>

          <div>
            <label htmlFor="bcc" className="block text-sm font-medium mb-1 text-theme-foreground">
              BCC
            </label>
            <input
              type="email"
              id="bcc"
              name="bcc"
              value={formData.bcc}
              onChange={handleChange}
              className="w-full px-3 py-2 border-theme-border border rounded-md bg-theme-background text-theme-foreground placeholder-theme-muted-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all duration-200"
              placeholder="bcc@example.com"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-1 text-theme-foreground">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border-theme-border border rounded-md bg-theme-background text-theme-foreground placeholder-theme-muted-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all duration-200"
              placeholder="Enter email subject"
            />
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-medium mb-1 text-theme-foreground">
              Message *
            </label>
            <textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleChange}
              rows={6}
              required
              className="w-full px-3 py-2 border-theme-border border rounded-md bg-theme-background text-theme-foreground placeholder-theme-muted-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Enter your message"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="hover:bg-theme-hover hover:border-theme-hover hover:text-theme-foreground transition-all duration-200 hover:shadow-md"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-theme-primary hover:bg-theme-accent text-theme-primary-foreground hover:text-theme-accent-foreground transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
