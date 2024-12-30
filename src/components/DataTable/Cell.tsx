import { Flex, Typography } from 'antd';
import { LinkOutlined, FontSizeOutlined, NodeIndexOutlined } from '@ant-design/icons';
import DataTypeTag from './DataTypeTag';

type Props = {
  data: { type: string; datatype?: string; value: string };
};

const Cell = ({ data }: Props) => {
  return (
    <Flex gap={8} align="center">
      <>
        {data?.type === 'uri' && <LinkOutlined style={{ color: 'rgb(4 127 209)' }} />}
        {data?.type === 'literal' && !data?.datatype && <FontSizeOutlined />}
        {data?.type === 'bnode' && <NodeIndexOutlined />}
      </>
      {data?.datatype && <DataTypeTag type={data.datatype} />}
      <Typography.Paragraph
        style={{ margin: 0, wordBreak: 'break-all' }}
      >
        {data?.type === 'uri' && <span style={{ color: 'rgb(4 127 209)' }}>{`<${data?.value}>`}</span>}
        {data?.type === 'literal' && data?.value}
        {data?.type === 'bnode' && data?.value}
      </Typography.Paragraph>
    </Flex>
  );
};

export default Cell;
