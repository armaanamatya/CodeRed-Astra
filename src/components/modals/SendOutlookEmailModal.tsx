'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { OutlookEmailData } from '@/types/event.d';

interface SendOutlookEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (emailData: OutlookEmailData) => void;
}

export default function SendOutlookEmailModal({ 
  isOpen, 
  onClose, 
  onSubmit 
}: SendOutlookEmailModalProps) {
  const [formData, setFormData] = useState<OutlookEmailData>({
    to: '',
    subject: '',
    body: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.to || !formData.subject || !formData.body) {
      alert('Please fill in all required fields');
      return;
    }

    onSubmit(formData);
    setFormData({
      to: '',
      subject: '',
      body: '',
    });
    onClose();
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
        <h2 className="text-xl font-bold mb-4 text-theme-foreground">Send Outlook Email</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="to" className="block text-sm font-medium text-theme-foreground mb-1">
              To *
            </label>
            <input
              type="email"
              id="to"
              name="to"
              value={formData.to}
              onChange={handleChange}
              className="w-full px-3 py-2 border-theme-border border rounded-md bg-theme-background text-theme-foreground placeholder-theme-muted-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all duration-200"
              placeholder="recipient@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-theme-foreground mb-1">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-3 py-2 border-theme-border border rounded-md bg-theme-background text-theme-foreground placeholder-theme-muted-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all duration-200"
              placeholder="Enter email subject"
              required
            />
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-medium text-theme-foreground mb-1">
              Message *
            </label>
            <textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleChange}
              rows={6}
              className="w-full px-3 py-2 border-theme-border border rounded-md bg-theme-background text-theme-foreground placeholder-theme-muted-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Enter your message"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              onClick={onClose} 
              variant="outline"
              className="hover:bg-theme-hover hover:border-theme-hover hover:text-theme-foreground transition-all duration-200 hover:shadow-md"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-theme-primary hover:bg-theme-accent text-theme-primary-foreground hover:text-theme-accent-foreground transition-all duration-200 hover:shadow-lg"
            >
              Send Email
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
