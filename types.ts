
export type SourceType = 'LOCAL' | 'DRIVE';

export interface NIDRecord {
  id: string;
  fullNameEn: string;
  fullNameBn: string;
  fatherNameEn?: string;
  fatherNameBn?: string;
  motherNameEn?: string;
  motherNameBn?: string;
  addressEn?: string;
  addressBn?: string;
  voterSerial?: string;
  nidNumber: string;
  dateOfBirth: string;
  bloodGroup?: string;
  sourceFile: string;
  sourceType: SourceType;
  rawText?: string;
}

export interface SearchFilters {
  nidQuery: string;
  dob: string;
}

export enum AppView {
  SEARCH = 'SEARCH',
  INDEXER = 'INDEXER',
}
