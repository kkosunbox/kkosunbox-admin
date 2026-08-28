// ─── Auth ────────────────────────────────────────────────────────────────────

export type AdminRole = 'admin' | 'store_owner';

export interface AdminInfo {
  id: number;
  username: string;
  name: string;
  role: AdminRole;
}

export interface AuthState {
  accessToken: string;
  admin: AdminInfo;
}

// ─── Common ───────────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export interface ApiResponse<T> {
  result: boolean;
  data: T;
}

// ─── Payment / Orders ─────────────────────────────────────────────────────────

export type PaymentStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type DeliveryStatus = 'PendingDelivery' | 'DeliveryInProgress' | 'DeliveryCompleted';

export type PaymentType = 'initial' | 'renewal' | 'upgrade';

export interface DeliveryAddress {
  id: number;
  nickname?: string | null;
  receiverName: string;
  phoneNumber: string;
  zipCode: string;
  address: string;
  addressDetail?: string | null;
  memo?: string | null;
}

export interface ChecklistOption {
  id: number;
  text: string;
  slug: string;
  sortOrder: number;
}

export interface ChecklistAnswer {
  questionId: number;
  questionText: string;
  selectedOptions: ChecklistOption[];
}

export interface PetProfile {
  id: number;
  userId: number;
  name?: string | null;
  breed?: string | null;
  gender?: 'male' | 'female' | null;
  birthDate?: string | null;
  weight?: number | null;
  profileImageUrl?: string | null;
  specialNotes?: string | null;
  checklistAnswers?: ChecklistAnswer[];
}

export interface PlanTag {
  id: number;
  name: string;
  bgColor: string;
  textColor: string;
  isActive: boolean;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string | null;
  monthlyPrice: number;
  originalPrice?: number | null;
  discountRate?: number | null;
  isActive: boolean;
  sortOrder: number;
  tags?: PlanTag[];
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: number;
  userId: number;
  planId: number;
  petProfileId: number;
  deliveryAddressId: number;
  status: 'active' | 'cancelled' | 'paymentFailed' | 'suspended';
  quantity: number;
  anchorDay: number;
  nextBillingDate: string;
  cancelledAt?: string | null;
  renewalFailureCount: number;
  isPaused: boolean;
  plan?: SubscriptionPlan;
  petProfile?: PetProfile;
  deliveryAddress?: DeliveryAddress;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: number;
  subscriptionId: number;
  baseAmount: number;
  taxAmount: number;
  amount: number;
  planName?: string | null;
  paymentType?: PaymentType | null;
  status: PaymentStatus;
  paymentKey?: string | null;
  orderId?: string | null;
  method?: string | null;
  approvedAt?: string | null;
  failureReason?: string | null;
  userId?: number | null;
  petProfileId?: number | null;
  deliveryAddressId?: number | null;
  deliveryStatus?: DeliveryStatus | null;
  trackingNumber?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  subscription?: UserSubscription;
  createdAt: string;
  updatedAt: string;
}

// ─── Product (단건 판매) ─────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductOrder {
  id: number;
  userId: number;
  user?: User;
  productId: number;
  product?: Product;
  productName: string;
  quantity: number;
  baseAmount: number;
  taxAmount: number;
  amount: number;
  deliveryAddressId: number;
  deliveryAddress?: DeliveryAddress;
  status: PaymentStatus;
  paymentKey?: string | null;
  orderId?: string | null;
  method?: string | null;
  approvedAt?: string | null;
  failureReason?: string | null;
  deliveryStatus?: DeliveryStatus | null;
  trackingNumber?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: number;
  email: string;
  phone?: string | null;
  status: UserStatus;
  isAllowTerms: boolean;
  isAllowPrivacy: boolean;
  isAllowMarketing: boolean;
  isInfluencer?: boolean;
  influencerContractExpiresAt?: string | null;
  influencerProfile?: InfluencerProfile | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Inquiry ──────────────────────────────────────────────────────────────────

export type InquiryStatus = 'pending' | 'in_progress' | 'resolved';

export interface Inquiry {
  id: number;
  userId: number;
  title: string;
  content: string;
  attachmentUrl?: string | null;
  contact?: string | null;
  status: InquiryStatus;
  answer?: string | null;
  answeredAt?: string | null;
  deletedAt?: string | null;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

// ─── Partnership Inquiry ──────────────────────────────────────────────────────

export interface PartnershipInquiryUser {
  id: number;
  email: string;
  phone?: string | null;
}

export interface PartnershipInquiry {
  id: number;
  userId: number;
  user?: PartnershipInquiryUser | null;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  referenceLinks: string[] | null;
  content: string;
  attachmentUrls: string[] | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Coupon ───────────────────────────────────────────────────────────────────

export type CouponDiscountType = "percent" | "fixed";

export interface Coupon {
  id: number;
  code: string;
  name?: string | null;
  description?: string | null;
  discountType: CouponDiscountType;
  discountRate?: number | null;
  discountAmount?: number | null;
  applyCount: number;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCoupon {
  id: number;
  code: string;
  name?: string | null;
  description?: string | null;
  discountRate: number;
  maxDiscountAmount?: number | null;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── System Setting ───────────────────────────────────────────────────────────

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Review ───────────────────────────────────────────────────────────────────

export interface ReviewPlan {
  id: number;
  name: string;
  monthlyPrice: number;
}

export interface Review {
  id: number;
  userId: number | null;
  planId: number;
  subscriptionPaymentId: number | null;
  rating: number;
  content: string;
  imageUrls: string[] | null;
  isHidden: boolean;
  snapshotUserEmail: string | null;
  snapshotPetName: string | null;
  snapshotPetProfileImageUrl: string | null;
  plan?: ReviewPlan;
  createdAt: string;
  updatedAt: string;
}

// ─── Influencer ───────────────────────────────────────────────────────────────

export interface Influencer extends User {
  isInfluencer: boolean;
}

export interface InfluencerProfile {
  slug: string;
  displayName: string;
  profileImageUrl: string | null;
  referralCode: string;
  referralLink: string;
  discountRate: number;
  isActive: boolean;
}

export interface InfluencerDetail extends User {
  influencerContractExpiresAt: string | null;
  influencerProfile: InfluencerProfile | null;
}

export interface InfluencerMonthlySummaryItem {
  year: number;
  month: number;
  totalAmount: number;
  isSettled: boolean;
}

export interface InfluencerMonthlySummary {
  year: number;
  totalAccumulatedAmount: number;
  items: InfluencerMonthlySummaryItem[];
}

export interface InfluencerPointItem {
  id: number;
  userId: number;
  type: 'REFERRAL_REWARD';
  amount: number;
  description: string | null;
  referenceId: number | null;
  referralCode: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface InfluencerPointsResult {
  items: InfluencerPointItem[];
  total: number;
  page: number;
  limit: number;
}

export interface InfluencerSettlement {
  id: number;
  userId: number;
  year: number;
  month: number;
  totalAmount: number;
  settledByAdminId: number;
  note: string | null;
  settledAt: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalPaymentsThisMonth: number;
  amountThisMonth: number;
  pendingDelivery: number;
  unansweredInquiries: number;
  totalActiveSubscriptions: number;
  totalUsers: number;
  productPaymentsThisMonth: number;
  productAmountThisMonth: number;
  productPendingDelivery: number;
}

export type CalendarOrderType = 'subscription' | 'product';

export interface CalendarScheduledPayment {
  id: number;
  nextBillingDate: string;
  isPaused: boolean;
  plan?: { name: string };
  user?: { email: string };
}

export interface CalendarCompletedPayment {
  id: number;
  orderType: CalendarOrderType;
  userId: number | null;
  amount: number;
  label: string;
  approvedAt: string | null;
  deliveryStatus: 'PendingDelivery' | 'DeliveryInProgress';
}

export interface CalendarCompletedDelivery {
  id: number;
  orderType: CalendarOrderType;
  userId: number | null;
  trackingNumber: string | null;
  deliveredAt: string | null;
  label: string;
}

export interface DashboardCalendarResponse {
  scheduledPayments: CalendarScheduledPayment[];
  completedPayments: CalendarCompletedPayment[];
  completedPendingDeliveries: CalendarCompletedPayment[];
  completedDeliveries: CalendarCompletedDelivery[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'scheduled' | 'completed' | 'delivered';
  data?: unknown;
}
