export type DesignerId = "Edi" | "Sol";

export type BrandOption =
  | "Dr Teals"
  | "Elegant Touch"
  | "Eylure"
  | "Cantu"
  | "Other";

export interface Booking {
  id: string;
  brand: string;
  custom_brand: string | null;
  title: string;
  designer: string;
  attendees: string;
  description: string | null;
  requester_name: string;
  requester_email: string;
  start_time: string;
  end_time: string;
  edit_token: string;
  created_at: string;
  updated_at: string;
}

export interface PublicBooking {
  id: string;
  brand: string;
  custom_brand: string | null;
  designer: string;
  start_time: string;
  end_time: string;
}

export interface BlockedDay {
  id: string;
  date: string;
  reason: string | null;
  blocked_by: string | null;
  created_at: string;
}

export type SlotStatus = "available" | "booked" | "blocked" | "unavailable";

export interface DayAvailability {
  date: string;
  isBlocked: boolean;
  isShootDayCapReached: boolean;
  isExistingShootDay: boolean;
}

export interface AvailabilityResponse {
  weekStart: string;
  weekEnd: string;
  bookings: PublicBooking[];
  blockedDays: BlockedDay[];
  days: DayAvailability[];
}

export interface BookingFormInput {
  brand: BrandOption;
  customBrand?: string;
  title: string;
  designer: DesignerId;
  attendees: string;
  description?: string;
  requesterName: string;
  requesterEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  editToken?: string;
}
