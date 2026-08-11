import { redirect } from 'next/navigation';

export default function ProductOrdersPage() {
  redirect('/orders?tab=product');
}
