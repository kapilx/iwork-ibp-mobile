export interface CurrencyLookup {
    id: number;
    lookUpValue: string;
    lookUpKey: string;
    lookUpName: string;
  }
  
  export interface MasterApiResponse {
    data?: CurrencyLookup[];
  }