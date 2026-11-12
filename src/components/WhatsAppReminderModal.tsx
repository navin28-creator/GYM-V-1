import React, { useState } from 'react';
import { Member } from '../types/gym';
import { formatINR, formatKolkataDate } from '../services/crypto';
import { X, MessageSquare, Copy, Check, ExternalLink, Send } from 'lucide-react';

interface WhatsAppReminderModalProps {
  member: Member;
  outstandingBalanceInr: number;
  dueDate?: string;
  onClose: () => void;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  member,
  outstandingBalanceInr,
  dueDate,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const gymName = 'Flex & Flow Gym';
  const gymUpi = 'flexflow.gym@icici';

  const defaultMessage = `Hi ${member.fullName}, greetings from ${gymName}! 

This is a gentle reminder that your gym membership fee of ${formatINR(
    outstandingBalanceInr
  )} is pending${dueDate ? ` (Due: ${formatKolkataDate(dueDate)})` : ''}.

Please complete your payment via UPI to:
UPI ID: ${gymUpi}
Or settle at the front desk (Cash/Card).

Once paid, please share the transaction screenshot or UTR number so our staff can record your receipt. See you at your workout today! 💪`;

  const [messageText, setMessageText] = useState(defaultMessage);

  // Clean phone number for WhatsApp link (India +91)
  const cleanPhone = member.phone.replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone.replace(/^0+/, '')}`;

  const whatsappUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(messageText)}`;
  const smsUrl = `sms:${member.phone}?body=${encodeURIComponent(messageText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span className="text-base font-semibold text-white">Payment Reminder Composer</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-neutral-950/60 border border-neutral-800 rounded-lg text-xs">
            <div>
              <span className="text-neutral-400 block">Recipient Member:</span>
              <span className="font-semibold text-neutral-200 text-sm">{member.fullName}</span>
              <span className="text-neutral-400 font-mono block">{member.phone}</span>
            </div>
            <div className="text-right">
              <span className="text-neutral-400 block">Outstanding Balance:</span>
              <span className="font-bold text-amber-400 text-base font-mono tabular-nums">
                {formatINR(outstandingBalanceInr)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase">
              Prepared Message Text (Editable)
            </label>
            <textarea
              rows={8}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-400 font-mono leading-relaxed"
            />
          </div>

          <div className="text-xs text-neutral-400 bg-neutral-950/40 p-3 rounded-lg border border-neutral-800/80">
            <span className="font-semibold text-neutral-300 block mb-0.5">Note on privacy & payments:</span>
            Reminders are dispatched directly through your device's native WhatsApp or SMS application. Flex & Flow does not process card credentials or store banking data.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-950/80">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <a
              href={smsUrl}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <span>SMS App</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors font-semibold shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Open in WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
