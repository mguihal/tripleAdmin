import { Tag } from 'antd';

type Props = {
  type: string;
};

const mapping: Record<string, { label: string; color: string }> = {
  'http://www.w3.org/2001/XMLSchema#integer': { label: 'Integer', color: '#53BAFF' },
  'http://www.w3.org/2001/XMLSchema#decimal': { label: 'Decimal', color: '#53BAFF' },
  'http://www.w3.org/2001/XMLSchema#double': { label: 'Double', color: '#53BAFF' },
  'http://www.w3.org/2001/XMLSchema#float': { label: 'Float', color: '#53BAFF' },

  'http://www.w3.org/2001/XMLSchema#boolean': { label: 'Boolean', color: '#3CB059' },

  'http://www.w3.org/2001/XMLSchema#date': { label: 'Date', color: '#FF7B53' },
  'http://www.w3.org/2001/XMLSchema#time': { label: 'Time', color: '#FF7B53' },
  'http://www.w3.org/2001/XMLSchema#dateTime': { label: 'DateTime', color: '#FF7B53' },
  'http://www.w3.org/2001/XMLSchema#duration': { label: 'Duration', color: '#FF7B53' },

  'http://www.w3.org/2001/XMLSchema#string': { label: 'String', color: '#047FD1' },
  'http://www.w3.org/2001/XMLSchema#base64Binary': { label: 'Base64', color: '#047FD1' },
  'http://www.w3.org/2001/XMLSchema#token': { label: 'Token', color: '#047FD1' },
};

const DataTypeTag = ({ type }: Props) => {
  const attrs = mapping[type];
  return attrs ? (
    <Tag style={{ marginInlineEnd: 0 }} color={attrs.color}>
      {attrs.label}
    </Tag>
  ) : (
    <Tag style={{ marginInlineEnd: 0 }} color="#047FD1">
      {type}
    </Tag>
  );
};

export default DataTypeTag;
