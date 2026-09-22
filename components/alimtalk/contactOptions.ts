import type { DeliveryContact } from '@/types';

export interface AlimtalkContactOption {
  key: string;
  phone: string;
  label: string;
}

export function buildContactOptions(
  userId: number | string,
  phone?: string | null,
  deliveryContacts?: DeliveryContact[] | null,
): AlimtalkContactOption[] {
  const options: AlimtalkContactOption[] = [];
  const memberPhone = phone?.trim();
  if (memberPhone) {
    options.push({
      key: `${userId}:member`,
      phone: memberPhone,
      label: '회원',
    });
  }

  for (const contact of deliveryContacts ?? []) {
    const deliveryPhone = contact.phoneNumber?.trim();
    if (!deliveryPhone) continue;
    const who = [contact.nickname, contact.receiverName].filter(Boolean).join(' · ');
    options.push({
      key: `${userId}:delivery:${contact.id}`,
      phone: deliveryPhone,
      label: who ? `배송지 · ${who}` : '배송지',
    });
  }

  return options;
}
