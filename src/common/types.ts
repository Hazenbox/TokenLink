// Shared TypeScript types across the application

export type CollectionType = 'primitive' | 'semantic' | 'interaction' | 'theme';

export interface AliasReference {
  type: 'VARIABLE_ALIAS';
  id: string;
}

export type VariableValue = string | number | boolean | AliasReference;
