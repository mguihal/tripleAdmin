import { Alert, AutoComplete, AutoCompleteProps, Button, Flex, Form, Input, Modal, Select } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState } from 'react';
import useQuery from '../../hooks/useQuery';
import { useAppStateContext } from '../../hooks/useAppState';
import { Triple } from './types';
import DatatypeSelect from './DatatypeSelect';

interface AddFormValues {
  triples: Triple[];
}

type Props = {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
};

const AddTriplesModal = ({ open, onClose, onAdded }: Props) => {
  const {
    state: {
      navigation: { urlObject },
    },
  } = useAppStateContext();
  const { getQuery } = useQuery(urlObject.dataset || '');

  const [addFormError, setAddFormError] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [isPredicatesFetched, setIsPredicatesFetched] = useState(false);
  const [predicates, setPredicates] = useState<string[]>([]);
  const [options, setOptions] = useState<AutoCompleteProps['options']>([]);

  const [form] = Form.useForm<AddFormValues>();
  const triples = Form.useWatch('triples', form);

  const isIRI = (triple: Triple) => triple?.object?.startsWith('<') && triple?.object?.endsWith('>');

  useEffect(() => {
    if (open && !isPredicatesFetched) {
      setIsPredicatesFetched(true);
      getQuery<'predicate'>(`SELECT DISTINCT ?predicate WHERE { ?subject ?predicate ?object }`)
        .then((response) => {
          if (response.type === 'read') {
            setPredicates(
              response.data.results.bindings.map((row) => `<${row.predicate?.value}>`).filter((e) => e !== undefined),
            );
          }
        })
        .catch((err) => {
          console.error('Error: could not load predicates:', err);
        });
    }
  }, [open, isPredicatesFetched, getQuery]);

  useEffect(() => {
    setOptions(predicates.map((p) => ({ label: p, value: p })));
  }, [predicates]);

  const handleAddTriples = useCallback(
    (values: AddFormValues) => {
      setConfirmLoading(true);
      setAddFormError(false);

      const graph = urlObject.graph || '';
      const query = `
    INSERT DATA {
      ${graph === 'default' ? '' : `GRAPH <${graph}> {`}
      ${values.triples
        .map((row) => {
          const quote = isIRI(row) ? '' : '"';
          const dataType =
            isIRI(row) || !row.datatype ? '' : `^^<${row.datatype === 'custom' ? row.customDatatype : row.datatype}>`;
          return `${row.subject} ${row.predicate} ${quote}${row.object}${quote}${dataType} .`;
        })
        .join('\n')}
      ${graph === 'default' ? '' : `}`}
    }
    `;

      getQuery(query)
        .then(() => {
          setConfirmLoading(false);
          onAdded();
        })
        .catch(() => {
          setConfirmLoading(false);
          setAddFormError(true);
        });
    },
    [getQuery, onAdded, urlObject.graph],
  );

  return (
    <Modal
      title="Add new triples"
      open={open}
      onOk={() => {}}
      okButtonProps={{ autoFocus: true, htmlType: 'submit' }}
      onCancel={onClose}
      okText="Add"
      confirmLoading={confirmLoading}
      width={1000}
      destroyOnClose
      modalRender={(dom) => (
        <Form
          form={form}
          name="tripleAddForm"
          onFinish={(values) => handleAddTriples(values)}
          autoComplete="off"
          clearOnDestroy
          initialValues={{
            triples: [{}],
          }}
        >
          {dom}
        </Form>
      )}
    >
      {addFormError && (
        <Alert
          type="error"
          message="An error happened when inserting these new rows. Please check them and retry"
          style={{ marginBottom: 16 }}
        />
      )}
      <Form.List name="triples">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Flex key={key} align="start" gap={8}>
                <Form.Item<AddFormValues['triples']>
                  {...restField}
                  name={[name, 'subject']}
                  rules={[{ required: true, message: 'Missing subject' }]}
                  style={{ flex: 1 }}
                >
                  <Input placeholder="<subject>" />
                </Form.Item>
                <Form.Item<AddFormValues['triples']>
                  {...restField}
                  name={[name, 'predicate']}
                  rules={[{ required: true, message: 'Missing predicate' }]}
                  style={{ flex: 1 }}
                >
                  <AutoComplete
                    options={options}
                    placeholder="<predicate>"
                    onSearch={(text) =>
                      setOptions(
                        predicates
                          .filter((p) => p.toLowerCase().includes(text.toLowerCase()))
                          .map((p) => ({ label: p, value: p })),
                      )
                    }
                  />
                </Form.Item>
                <Form.Item<AddFormValues['triples']>
                  {...restField}
                  name={[name, 'object']}
                  rules={[{ required: true, message: 'Missing object' }]}
                  style={{ flex: 1 }}
                >
                  <Input.TextArea autoSize placeholder="<object> or object" />
                </Form.Item>
                {isIRI(triples?.[name]) ? (
                  <Select style={{ minWidth: 150 }} placeholder="Optional type" disabled={true} defaultValue={'IRI'} />
                ) : (
                  <Form.Item<AddFormValues['triples']> {...restField} name={[name, 'datatype']}>
                    <DatatypeSelect />
                  </Form.Item>
                )}
                {triples?.[name]?.datatype === 'custom' && (
                  <Form.Item<AddFormValues['triples']>
                    {...restField}
                    name={[name, 'customDatatype']}
                    rules={[{ required: true, message: 'Missing custom datatype' }]}
                    style={{ flex: 1 }}
                  >
                    <Input placeholder="Custom datatype IRI" />
                  </Form.Item>
                )}
                <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: 8 }} />
              </Flex>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Add one more triple
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </Modal>
  );
};

export default AddTriplesModal;
