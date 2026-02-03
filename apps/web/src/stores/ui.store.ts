// UI Store (Zustand)
// Manages global UI state including modals, toasts, sidebar, etc.

import { create } from 'zustand';
import type { Booking, TimeSlot } from '@/lib/bookings-api';

// ============================================
// Booking Modal Types
// ============================================

export type BookingModalMode = 'view' | 'create' | 'edit';

export interface BookingModalState {
  isOpen: boolean;
  mode: BookingModalMode;
  /** Booking data for view/edit mode */
  booking: Booking | null;
  /** TimeSlot data for create mode */
  slot: TimeSlot | null;
  /** Additional context data */
  courtName?: string;
  facilityName?: string;
  date?: string;
  /** Currency code for price display */
  currencyCode?: string;
  /** Deposit percentage for calculations */
  depositPercentage?: number;
}

// ============================================
// Generic Modal Types
// ============================================

export type ModalType =
  | 'confirm'
  | 'alert'
  | 'customer-search'
  | 'customer-create'
  | 'payment-link'
  | null;

export interface GenericModalState {
  isOpen: boolean;
  type: ModalType;
  title?: string;
  message?: string;
  data?: unknown;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

// ============================================
// Toast Types
// ============================================

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

// ============================================
// UI State Interface
// ============================================

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Booking Modal
  bookingModal: BookingModalState;

  // Generic Modal
  genericModal: GenericModalState;

  // Toasts
  toasts: Toast[];

  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Booking Modal actions
  openBookingModal: (params: {
    mode: BookingModalMode;
    booking?: Booking | null;
    slot?: TimeSlot | null;
    courtName?: string;
    facilityName?: string;
    date?: string;
    currencyCode?: string;
    depositPercentage?: number;
  }) => void;
  closeBookingModal: () => void;
  updateBookingModalData: (data: Partial<BookingModalState>) => void;

  // Generic Modal actions
  openGenericModal: (params: Omit<GenericModalState, 'isOpen'>) => void;
  closeGenericModal: () => void;
  openConfirmModal: (params: {
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }) => void;
  openAlertModal: (params: {
    title: string;
    message: string;
    onConfirm?: () => void;
  }) => void;

  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// ============================================
// Initial States
// ============================================

const initialBookingModalState: BookingModalState = {
  isOpen: false,
  mode: 'view',
  booking: null,
  slot: null,
  courtName: undefined,
  facilityName: undefined,
  date: undefined,
  currencyCode: 'ARS',
  depositPercentage: 50,
};

const initialGenericModalState: GenericModalState = {
  isOpen: false,
  type: null,
  title: undefined,
  message: undefined,
  data: undefined,
  onConfirm: undefined,
  onCancel: undefined,
};

// ============================================
// Store Implementation
// ============================================

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  sidebarOpen: true,
  sidebarCollapsed: false,
  bookingModal: initialBookingModalState,
  genericModal: initialGenericModalState,
  toasts: [],

  // ==========================================
  // Sidebar Actions
  // ==========================================

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed });
  },

  // ==========================================
  // Booking Modal Actions
  // ==========================================

  openBookingModal: ({
    mode,
    booking = null,
    slot = null,
    courtName,
    facilityName,
    date,
    currencyCode = 'ARS',
    depositPercentage = 50,
  }) => {
    set({
      bookingModal: {
        isOpen: true,
        mode,
        booking,
        slot,
        courtName,
        facilityName,
        date,
        currencyCode,
        depositPercentage,
      },
    });
  },

  closeBookingModal: () => {
    set({
      bookingModal: initialBookingModalState,
    });
  },

  updateBookingModalData: (data: Partial<BookingModalState>) => {
    set((state) => ({
      bookingModal: {
        ...state.bookingModal,
        ...data,
      },
    }));
  },

  // ==========================================
  // Generic Modal Actions
  // ==========================================

  openGenericModal: (params) => {
    set({
      genericModal: {
        ...params,
        isOpen: true,
      },
    });
  },

  closeGenericModal: () => {
    // Call onCancel if defined before closing
    const { genericModal } = get();
    if (genericModal.onCancel) {
      genericModal.onCancel();
    }
    set({
      genericModal: initialGenericModalState,
    });
  },

  openConfirmModal: ({ title, message, onConfirm, onCancel }) => {
    set({
      genericModal: {
        isOpen: true,
        type: 'confirm',
        title,
        message,
        onConfirm,
        onCancel,
      },
    });
  },

  openAlertModal: ({ title, message, onConfirm }) => {
    set({
      genericModal: {
        isOpen: true,
        type: 'alert',
        title,
        message,
        onConfirm,
      },
    });
  },

  // ==========================================
  // Toast Actions
  // ==========================================

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));
