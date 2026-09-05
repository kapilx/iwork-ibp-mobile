export interface Address {
    plot_number?: string | null;
    door_number?: string | null;
    building_name?: string | null;
    street?: string | null;
    area?: string | null;
    district?: string | null;
    city?: string | null;
    state?: string | null;
    province?: string | null;
    country?: string | null;
    postal_code?: string | null;
    po_box?: string | null;
  }
  
  export interface SocialMediaHandles {
    LinkedIn?: string | null;
    Twitter?: string | null;
    Instagram?: string | null;
    Facebook?: string | null;
    WeChat?: string | null;
    WhatsApp?: string | null;
    Telegram?: string | null;
  }
  
  export interface BusinessCard {
    name?: string | null;
    job_title?: string | null;
    company_name?: string | null;
    work_phone_number?: string[] | null;
    personal_phone_number?: string[] | null;
    fax_number?: string | null;
    work_email?: string | null;
    personal_email?: string | null;
    website?: string | null;
    address?: Address[] | null;
    social_media_handles?: SocialMediaHandles | null;
    summary?: string | null;
  }
  
  export interface BusinessCardError {
    error: string;
    details?: string;
  }