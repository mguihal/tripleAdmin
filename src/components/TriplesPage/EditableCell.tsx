import { Form, Input } from 'antd';
import React from 'react';

interface DataType {
  key: string;
  subject: string;
  predicate: number;
  object: string;
}

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: any;
  record: DataType;
  index: number;
}

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  editing,
  dataIndex,
  title,
  record,
  index,
  children,
  ...restProps
}) => {
  return (
    <div {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              required: true,
              message: `${title} is required!`,
            },
          ]}
        >
          <Input.TextArea autoSize />
        </Form.Item>
      ) : (
        children
      )}
    </div>
  );
};

export default EditableCell;
