export type Triple = {
  subject: string;
  predicate: string;
  object: string;
  datatype?: string;
  customDatatype?: string;
};

const defaultDataTypesURI = [
  'http://www.w3.org/2001/XMLSchema#string',
  'http://www.w3.org/2001/XMLSchema#base64Binary',
  'http://www.w3.org/2001/XMLSchema#token',

  'http://www.w3.org/2001/XMLSchema#integer',
  'http://www.w3.org/2001/XMLSchema#decimal',
  'http://www.w3.org/2001/XMLSchema#double',
  'http://www.w3.org/2001/XMLSchema#float',

  'http://www.w3.org/2001/XMLSchema#date',
  'http://www.w3.org/2001/XMLSchema#time',
  'http://www.w3.org/2001/XMLSchema#dateTime',
  'http://www.w3.org/2001/XMLSchema#duration',
];

export const isCustomDataType = (dataType: string) => !defaultDataTypesURI.includes(dataType);
