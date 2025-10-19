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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Send Outlook Email</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
              To *
            </label>
            <input
              type="email"
              id="to"
              name="to"
              value={formData.to}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button type="submit">
              Send Email
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
