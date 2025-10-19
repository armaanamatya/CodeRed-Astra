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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Send Email</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="to" className="block text-sm font-medium mb-1">
              To *
            </label>
            <input
              type="email"
              id="to"
              name="to"
              value={formData.to}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="recipient@example.com"
            />
          </div>

          <div>
            <label htmlFor="cc" className="block text-sm font-medium mb-1">
              CC
            </label>
            <input
              type="email"
              id="cc"
              name="cc"
              value={formData.cc}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="cc@example.com"
            />
          </div>

          <div>
            <label htmlFor="bcc" className="block text-sm font-medium mb-1">
              BCC
            </label>
            <input
              type="email"
              id="bcc"
              name="bcc"
              value={formData.bcc}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="bcc@example.com"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-1">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email subject"
            />
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-medium mb-1">
              Message *
            </label>
            <textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleChange}
              rows={6}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your message"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
