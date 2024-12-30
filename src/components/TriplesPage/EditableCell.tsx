import { Flex, Form, Input } from 'antd';
import React from 'react';
import DatatypeSelect from './DatatypeSelect';
import { Triple } from './types';

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

const isIRI = (object: string) => object?.startsWith('<') && object?.endsWith('>');

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  editing,
  dataIndex,
  title,
  record,
  index,
  children,
  ...restProps
}) => {
  const form = Form.useFormInstance();
  const object = Form.useWatch('object', form);
  const datatype = Form.useWatch('datatype', form);

  if (dataIndex === 'object') {
    return (
      <div {...restProps}>
        {editing ? (
          <Flex gap={8} vertical>
            <Form.Item<Triple>
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
            {!isIRI(object) && (
              <Flex gap={8}>
                <Form.Item<Triple>
                  name={'datatype'}
                  style={{ margin: 0 }}
                >
                  <DatatypeSelect />
                </Form.Item>
                {datatype === 'custom' && (
                  <Form.Item<Triple>
                    name={'customDatatype'}
                    rules={[{ required: true, message: 'Missing custom datatype' }]}
                    style={{ flex: 1, margin: 0 }}
                  >
                    <Input placeholder="Custom datatype IRI" />
                  </Form.Item>
                )}
              </Flex>
            )}
          </Flex>
        ) : (
          children
        )}
      </div>
    );
  }

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
