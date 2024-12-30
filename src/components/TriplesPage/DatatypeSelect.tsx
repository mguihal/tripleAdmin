import { Select, SelectProps } from "antd";

const DatatypeSelect = (props: SelectProps) => {
  return (
    <Select
      {...props}
      style={{ minWidth: 150 }}
      placeholder="Optional type"
      options={[
        {
          label: <span>String</span>,
          title: 'string',
          options: [
            {
              label: <span>String (default)</span>,
              value: 'http://www.w3.org/2001/XMLSchema#string',
            },
            { label: <span>Base64</span>, value: 'http://www.w3.org/2001/XMLSchema#base64Binary' },
            { label: <span>Token</span>, value: 'http://www.w3.org/2001/XMLSchema#token' },
          ],
        },
        {
          label: <span>Number</span>,
          title: 'number',
          options: [
            { label: <span>Integer</span>, value: 'http://www.w3.org/2001/XMLSchema#integer' },
            { label: <span>Decimal</span>, value: 'http://www.w3.org/2001/XMLSchema#decimal' },
            { label: <span>Double</span>, value: 'http://www.w3.org/2001/XMLSchema#double' },
            { label: <span>Float</span>, value: 'http://www.w3.org/2001/XMLSchema#float' },
          ],
        },
        {
          label: <span>Date</span>,
          title: 'date',
          options: [
            { label: <span>Date</span>, value: 'http://www.w3.org/2001/XMLSchema#date' },
            { label: <span>Time</span>, value: 'http://www.w3.org/2001/XMLSchema#time' },
            { label: <span>DateTime</span>, value: 'http://www.w3.org/2001/XMLSchema#dateTime' },
            { label: <span>Duration</span>, value: 'http://www.w3.org/2001/XMLSchema#duration' },
          ],
        },
        { label: <span>Custom...</span>, value: 'custom' },
      ]}
    />
  );
};

export default DatatypeSelect;
